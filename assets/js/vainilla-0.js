const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const SHORT_MONTHS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];
const AGE_YIELD = {
  3: 0.18,
  4: 0.36,
  5: 0.72,
  6: 1.08,
  7: 1.44,
  8: 1.08,
  9: 0.9,
  10: 0.72,
};
const DEFAULT_CLIMATE = [
  { temp: 21.6, rain: 283, hum: 85 },
  { temp: 21.9, rain: 321, hum: 85 },
  { temp: 21.8, rain: 292, hum: 85 },
  { temp: 21.8, rain: 364, hum: 86 },
  { temp: 21.2, rain: 515, hum: 87 },
  { temp: 20.6, rain: 378, hum: 86 },
  { temp: 20.2, rain: 353, hum: 85 },
  { temp: 20.9, rain: 262, hum: 82 },
  { temp: 21.5, rain: 183, hum: 82 },
  { temp: 22.1, rain: 259, hum: 83 },
  { temp: 22.2, rain: 192, hum: 83 },
  { temp: 22.0, rain: 230, hum: 84 },
];
const DEFAULTS = {
  area: 1,
  density: 2000,
  productive: 78,
  age: 7,
  yieldPlant: 1.44,
  cureRatio: 5.2,
  exportQuality: 85,
  pollinationMonth: 8,
  maturity: 9,
  harvestWindow: 2,
  fobPrice: 80,
  fieldCost: 4500,
  curingCost: 12,
  prepCost: 4,
  inlandCost: 650,
  docsCost: 450,
  freight: 900,
  insurance: 0.7,
  duty: 15,
  vat: 9,
  destination: 400,
};
let climateBase = DEFAULT_CLIMATE.map((x) => ({ ...x }));
let scenario = "historical";
let latestResults = null;

const $ = (id) => document.getElementById(id);
const num = (id) => Number($(id).value) || 0;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const money = (value) =>
  new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
const money2 = (value) =>
  new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
const kg = (value) =>
  `${new Intl.NumberFormat("es-EC", { maximumFractionDigits: 1 }).format(Number.isFinite(value) ? value : 0)} kg`;
const pct = (value) =>
  `${new Intl.NumberFormat("es-EC", { maximumFractionDigits: 1 }).format(Number.isFinite(value) ? value : 0)}%`;

function adjustedClimate() {
  return climateBase.map((item) => {
    const next = { ...item };
    if (scenario === "wet") next.rain *= 1.2;
    if (scenario === "dry") next.rain *= 0.75;
    if (scenario === "warm") next.temp += 2;
    return next;
  });
}

function suitability(item) {
  let tempScore =
    item.temp >= 21 && item.temp <= 30
      ? 1
      : item.temp < 21
        ? clamp(1 - (21 - item.temp) / 8, 0.35, 1)
        : clamp(1 - (item.temp - 30) / 7, 0.35, 1);
  let rainScore;
  if (item.rain >= 125 && item.rain <= 280) rainScore = 1;
  else if (item.rain < 125) rainScore = clamp(0.45 + item.rain / 230, 0.35, 1);
  else if (item.rain <= 400) rainScore = 1 - ((item.rain - 280) / 120) * 0.2;
  else rainScore = clamp(0.8 - ((item.rain - 400) / 300) * 0.35, 0.4, 0.8);
  const humScore =
    item.hum >= 78 && item.hum <= 85
      ? 1
      : item.hum < 78
        ? clamp(0.55 + item.hum / 175, 0.45, 1)
        : clamp(1 - (item.hum - 85) / 30, 0.55, 1);
  return clamp(tempScore * 0.45 + rainScore * 0.35 + humScore * 0.2, 0.35, 1);
}

