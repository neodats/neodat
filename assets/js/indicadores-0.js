const $ = (id) => document.getElementById(id),
  n = (id) => Number($(id).value) || 0;
const usd = (v) =>
  new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v || 0);
const pct = (v) => `${(Number.isFinite(v) ? v : 0).toFixed(1)}%`;
const defaults = {
  sales: 85000,
  prevSales: 76000,
  cogs: 49000,
  opex: 22000,
  marketing: 6500,
  newClients: 130,
  clients: 620,
  transactions: 940,
  leads: 2100,
  capital: 50000,
  receivables: 18000,
  days: 30,
};
let latest = {};
function calc() {
  const sales = n("sales"),
    prev = n("prevSales"),
    cogs = n("cogs"),
    opex = n("opex"),
    marketing = n("marketing");
  const clients = n("clients"),
    trans = n("transactions"),
    leads = n("leads"),
    newClients = n("newClients");
  const gross = sales - cogs,
    op = gross - opex,
    growth = prev ? (sales / prev - 1) * 100 : 0,
    gm = sales ? (gross / sales) * 100 : 0,
    om = sales ? (op / sales) * 100 : 0;
  const ticket = trans ? sales / trans : 0,
    conversion = leads ? (newClients / leads) * 100 : 0,
    cac = newClients ? marketing / newClients : 0,
    revClient = clients ? sales / clients : 0,
    roi = n("capital") ? (op / n("capital")) * 100 : 0;
  const dso = sales ? n("receivables") / (sales / Math.max(1, n("days"))) : 0,
    marketingRoi = marketing ? ((gross - marketing) / marketing) * 100 : 0;
  const costRatio = sales ? (cogs / sales) * 100 : 0,
    opexRatio = sales ? (opex / sales) * 100 : 0,
    newShare = clients ? (newClients / clients) * 100 : 0;
  latest = {
    sales,
    prev,
    gross,
    op,
    growth,
    gm,
    om,
    ticket,
    conversion,
    cac,
    revClient,
    roi,
    dso,
    marketingRoi,
    costRatio,
    opexRatio,
    newShare,
  };
  const list = [
    ["Ventas", usd(sales), "Actual"],
    ["Crecimiento", pct(growth), "vs. período anterior"],
    ["Margen bruto", pct(gm), usd(gross)],
    ["Utilidad operativa", usd(op), pct(om) + " margen"],
    ["Ticket promedio", usd(ticket), "por transacción"],
    ["Conversión", pct(conversion), "lead → cliente"],
    ["CAC", usd(cac), "costo adquisición"],
    ["Ingreso / cliente", usd(revClient), "promedio"],
    ["ROI operativo", pct(roi), "sobre capital"],
    ["ROI marketing", pct(marketingRoi), "retorno estimado"],
    ["DSO", `${dso.toFixed(1)} días`, "cobranza"],
    ["Costo de ventas", pct(costRatio), "sobre ventas"],
    ["Gasto operativo", pct(opexRatio), "sobre ventas"],
    ["Clientes nuevos", String(n("newClients")), "período"],
    ["Participación nuevos", pct(newShare), "clientes nuevos / total"],
    ["Clientes totales", String(n("clients")), "base"],
    ["Transacciones", String(n("transactions")), "período"],
    ["Leads", String(n("leads")), "oportunidades"],
  ];
  $("kpiGrid").innerHTML = list
    .map(
      (x, i) =>
        `<article class="kpi ${i === 3 ? "accent" : ""}"><span>${x[0]}</span><b>${x[1]}</b><small>${x[2]}</small></article>`,
    )
    .join("");
  const score = [
    growth >= 0,
    gm >= 30,
    om >= 10,
    conversion >= 5,
    roi >= 10,
    dso <= 45,
  ].filter(Boolean).length;
  $("healthBadge").textContent =
    score >= 5 ? "Favorable" : score >= 3 ? "Atención" : "Crítico";
  $("healthBadge").className =
    "pill " + (score >= 5 ? "green" : score >= 3 ? "amber" : "red");
  const reads = [
    [
      "Crecimiento",
      growth >= 0
        ? "Las ventas superan el período anterior."
        : "Las ventas están por debajo del período anterior.",
      growth >= 0 ? "green" : "red",
    ],
    [
      "Margen bruto",
      gm >= 30
        ? "El margen bruto mantiene una cobertura razonable."
        : "El margen bruto es reducido frente al nivel de ventas.",
      gm >= 30 ? "green" : "amber",
    ],
    [
      "Rentabilidad",
      om >= 10
        ? "La operación conserva margen operativo saludable."
        : "La utilidad operativa requiere revisión de costos y gastos.",
      om >= 10 ? "green" : "red",
    ],
    [
      "Cobranza",
      dso <= 45
        ? "El plazo estimado de cobro se mantiene controlado."
        : "El período de cobro es elevado y puede presionar liquidez.",
      dso <= 45 ? "green" : "amber",
    ],
  ];
  $("readings").innerHTML = reads
    .map(
      (r) =>
        `<div class="notice" style="border-left-color:${r[2] === "green" ? "#20b486" : r[2] === "red" ? "#ef5b67" : "#f2a93b"}"><strong style="color:#172237">${r[0]}</strong><br>${r[1]}</div>`,
    )
    .join("");
  const components = [
    ["Costo de ventas", cogs],
    ["Gastos operativos", opex],
    ["Utilidad operativa", Math.max(0, op)],
  ];
  $("bars").innerHTML = components
    .map(
      ([lab, val]) =>
        `<div><div style="display:flex;justify-content:space-between;gap:10px;margin-bottom:6px;color:#66758a;font-size:10px"><span>${lab}</span><b>${usd(val)}</b></div><div class="progress"><i style="width:${sales ? Math.min(100, (val / sales) * 100) : 0}%"></i></div></div>`,
    )
    .join("");
}
document
  .querySelectorAll("input")
  .forEach((el) => el.addEventListener("input", calc));
$("resetBtn").onclick = () => {
  Object.entries(defaults).forEach(([k, v]) => ($(k).value = v));
  calc();
};
$("csvBtn").onclick = () => {
  calc();
  NeoDat.downloadCsv("indicadores_kpi_neodat.csv", [
    ["Indicador", "Valor"],
    ...Object.entries(latest),
  ]);
};
calc();
