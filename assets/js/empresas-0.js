const $ = (id) => document.getElementById(id),
  n = (id) => Number($(id).value) || 0,
  usd = (v) =>
    new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(v || 0),
  pct = (v) => `${(v || 0).toFixed(1)}%`;
function calc() {
  const u = n("units"),
    p = n("price"),
    v = n("varCost"),
    f = n("fixed"),
    oi = n("otherIncome"),
    tax = n("tax") / 100,
    cap = n("capital"),
    g = n("growth");
  $("growthOut").textContent = `${g}%`;
  const sales = u * p,
    vc = u * v,
    cm = p - v,
    cmr = p ? cm / p : 0,
    op = sales - vc - f + oi,
    taxVal = Math.max(0, op) * tax,
    net = op - taxVal,
    margin = sales ? (net / sales) * 100 : 0,
    roi = cap ? (net / cap) * 100 : 0;
  const beUnits = cm > 0 ? f / cm : Infinity,
    beSales = Number.isFinite(beUnits) ? beUnits * p : Infinity,
    safety = sales ? Math.max(0, ((sales - beSales) / sales) * 100) : 0;
  const su = u * (1 + g / 100),
    ss = su * p,
    svc = su * v,
    sop = ss - svc - f + oi,
    snet = sop - Math.max(0, sop) * tax;
  const vals = [
    ["Ventas", usd(sales), "Ingresos"],
    ["Utilidad neta", usd(net), pct(margin) + " margen"],
    [
      "Punto equilibrio",
      Number.isFinite(beUnits) ? `${Math.ceil(beUnits)} u.` : "No alcanzable",
      Number.isFinite(beSales) ? usd(beSales) : "—",
    ],
    ["ROI", pct(roi), "sobre capital"],
    ["Margen contribución", usd(cm), "por unidad"],
    ["Índice contribución", pct(cmr * 100), "sobre precio"],
    ["Margen seguridad", pct(safety), "sobre ventas"],
    ["Costo variable", usd(vc), "total"],
  ];
  $("empKpis").innerHTML = vals
    .map(
      (x, i) =>
        `<article class="kpi ${i === 1 ? "accent" : ""}"><span>${x[0]}</span><b>${x[1]}</b><small>${x[2]}</small></article>`,
    )
    .join("");
  const comps = [
    ["Costos variables", vc],
    ["Costos fijos", f],
    ["Utilidad neta", Math.max(0, net)],
  ];
  $("costBars").innerHTML = comps
    .map(
      ([lab, val]) =>
        `<div><div style="display:flex;justify-content:space-between;margin-bottom:6px;color:#66758a;font-size:10px"><span>${lab}</span><b>${usd(val)}</b></div><div class="progress"><i style="width:${sales ? Math.min(100, (val / sales) * 100) : 0}%"></i></div></div>`,
    )
    .join("");
  $("beBox").innerHTML =
    `<div class="kpi" style="box-shadow:none"><span>Unidades</span><b>${Number.isFinite(beUnits) ? Math.ceil(beUnits) : "—"}</b><small>para cubrir costos</small></div><div class="kpi" style="box-shadow:none"><span>Ventas</span><b>${Number.isFinite(beSales) ? usd(beSales) : "—"}</b><small>equilibrio</small></div><div class="notice">Cada unidad aporta <b>${usd(cm)}</b> para cubrir costos fijos y generar utilidad.</div>`;
  $("scenarioBadge").textContent = `${g >= 0 ? "+" : ""}${g}% volumen`;
  $("scenario").innerHTML =
    `<div class="kpis" style="grid-template-columns:repeat(3,1fr)"><article class="kpi"><span>Unidades escenario</span><b>${Math.round(su)}</b></article><article class="kpi"><span>Ventas escenario</span><b>${usd(ss)}</b></article><article class="kpi ${snet >= net ? "accent" : ""}"><span>Utilidad neta</span><b>${usd(snet)}</b><small>${net ? `${(snet / net - 1) * 100 >= 0 ? "+" : ""}${((snet / net - 1) * 100).toFixed(1)}% vs. base` : ""}</small></article></div>`;
  $("empReading").innerHTML =
    `<strong style="color:#172237">Lectura ejecutiva:</strong> ${net >= 0 ? "La empresa genera utilidad con los supuestos actuales." : "La estructura actual produce pérdida."} ${Number.isFinite(beUnits) ? `El punto de equilibrio es de aproximadamente ${Math.ceil(beUnits)} unidades.` : "El costo variable unitario iguala o supera el precio, por lo que el punto de equilibrio no es alcanzable."}`;
}
document
  .querySelectorAll("input")
  .forEach((el) => el.addEventListener("input", calc));
calc();