function calculate() {
  const climate = adjustedClimate();
  const scores = climate.map(suitability);
  const climateFactor = scores.reduce((a, b) => a + b, 0) / 12;
  const area = num("area");
  const plants = (area * num("density") * num("productive")) / 100;
  const freshKg = plants * num("yieldPlant") * climateFactor;
  const curedKg = freshKg / Math.max(num("cureRatio"), 0.1);
  const exportKg = (curedKg * num("exportQuality")) / 100;
  const harvestStart = (num("pollinationMonth") + num("maturity")) % 12;
  const harvestMonths = Array.from(
    { length: Math.max(1, num("harvestWindow")) },
    (_, i) => (harvestStart + i) % 12,
  );
  const harvestWeight =
    harvestMonths.reduce((sum, i) => sum + scores[i], 0) || 1;
  const monthlyKg = Array(12).fill(0);
  harvestMonths.forEach(
    (i) => (monthlyKg[i] = (exportKg * scores[i]) / harvestWeight),
  );

  const fobRevenue = exportKg * num("fobPrice");
  const fieldCost = area * num("fieldCost");
  const curingCost = curedKg * num("curingCost");
  const prepCost = exportKg * num("prepCost");
  const fixedCost = num("inlandCost") + num("docsCost");
  const exporterCosts = fieldCost + curingCost + prepCost + fixedCost;
  const profit = fobRevenue - exporterCosts;
  const margin = fobRevenue ? (profit / fobRevenue) * 100 : 0;
  const breakEven = exportKg ? exporterCosts / exportKg : 0;
  const freightInsurance =
    num("freight") + (fobRevenue * num("insurance")) / 100;
  const cif = fobRevenue + freightInsurance;
  const duty = (cif * num("duty")) / 100;
  const vat = ((cif + duty) * num("vat")) / 100;
  const landed = cif + duty + vat + num("destination");
  const landedPerKg = exportKg ? landed / exportKg : 0;
  const annualRain = climate.reduce((sum, x) => sum + x.rain, 0);
  const avgTemp = climate.reduce((sum, x) => sum + x.temp, 0) / 12;
  const avgHum = climate.reduce((sum, x) => sum + x.hum, 0) / 12;
  const volumeScore = clamp(exportKg / 300, 0, 1);
  const marginScore = clamp((margin + 10) / 35, 0, 1);
  const viability = Math.round(
    (climateFactor * 0.35 + volumeScore * 0.25 + marginScore * 0.4) * 100,
  );

  latestResults = {
    climate,
    scores,
    climateFactor,
    plants,
    freshKg,
    curedKg,
    exportKg,
    harvestMonths,
    monthlyKg,
    fobRevenue,
    fieldCost,
    curingCost,
    prepCost,
    fixedCost,
    exporterCosts,
    profit,
    margin,
    breakEven,
    freightInsurance,
    cif,
    duty,
    vat,
    landed,
    landedPerKg,
    annualRain,
    avgTemp,
    avgHum,
    viability,
  };
  render(latestResults);
}

function render(r) {
  $("freshKg").textContent = kg(r.freshKg);
  $("plantsSummary").textContent =
    `${Math.round(r.plants).toLocaleString("es-EC")} plantas productivas · factor ${pct(r.climateFactor * 100)}`;
  $("exportKg").textContent = kg(r.exportKg);
  $("harvestSummary").textContent =
    `Cosecha en ${r.harvestMonths.map((i) => MONTHS[i]).join(" y ")}`;
  $("fobRevenue").textContent = money(r.fobRevenue);
  $("fobUnitSummary").textContent =
    `${money2(num("fobPrice"))}/kg · referencia editable`;
  $("exporterProfit").textContent = money(r.profit);
  $("exporterProfit").style.color = r.profit < 0 ? "var(--red)" : "var(--ink)";
  $("marginSummary").textContent =
    `Margen ${pct(r.margin)} · equilibrio ${money2(r.breakEven)}/kg`;
  $("harvestPill").textContent =
    `Cosecha: ${r.harvestMonths.map((i) => SHORT_MONTHS[i]).join(" · ")}`;
  $("curingSummary").textContent =
    `Conversión: ${kg(r.freshKg)} frescos → ${kg(r.curedKg)} curados → ${kg(r.exportKg)} exportables`;
  $("avgTemp").textContent = `${r.avgTemp.toFixed(1)} °C`;
  $("annualRain").textContent =
    `${Math.round(r.annualRain).toLocaleString("es-EC")} mm`;
  $("avgHumidity").textContent = `${Math.round(r.avgHum)}%`;
  $("climateFactor").textContent = pct(r.climateFactor * 100);
  renderDecision(r);
  renderChart(r);
  renderClimateTable(r);
  renderFinance(r);
}

