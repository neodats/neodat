const $ = (id) => document.getElementById(id),
  usd = (v) =>
    new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(v || 0);
let mode = "goal",
  data = { initial: 1000, target: 10000, monthly: 250, months: 24, rate: 5 };
function fv(initial, monthly, r, n) {
  return NeoDatFinance.futureValue(initial, monthly, r, n);
}
function reqMonthly(initial, target, r, n) {
  return NeoDatFinance.requiredMonthly(initial, target, r, n);
}
function form() {
  $("savingForm").innerHTML =
    `<div class="field wide"><label>Ahorro inicial</label><input id="initial" type="number" value="${data.initial}"></div>${mode === "goal" ? `<div class="field wide"><label>Meta de ahorro</label><input id="target" type="number" value="${data.target}"></div>` : `<div class="field wide"><label>Aporte mensual</label><input id="monthly" type="number" value="${data.monthly}"></div>`}<div class="field"><label>Plazo meses</label><input id="months" type="number" min="1" value="${data.months}"></div><div class="field"><label>Tasa anual %</label><input id="rate" type="number" step=".1" value="${data.rate}"></div>`;
  $("savingForm")
    .querySelectorAll("input")
    .forEach((el) =>
      el.addEventListener("input", () => {
        data[el.id] = NeoDat.number(
          el.value,
          el.id === "months" ? 1 : 0,
          el.id === "months" ? 1200 : el.id === "rate" ? 100 : 1e12,
        );
        render();
      }),
    );
}
function render() {
  const r = data.rate / 1200,
    n = Math.max(1, data.months);
  let monthly = data.monthly,
    target = data.target,
    final;
  if (mode === "goal") {
    monthly = Math.max(0, reqMonthly(data.initial, target, r, n));
    final = fv(data.initial, monthly, r, n);
  } else {
    final = fv(data.initial, monthly, r, n);
    target = final;
  }
  const contributions = data.initial + monthly * n,
    interest = final - contributions,
    progress = target ? (final / target) * 100 : 100;
  $("savingKpis").innerHTML = (
    mode === "goal"
      ? [
          ["Aporte mensual requerido", usd(monthly), "para alcanzar la meta"],
          ["Meta", usd(target), `${n} meses`],
          ["Interés estimado", usd(interest), "ganancia financiera"],
          ["Total aportado", usd(contributions), "capital propio"],
        ]
      : [
          ["Saldo final", usd(final), `${n} meses`],
          ["Aporte mensual", usd(monthly), "constante"],
          ["Interés estimado", usd(interest), "ganancia financiera"],
          ["Total aportado", usd(contributions), "capital propio"],
        ]
  )
    .map(
      (x, i) =>
        `<article class="kpi ${i === 0 ? "accent" : ""}"><span>${x[0]}</span><b>${x[1]}</b><small>${x[2]}</small></article>`,
    )
    .join("");
  $("savingStatus").textContent =
    mode === "goal" ? "Plan calculado" : "Proyección";
  const checkpoints = [0.25, 0.5, 0.75, 1].map((f) =>
    Math.max(1, Math.round(n * f)),
  );
  $("savingBars").innerHTML = checkpoints
    .map((m) => {
      const val = fv(data.initial, monthly, r, m),
        w = target ? Math.min(100, (val / target) * 100) : 0;
      return `<div><div style="display:flex;justify-content:space-between;margin-bottom:6px;color:#66758a;font-size:10px"><span>Mes ${m}</span><b>${usd(val)}</b></div><div class="progress"><i style="width:${w}%"></i></div></div>`;
    })
    .join("");
  $("savingReading").innerHTML =
    mode === "goal"
      ? `Para alcanzar <b>${usd(target)}</b> en ${n} meses con una tasa anual de ${data.rate.toFixed(1)}%, el aporte mensual estimado es <b>${usd(monthly)}</b>.`
      : `Con un ahorro inicial de <b>${usd(data.initial)}</b> y aportes mensuales de <b>${usd(monthly)}</b>, el saldo final estimado es <b>${usd(final)}</b>.`;
}
document.querySelectorAll(".tab").forEach(
  (b) =>
    (b.onclick = () => {
      document
        .querySelectorAll(".tab")
        .forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      mode = b.dataset.mode;
      form();
      render();
    }),
);
form();
render();
