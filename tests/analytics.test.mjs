import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Window } from "happy-dom";
const source = readFileSync(
  new URL("../assets/neodat-analytics.js", import.meta.url),
  "utf8",
);
function setup({
  consent = null,
  blockedStorage = false,
  status = 201,
  gpc = false,
  storedSession = null,
} = {}) {
  const window = new Window({
    url: "https://www.neodat.net/contacto.html?email=private@example.com",
  });
  window.document.write(
    "<html><head><title>Contacto</title></head><body></body></html>",
  );
  const requests = [];
  window.NEODAT_SUPABASE_CONFIG = {
    url: "https://example.supabase.co",
    anonKey: "sb_publishable_test",
    contactEndpoint: "https://example.supabase.co/functions/v1/submit-contact",
    turnstileSiteKey: "public",
  };
  window.fetch = async (url, options) => {
    requests.push({ url, body: JSON.parse(options.body) });
    return { ok: status < 300, status };
  };
  if (consent) window.localStorage.setItem("neodat_analytics_consent", consent);
  if (storedSession)
    window.localStorage.setItem(
      "neodat_analytics_session_v2",
      JSON.stringify(storedSession),
    );
  if (blockedStorage)
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("denied");
      },
    });
  if (gpc)
    Object.defineProperty(window.navigator, "globalPrivacyControl", {
      value: true,
    });
  window.eval(source);
  return { window, requests, api: window.neodatAnalytics };
}
test("no tracking or identifier without consent", async () => {
  const { window, requests, api } = setup();
  await api.track("page_view");
  assert.equal(requests.length, 0);
  assert.equal(window.localStorage.getItem("neodat_visitor_id"), null);
  await window.happyDOM.close();
});
test("denied storage and global privacy control do not break the site", async () => {
  for (const options of [
    { blockedStorage: true },
    { consent: "accepted", gpc: true },
  ]) {
    const { window, requests } = setup(options);
    assert.equal(requests.length, 0);
    await window.happyDOM.close();
  }
});
test("tracking strips URL parameters and contact navigation is not a conversion", async () => {
  const { window, requests, api } = setup({ consent: "accepted" });
  await api.track("meeting_click");
  assert.equal(requests[0].body.page_path, "/contacto.html");
  assert.equal(requests.at(-1).body.is_conversion, false);
  assert.ok(!JSON.stringify(requests).includes("private@example.com"));
  await window.happyDOM.close();
});
test("failed lead creates no form conversion; successful lead does", async () => {
  for (const status of [503, 200]) {
    const { window, requests, api } = setup({ consent: "accepted", status });
    const result = await api.saveLead(
      { name: "Test", services: [] },
      { requestId: crypto.randomUUID(), captchaToken: "token" },
    );
    assert.equal(result.ok, status === 200);
    assert.equal(
      requests.some((row) => row.body.event_type === "contact_form"),
      status === 200,
    );
    await window.happyDOM.close();
  }
});
test("withdrawal stops tracking and removes identifiers", async () => {
  const { window, requests, api } = setup({ consent: "accepted" });
  api.setConsent("rejected");
  const count = requests.length;
  await api.track("page_view");
  assert.equal(requests.length, count);
  assert.equal(window.localStorage.getItem("neodat_visitor_id"), null);
  await window.happyDOM.close();
});
test("sessions expire after 30 idle minutes and remain stable while active", async () => {
  const stored = {
    id: "session_previous_1234567890",
    lastAt: Date.now() - 31 * 60000,
    startedAt: new Date().toISOString(),
    landing: "/index.html",
    source: "",
  };
  const expired = setup({ consent: "accepted", storedSession: stored });
  assert.notEqual(expired.requests[0].body.session_id, stored.id);
  await expired.window.happyDOM.close();
  stored.lastAt = Date.now();
  const active = setup({ consent: "accepted", storedSession: stored });
  assert.equal(active.requests[0].body.session_id, stored.id);
  await active.window.happyDOM.close();
});
