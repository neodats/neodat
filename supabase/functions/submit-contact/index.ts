// Contact ingress: public HTTP endpoint, verified CAPTCHA, server-side validation.
import { createClient } from "npm:@supabase/supabase-js@2.118.0";
const allowed = (
  Deno.env.get("ALLOWED_ORIGINS") || "https://www.neodat.net,https://neodat.net"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const maxBody = 16000;
Deno.serve(async (request) => {
  const origin = request.headers.get("origin") || "";
  const headers = {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : "null",
    "Access-Control-Allow-Headers": "content-type, apikey",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };
  const reply = (status: number, error?: string) =>
    new Response(JSON.stringify(error ? { error } : { ok: true }), {
      status,
      headers,
    });
  if (!allowed.includes(origin)) return reply(403, "origin_not_allowed");
  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return reply(405, "method_not_allowed");
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .includes("application/json")
  )
    return reply(415, "json_required");
  const captchaSecret = Deno.env.get("TURNSTILE_SECRET_KEY");
  const salt = Deno.env.get("CONTACT_RATE_SALT");
  const dbUrl = Deno.env.get("SUPABASE_URL");
  const dbKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!captchaSecret || !salt || !dbUrl || !dbKey)
    return reply(503, "not_configured");
  try {
    // Bound the streamed body too; Content-Length is optional and untrusted.
    const reader = request.body?.getReader();
    if (!reader) return reply(400, "invalid_body");
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.length;
      if (bytes > maxBody) {
        await reader.cancel();
        return reply(413, "payload_too_large");
      }
      chunks.push(value);
    }
    const buffer = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.length;
    }
    const input = JSON.parse(new TextDecoder().decode(buffer));
    if (!input || typeof input !== "object" || Array.isArray(input))
      return reply(400, "invalid_body");
    if (input.website) return reply(400, "invalid_submission");
    const text = (key: string, min: number, max: number) => {
      const value = input[key] == null ? "" : input[key];
      if (
        typeof value !== "string" ||
        value.trim().length < min ||
        value.trim().length > max
      )
        throw new Error("validation");
      return value.trim();
    };
    const payload = {
      request_id: text("request_id", 36, 36),
      name: text("name", 2, 180),
      email: text("email", 5, 250),
      company: text("company", 0, 180) || null,
      phone: text("phone", 0, 80) || null,
      city: text("city", 0, 150) || null,
      message: text("message", 2, 4000),
      priority: text("priority", 1, 100),
      services: input.services,
      status: "Nuevo",
    };
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        payload.request_id,
      ) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)
    )
      return reply(400, "invalid_fields");
    const services = new Set([
      "Análisis de datos",
      "Consultoría financiera",
      "Dashboards y KPI",
      "Creación de proyectos",
      "Página web corporativa",
      "Control de gestión",
    ]);
    if (
      !Array.isArray(payload.services) ||
      payload.services.length > 6 ||
      payload.services.some(
        (s: unknown) => typeof s !== "string" || !services.has(s),
      )
    )
      return reply(400, "invalid_services");
    if (
      ![
        "Consulta general",
        "Requerimiento prioritario",
        "Proyecto próximo a iniciar",
      ].includes(payload.priority)
    )
      return reply(400, "invalid_priority");
    const token = text("captcha_token", 1, 2048);
    const verification = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        signal: AbortSignal.timeout(5000),
        body: new URLSearchParams({ secret: captchaSecret, response: token }),
      },
    );
    if (!verification.ok) return reply(503, "verification_unavailable");
    const captcha = await verification.json();
    const hostnames = allowed.map((value) => new URL(value).hostname);
    if (
      !captcha.success ||
      captcha.action !== "contact" ||
      !hostnames.includes(captcha.hostname)
    )
      return reply(400, "verification_failed");
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("cf-connecting-ip") ||
      "unknown";
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(`${salt}:${ip}`),
    );
    const bucket = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
    const client = createClient(dbUrl, dbKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: permitted, error: limitError } = await client.rpc(
      "claim_contact_slot",
      { p_bucket: bucket },
    );
    if (limitError) return reply(503, "submission_unavailable");
    if (!permitted) return reply(429, "rate_limit");
    // Retrying a request after a lost response never creates another lead.
    const { error } = await client
      .from("contact_leads")
      .upsert(payload, { onConflict: "request_id", ignoreDuplicates: true });
    if (error) {
      console.error("Contact write failed", error.code);
      return reply(503, "submission_unavailable");
    }
    return reply(200);
  } catch (error) {
    if (
      error instanceof SyntaxError ||
      (error instanceof Error && error.message === "validation")
    )
      return reply(400, "invalid_fields");
    return reply(503, "submission_unavailable");
  }
});
