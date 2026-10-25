import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Window } from "happy-dom";
const base = new URL("../", import.meta.url);
function setup(result) {
  const window = new Window({ url: "https://www.neodat.net/contacto.html" });
  window.document.write(readFileSync(new URL("contacto.html", base), "utf8"));
  window.NEODAT_SUPABASE_CONFIG = {
    turnstileSiteKey: "key",
    contactEndpoint: "https://example.test/contact",
  };
  window.turnstile = {
    render: (selector, options) => {
      options.callback("captcha");
      return 1;
    },
    reset() {},
  };
  let calls = 0;
  window.neodatAnalytics = {
    saveLead: async () => {
      calls++;
      return result;
    },
  };
  window.eval(readFileSync(new URL("assets/contact.js", base), "utf8"));
  window.document.head.lastElementChild.dispatchEvent(new window.Event("load"));
  const form = window.document.querySelector("form");
  for (const [id, value] of [
    ["nombre", "Test Person"],
    ["correo", "test@example.com"],
    ["mensaje", "A valid message"],
  ])
    window.document.getElementById(id).value = value;
  form.querySelector('[name="privacy"]').checked = true;
  return {
    window,
    form,
    get calls() {
      return calls;
    },
  };
}
async function submit(app) {
  app.form.dispatchEvent(new app.window.Event("submit", { cancelable: true }));
  await new Promise(setImmediate);
}
test("failed contact preserves input and offers explicit mail fallback", async () => {
  const app = setup({ ok: false, status: 503 });
  await submit(app);
  assert.equal(app.calls, 1);
  assert.equal(
    app.window.document.getElementById("nombre").value,
    "Test Person",
  );
  assert.match(
    app.window.document.getElementById("contactStatus").textContent,
    /No pudimos confirmar/,
  );
  assert.equal(app.window.location.protocol, "https:");
  assert.equal(
    app.window.document.getElementById("contactEmailFallback").hidden,
    false,
  );
  await app.window.happyDOM.close();
});
test("confirmed contact resets form and reports success", async () => {
  const app = setup({ ok: true, status: 200 });
  await submit(app);
  assert.equal(app.window.document.getElementById("nombre").value, "");
  assert.equal(
    app.window.document.getElementById("contactStatus").dataset.state,
    "success",
  );
  await app.window.happyDOM.close();
});