function renderDecision(r) {
  const card = $("decisionCard");
  card.className = "decision";
  let title, text;
  if (r.exportKg < 100) {
    card.classList.add("warning");
    title = "Volumen piloto: conviene consolidar el lote";
    text = `El escenario genera ${kg(r.exportKg)} exportables. Compare envío aéreo, consolidación con otros productores o venta a un exportador especializado.`;
  } else if (r.profit < 0) {
    card.classList.add("danger");
    title = "El precio FOB no cubre los costos estimados";
    text = `Se requiere al menos ${money2(r.breakEven)}/kg FOB o una reducción de costos antes de negociar el embarque.`;
  } else if (r.margin < 15) {
    card.classList.add("warning");
    title = "Escenario viable, con margen sensible";
    text = `El margen estimado es ${pct(r.margin)}. Proteja la negociación frente a rechazo de calidad, merma y cambios de flete.`;
  } else {
    title = "Escenario comercialmente favorable";
    text = `El margen estimado es ${pct(r.margin)} y el volumen supera 100 kg. Valide calidad, comprador, condiciones de pago y requisitos sanitarios.`;
  }
  $("decisionTitle").textContent = title;
  $("decisionText").textContent = text;
  $("decisionScore").textContent = `${r.viability}/100`;
}

function renderChart(r) {
  const max = Math.max(...r.monthlyKg, 1);
  $("productionChart").innerHTML = r.monthlyKg
    .map((value, i) => {
      const height = value ? Math.max(12, (value / max) * 100) : 3;
      const active = r.harvestMonths.includes(i);
      return `<div class="bar-item"><div class="bar-slot"><div class="bar ${active ? "harvest" : ""}" style="height:${height}%" title="${MONTHS[i]}: ${kg(value)}"></div></div><div class="bar-value">${value ? value.toFixed(1) : "—"}</div><div class="bar-month">${SHORT_MONTHS[i]}</div></div>`;
    })
    .join("");
}

function renderClimateTable(r) {
  $("climateBody").innerHTML = r.climate
    .map((item, i) => {
      const s = r.scores[i] * 100;
      const level = s >= 85 ? "" : s >= 70 ? "mid" : "low";
      const harvest = r.harvestMonths.includes(i);
      return `<tr><td class="month-name">${MONTHS[i]}</td><td>${item.temp.toFixed(1)} °C</td><td>${Math.round(item.rain)} mm</td><td>${Math.round(item.hum)}%</td><td><span class="score-pill ${level}">${Math.round(s)}%</span></td><td>${harvest ? '<span class="stage-pill">COSECHA</span>' : "—"}</td><td>${harvest ? kg(r.monthlyKg[i]) : "—"}</td></tr>`;
    })
    .join("");
}

function renderFinance(r) {
  $("fRevenueLine").textContent = money(r.fobRevenue);
  $("fieldCostLine").textContent = `− ${money(r.fieldCost)}`;
  $("curingCostLine").textContent = `− ${money(r.curingCost)}`;
  $("prepCostLine").textContent = `− ${money(r.prepCost)}`;
  $("fixedCostLine").textContent = `− ${money(r.fixedCost)}`;
  $("profitLine").textContent = money(r.profit);
  $("profitLineWrap").className =
    `line-item total ${r.profit >= 0 ? "positive" : "negative"}`;
  $("breakEvenNote").textContent =
    `Punto de equilibrio FOB: ${money2(r.breakEven)}/kg. ROI operativo estimado: ${pct(r.exporterCosts ? (r.profit / r.exporterCosts) * 100 : 0)}.`;
  $("chinaFobLine").textContent = money(r.fobRevenue);
  $("freightLine").textContent = money(r.freightInsurance);
  $("cifLine").textContent = money(r.cif);
  $("dutyLine").textContent = money(r.duty);
  $("vatLine").textContent = money(r.vat);
  $("destinationLine").textContent = money(num("destination"));
  $("landedLine").textContent = money(r.landed);
  $("landedNote").textContent =
    `Costo estimado puesto en China: ${money2(r.landedPerKg)}/kg. El arancel se calcula sobre CIF y el IVA sobre CIF + arancel.`;
}

