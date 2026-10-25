import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { Window } from "happy-dom";
const base = new URL("../", import.meta.url);
async function page(path, options = {}) {
  const window = new Window({
    url: "https://www.neodat.net/" + path,
    settings: {
      disableCSSFileLoading: true,
      disableJavaScriptFileLoading: true,
    },
  });
  if (options.reducedMotion) {
    const originalMatch = window.matchMedia.bind(window);
    window.matchMedia = (query) =>
      query.includes("prefers-reduced-motion")
        ? {
            matches: query.includes(": reduce)"),
            media: query,
            addEventListener() {},
            removeEventListener() {},
            addListener() {},
            removeListener() {},
          }
        : originalMatch(query);
  }
  const errors = [];
  window.addEventListener("error", (event) =>
    errors.push(event.error || event.message),
  );
  window.document.write(readFileSync(new URL(path, base), "utf8"));
  window.fetch = async () => {
    throw new Error("Unexpected network access");
  };
  const noop = () => {};
  window.HTMLCanvasElement.prototype.getContext = function () {
    return new Proxy(
      {
        canvas: this,
        measureText: () => ({ width: 50 }),
        createLinearGradient: () => ({ addColorStop: noop }),
        createRadialGradient: () => ({ addColorStop: noop }),
      },
      {
        get: (obj, key) => (key in obj ? obj[key] : noop),
        set: (obj, key, value) => {
          obj[key] = value;
          return true;
        },
      },
    );
  };
  for (const script of window.document.querySelectorAll("script[src]")) {
    const src = script.getAttribute("src");
    if (/^https?:/.test(src)) continue;
    try {
      window.eval(readFileSync(new URL(src, new URL(path, base)), "utf8"));
    } catch (error) {
      errors.push(error);
    }
  }
  window.document.dispatchEvent(new window.Event("DOMContentLoaded"));
  await new Promise(setImmediate);
  return { window, errors };
}
test("corporate pages and all nine simulators initialize without runtime errors", async () => {
  const paths = [
    "index.html",
    "servicios.html",
    "metodo.html",
    "ambitos.html",
    "quienes-somos.html",
    "contacto.html",
    "simuladores.html",
    "privacidad.html",
    ...readdirSync(new URL("simuladores/", base))
      .filter((p) => p.endsWith(".html"))
      .map((p) => "simuladores/" + p),
  ];
  for (const path of paths) {
    const app = await page(path);
    assert.deepEqual(
      app.errors.map((e) => String(e)),
      [],
      path,
    );
    await app.window.happyDOM.close();
  }
});
test("catalog filters, accent-insensitive search and empty state", async () => {
  const { window } = await page("simuladores.html");
  const doc = window.document;
  const visible = () =>
    [...doc.querySelectorAll(".marketplace-card")].filter((el) => !el.hidden);
  assert.equal(visible().length, 9);
  doc.querySelector('[data-filter="ahorro"]').click();
  assert.equal(visible().length, 2);
  assert.equal(
    doc.querySelector('[data-filter="ahorro"]').getAttribute("aria-pressed"),
    "true",
  );
  doc.querySelector('[data-filter="todos"]').click();
  const search = doc.getElementById("simulatorSearch");
  search.value = "tramites";
  search.dispatchEvent(new window.Event("input"));
  assert.equal(visible().length, 1);
  search.value = "zzzz";
  search.dispatchEvent(new window.Event("input"));
  assert.equal(doc.getElementById("marketplaceEmpty").hidden, false);
  await window.happyDOM.close();
});
test("editable bank and quote fields escape HTML payloads", async () => {
  for (const path of ["simuladores/bancos.html", "simuladores/proforma.html"]) {
    const { window, errors } = await page(path);
    const input = window.document.querySelector('input[data-k="name"]');
    input.value = '\"><img src=x onerror=alert(1)>';
    input.dispatchEvent(new window.Event("input", { bubbles: true }));
    assert.equal(window.document.querySelector('img[src="x"]'), null);
    assert.equal(
      window.document.querySelector('input[data-k="name"]').value,
      '\"><img src=x onerror=alert(1)>',
    );
    assert.deepEqual(errors, []);
    await window.happyDOM.close();
  }
});

test("background animation can be paused and resumed with its accessible control", async () => {
  const { window, errors } = await page("index.html");
  const button = window.document.querySelector(".motion-toggle");
  assert.equal(button.getAttribute("aria-pressed"), "false");
  button.click();
  assert.equal(button.getAttribute("aria-pressed"), "true");
  assert.match(button.getAttribute("aria-label"), /Reanudar/);
  button.click();
  assert.equal(button.getAttribute("aria-pressed"), "false");
  assert.match(button.getAttribute("aria-label"), /Pausar/);
  assert.deepEqual(errors, []);
  await window.happyDOM.close();
});
test("background remains static when reduced motion is preferred", async () => {
  const { window, errors } = await page("index.html", { reducedMotion: true });
  const button = window.document.querySelector(".motion-toggle");
  assert.equal(button.disabled, true);
  assert.equal(button.getAttribute("aria-pressed"), "true");
  assert.match(button.getAttribute("aria-label"), /movimiento reducido/);
  assert.deepEqual(errors, []);
  await window.happyDOM.close();
});
