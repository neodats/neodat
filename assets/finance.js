(function () {
  "use strict";
  const safe = (v, min = 0, max = 1e12) => NeoDat.number(v, min, max);
  function futureValue(initial, monthly, rate, months) {
    const n = safe(months, 1, 1200),
      r = safe(rate, 0, 1);
    const factor = Math.expm1(n * Math.log1p(r));
    return safe(initial) * (1 + factor) + safe(monthly) * (r ? factor / r : n);
  }
  function requiredMonthly(initial, target, rate, months) {
    const n = safe(months, 1, 1200),
      r = safe(rate, 0, 1),
      factor = Math.expm1(n * Math.log1p(r));
    return Math.max(
      0,
      (safe(target) - safe(initial) * (1 + factor)) / (r ? factor / r : n),
    );
  }
  function loanPayment(principal, annual, months) {
    const p = safe(principal),
      n = safe(months, 1, 1200),
      r = safe(annual, 0, 1200) / 1200;
    return r ? (p * r) / -Math.expm1(-n * Math.log1p(r)) : p / n;
  }
  function cardPayoff(balance, annual, payment, annualFee) {
    let remaining = safe(balance),
      months = 0,
      interest = 0;
    const rate = safe(annual, 0, 1200) / 1200,
      fee = safe(annualFee) / 12,
      amount = safe(payment);
    while (remaining > 0.01 && months < 600) {
      const charge = remaining * rate;
      if (amount <= charge + fee) return { months: Infinity, interest };
      interest += charge;
      remaining = Math.max(0, remaining + charge + fee - amount);
      months++;
    }
    return { months: remaining > 0.01 ? Infinity : months, interest };
  }
  function quoteTotals(line) {
    const money = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
    const base = money(
      safe(line.qty) * safe(line.price) * (1 - safe(line.disc, 0, 100) / 100),
    );
    const tax = money((base * safe(line.tax, 0, 100)) / 100);
    return { base, tax, total: money(base + tax) };
  }
  window.NeoDatFinance = Object.freeze({
    futureValue,
    requiredMonthly,
    loanPayment,
    cardPayoff,
    quoteTotals,
  });
})();
