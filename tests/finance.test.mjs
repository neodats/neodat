import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
const base = new URL("../", import.meta.url);
function load() {
  const context = vm.createContext({
    window: {},
    document: { addEventListener() {} },
    URL,
    Blob,
    setTimeout,
    console,
  });
  vm.runInContext(
    readFileSync(new URL("assets/site.js", base), "utf8"),
    context,
  );
  context.NeoDat = context.window.NeoDat;
  vm.runInContext(
    readFileSync(new URL("assets/finance.js", base), "utf8"),
    context,
  );
  return { ...context.window.NeoDatFinance, ...context.window.NeoDat };
}
const f = load();
test("zero-interest saving and loan calculations", () => {
  assert.equal(f.futureValue(1000, 250, 0, 24), 7000);
  assert.equal(f.requiredMonthly(1000, 10000, 0, 24), 375);
  assert.equal(f.loanPayment(1200, 0, 12), 100);
});
test("compound saving agrees with monthly schedule", () => {
  let balance = 1000;
  for (let i = 0; i < 24; i++) balance = balance * (1 + 0.05 / 12) + 250;
  assert.ok(Math.abs(f.futureValue(1000, 250, 0.05 / 12, 24) - balance) < 1e-8);
  const monthly = f.requiredMonthly(1000, 10000, 0.05 / 12, 24);
  assert.ok(
    Math.abs(f.futureValue(1000, monthly, 0.05 / 12, 24) - 10000) < 1e-8,
  );
});
test("small rates remain numerically stable", () => {
  assert.ok(Math.abs(f.futureValue(1000, 250, 1e-15, 24) - 7000) < 1e-8);
  assert.ok(Math.abs(f.loanPayment(1200, 1e-12, 12) - 100) < 1e-8);
});
test("credit-card fees increase debt, insufficient payments do not amortize", () => {
  assert.equal(f.cardPayoff(1000, 0, 100, 0).months, 10);
  assert.equal(f.cardPayoff(1000, 0, 100, 120).months, 12);
  assert.equal(f.cardPayoff(1000, 12, 10, 0).months, Infinity);
  assert.equal(f.cardPayoff(0, 12, 100, 120).months, 0);
});
test("quote rounds line tax and clamps invalid discounts", () => {
  assert.equal(
    f.quoteTotals({ qty: 3, price: 0.1, disc: 0, tax: 15 }).total,
    0.35,
  );
  assert.equal(
    f.quoteTotals({ qty: 1, price: 100, disc: 120, tax: 15 }).total,
    0,
  );
  assert.equal(
    f.quoteTotals({ qty: -1, price: 100, disc: 0, tax: 15 }).total,
    0,
  );
});
test("editable HTML and spreadsheet formulas are escaped", () => {
  assert.equal(
    f.escapeHtml('\"><img src=x onerror=alert(1)>'),
    "&quot;&gt;&lt;img src=x onerror=alert(1)&gt;",
  );
  assert.equal(f.csvCell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
  assert.equal(f.csvCell("a;b\nc"), '"a;b\nc"');
  assert.equal(f.csvCell(-12.5), '"-12.5"');
});
