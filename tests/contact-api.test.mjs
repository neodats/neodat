import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const source = readFileSync(
  new URL("../supabase/functions/submit-contact/index.ts", import.meta.url),
  "utf8",
);
function setup({ captcha = true, rate = true, writeError = null } = {}) {
  let handler;
  const writes = [];
  let verifications = 0;
  const db = {
    rpc: async () => ({ data: rate, error: null }),
    from: () => ({
      upsert: async (payload) => {
        writes.push(payload);
        return { error: writeError };
      },
    }),
  };
  const context = vm.createContext({
    Deno: {
      env: {
        get: (key) =>
          ({
            TURNSTILE_SECRET_KEY: "secret",
            CONTACT_RATE_SALT: "salt",
            SUPABASE_URL: "url",
            SUPABASE_SERVICE_ROLE_KEY: "secret",
          })[key],
      },
      serve: (fn) => {
        handler = fn;
      },
    },
    createClient: () => db,
    Request,
    Response,
    URL,
    URLSearchParams,
    TextDecoder,
    TextEncoder,
    Uint8Array,
    AbortSignal,
    crypto,
    console,
    fetch: async () => {
      verifications++;
      return new Response(
        JSON.stringify({
          success: captcha,
          hostname: "www.neodat.net",
          action: "contact",
        }),
      );
    },
  });
  const js = ts.transpileModule(source.replace(/^import .*$/m, ""), {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInContext(js, context);
  return {
    handler,
    writes,
    get verifications() {
      return verifications;
    },
  };
}
const payload = () => ({
  request_id: crypto.randomUUID(),
  name: "Test User",
  email: "test@example.com",
  company: "",
  phone: "",
  city: "",
  message: "A valid request",
  priority: "Consulta general",
  services: ["Análisis de datos"],
  captcha_token: "token",
  website: "",
});
const request = (body = payload(), origin = "https://www.neodat.net") =>
  new Request("https://example.supabase.co/functions/v1/submit-contact", {
    method: "POST",
    headers: {
      origin,
      "content-type": "application/json",
      "x-forwarded-for": "192.0.2.1",
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
test("contact endpoint rejects origins, invalid data and oversized body", async () => {
  const app = setup();
  assert.equal(
    (await app.handler(request(payload(), "https://evil.example"))).status,
    403,
  );
  assert.equal(
    (await app.handler(request({ ...payload(), email: "invalid" }))).status,
    400,
  );
  assert.equal(
    (await app.handler(request({ ...payload(), website: "spam" }))).status,
    400,
  );
  assert.equal((await app.handler(request("{not json}"))).status, 400);
  assert.equal((await app.handler(request("x".repeat(16001)))).status, 413);
  assert.equal(app.writes.length, 0);
  assert.equal(app.verifications, 0);
});
test("contact endpoint requires CAPTCHA and database rate allowance", async () => {
  for (const [options, expected] of [
    [{ captcha: false }, 400],
    [{ rate: false }, 429],
  ]) {
    const app = setup(options);
    assert.equal((await app.handler(request())).status, expected);
    assert.equal(app.writes.length, 0);
  }
});
test("contact endpoint writes only validated allowed columns", async () => {
  const app = setup();
  const body = {
    ...payload(),
    notes: "injected",
    status: "Cerrado",
    created_at: "2000-01-01",
  };
  const response = await app.handler(request(body));
  assert.equal(response.status, 200);
  assert.equal(app.writes[0].status, "Nuevo");
  assert.equal(app.writes[0].notes, undefined);
  assert.equal(app.writes[0].created_at, undefined);
});