async function refreshWeather() {
  const button = $("weatherBtn");
  const status = $("weatherStatus");
  button.classList.add("loading");
  button.textContent = "Consultando clima…";
  const endYear = new Date().getFullYear() - 1;
  const startYear = endYear - 4;
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=-3.6274&longitude=-78.5860&start_date=${startYear}-01-01&end_date=${endYear}-12-31&daily=temperature_2m_mean%2Cprecipitation_sum%2Crelative_humidity_2m_mean&timezone=America%2FGuayaquil`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Respuesta climática no disponible");
    const json = await response.json();
    const d = json.daily;
    const buckets = Array.from({ length: 12 }, () => ({
      temp: 0,
      hum: 0,
      n: 0,
      rainByYear: {},
    }));
    d.time.forEach((date, i) => {
      const [year, month] = date.split("-").map(Number);
      const b = buckets[month - 1];
      const t = d.temperature_2m_mean[i],
        h = d.relative_humidity_2m_mean[i],
        p = d.precipitation_sum[i];
      if (t != null && h != null) {
        b.temp += t;
        b.hum += h;
        b.n += 1;
      }
      b.rainByYear[year] = (b.rainByYear[year] || 0) + (p || 0);
    });
    climateBase = buckets.map((b) => ({
      temp: b.temp / b.n,
      hum: b.hum / b.n,
      rain:
        Object.values(b.rainByYear).reduce((a, v) => a + v, 0) /
        Object.keys(b.rainByYear).length,
    }));
    status.textContent = `Datos actualizados: promedio ${startYear}–${endYear}, elevación de cuadrícula ${json.elevation || "—"} m.`;
    $("climateTag").textContent = `Clima histórico ${startYear}–${endYear}`;
    calculate();
  } catch (error) {
    status.textContent =
      "No se pudo actualizar. Se mantienen los datos precargados 2021–2025.";
  } finally {
    button.classList.remove("loading");
    button.textContent = "Actualizar últimos 5 años";
  }
}

function exportCsv() {
  if (!latestResults) return;
  const r = latestResults;
  const rows = [
    [
      "Mes",
      "Temperatura °C",
      "Precipitación mm",
      "Humedad %",
      "Aptitud %",
      "Mes de cosecha",
      "Kg exportables",
    ],
    ...MONTHS.map((month, i) => [
      month,
      r.climate[i].temp.toFixed(1),
      Math.round(r.climate[i].rain),
      Math.round(r.climate[i].hum),
      Math.round(r.scores[i] * 100),
      r.harvestMonths.includes(i) ? "Sí" : "No",
      r.monthlyKg[i].toFixed(2),
    ]),
    [],
    ["Resumen", "Valor"],
    ["Producción fresca kg", r.freshKg.toFixed(2)],
    ["Producción curada kg", r.curedKg.toFixed(2)],
    ["Exportable kg", r.exportKg.toFixed(2)],
    ["Ingreso FOB USD", r.fobRevenue.toFixed(2)],
    ["Utilidad exportador USD", r.profit.toFixed(2)],
    ["Costo puesto China USD/kg", r.landedPerKg.toFixed(2)],
  ];
  const csv =
    "\ufeff" +
    rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`)
          .join(";"),
      )
      .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "simulacion_vainilla_el_pangui.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

function reset() {
  Object.entries(DEFAULTS).forEach(([id, value]) => {
    if ($(id)) $(id).value = value;
  });
  climateBase = DEFAULT_CLIMATE.map((x) => ({ ...x }));
  scenario = "historical";
  document
    .querySelectorAll(".scenario")
    .forEach((btn) =>
      btn.classList.toggle("active", btn.dataset.scenario === "historical"),
    );
  $("weatherStatus").textContent =
    "Promedios mensuales precargados para El Pangui.";
  $("climateTag").textContent = "Clima histórico 2021–2025";
  calculate();
}

document
  .querySelectorAll("input,select")
  .forEach((control) => control.addEventListener("input", calculate));
$("age").addEventListener("change", () => {
  $("yieldPlant").value = AGE_YIELD[$("age").value] ?? 0.72;
  calculate();
});
document.querySelectorAll(".scenario").forEach((button) =>
  button.addEventListener("click", () => {
    scenario = button.dataset.scenario;
    document
      .querySelectorAll(".scenario")
      .forEach((btn) => btn.classList.toggle("active", btn === button));
    calculate();
  }),
);
$("weatherBtn").addEventListener("click", refreshWeather);
$("csvBtn").addEventListener("click", exportCsv);
$("printBtn").addEventListener("click", () => window.print());
$("resetBtn").addEventListener("click", reset);
calculate();
