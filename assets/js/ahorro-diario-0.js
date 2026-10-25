const $ = (id) => document.getElementById(id),
  usd = (v) =>
    new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(v || 0);
let expenses = [
  {
    name: "Café fuera de casa",
    cost: 2.5,
    freq: 5,
    save: 40,
    cat: "Alimentación",
  },
  { name: "Delivery", cost: 8, freq: 2, save: 50, cat: "Alimentación" },
  {
    name: "Transporte ocasional",
    cost: 4,
    freq: 3,
    save: 25,
    cat: "Transporte",
  },
];
function values(e) {
  const monthly = e.cost * e.freq * 4.345,
    saving = (monthly * e.save) / 100;
  return { monthly, saving };
}
function render() {
  const total = expenses.reduce((a, e) => a + values(e).monthly, 0),
    saved = expenses.reduce((a, e) => a + values(e).saving, 0),
    annual = saved * 12,
    goal = Number($("goal").value) || 0,
    p = goal ? (annual / goal) * 100 : 0;
  $("dailyKpis").innerHTML = [
    ["Gasto mensual identificado", usd(total), "base"],
    ["Ahorro mensual potencial", usd(saved), "reducción"],
    ["Ahorro anual", usd(annual), "proyección"],
    ["Cumplimiento meta", `${Math.min(999, p).toFixed(1)}%`, usd(goal)],
  ]
    .map(
      (x, i) =>
        `<article class="kpi ${i === 2 ? "accent" : ""}"><span>${x[0]}</span><b>${x[1]}</b><small>${x[2]}</small></article>`,
    )
    .join("");
  $("expCount").textContent = `${expenses.length} gastos`;
  $("expBody").innerHTML = expenses
    .map((e, i) => {
      const v = values(e);
      return `<tr><td><b>${NeoDat.escapeHtml(e.name)}</b><small style="display:block;color:#748198">${usd(e.cost)} × ${e.freq}/sem.</small></td><td>${NeoDat.escapeHtml(e.cat)}</td><td class="num">${usd(v.monthly)}</td><td class="num">${e.save}%</td><td class="num"><b style="color:#11835f">${usd(v.saving)}</b></td><td><button class="btn" data-del="${i}" style="min-height:28px;padding:0 8px">×</button></td></tr>`;
    })
    .join("");
  $("expBody")
    .querySelectorAll("[data-del]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          expenses.splice(+b.dataset.del, 1);
          render();
        }),
    );
  $("goalPct").textContent = `${Math.min(100, p).toFixed(0)}%`;
  $("goalBar").style.width = `${Math.min(100, p)}%`;
  $("goalReading").innerHTML =
    annual >= goal
      ? `Con el ahorro potencial identificado, la meta anual de <b>${usd(goal)}</b> se cubriría.`
      : `El ahorro anual estimado es <b>${usd(annual)}</b>. Faltarían <b>${usd(Math.max(0, goal - annual))}</b> para alcanzar la meta.`;
  $("dailyProjection").innerHTML = [
    ["3 meses", saved * 3],
    ["6 meses", saved * 6],
    ["12 meses", saved * 12],
    ["24 meses", saved * 24],
  ]
    .map(
      (x) =>
        `<article class="kpi"><span>${x[0]}</span><b>${usd(x[1])}</b></article>`,
    )
    .join("");
}
$("addExpense").onclick = () => {
  expenses.push({
    name: $("expName").value || "Gasto",
    cost: NeoDat.number($("expCost").value, 0, 1000000.0),
    freq: NeoDat.number($("expFreq").value, 0, 1000000.0),
    save: NeoDat.number($("expSave").value, 0, 100),
    cat: $("expCat").value,
  });
  render();
};
$("goal").addEventListener("input", render);
render();
