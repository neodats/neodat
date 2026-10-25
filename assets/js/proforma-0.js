const $ = (id) => document.getElementById(id),
  usd = (v) =>
    new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(v || 0);
const catalog = [
  { name: "Servicio de consultoría", detail: "CONS-001", price: 250, tax: 15 },
  { name: "Dashboard ejecutivo", detail: "BI-001", price: 480, tax: 15 },
  { name: "Automatización de reporte", detail: "AUT-001", price: 320, tax: 15 },
  { name: "Capacitación empresarial", detail: "CAP-001", price: 180, tax: 15 },
  { name: "Análisis financiero", detail: "FIN-001", price: 350, tax: 15 },
  { name: "Asesoría puntual", detail: "ASE-001", price: 120, tax: 15 },
];
let lines = [
  {
    name: "Servicio de consultoría",
    detail: "CONS-001",
    qty: 1,
    price: 250,
    disc: 0,
    tax: 15,
  },
];
$("qDate").value = NeoDat.localDate();
function totalsOf(l) {
  return NeoDatFinance.quoteTotals(l);
}
function render() {
  $("quoteBody").innerHTML = lines
    .map((l, i) => {
      const t = totalsOf(l);
      return `<tr><td><input data-i="${i}" data-k="name" value="${NeoDat.escapeHtml(l.name)}"></td><td><input data-i="${i}" data-k="detail" value="${NeoDat.escapeHtml(l.detail)}"></td><td><input data-i="${i}" data-k="qty" type="number" min="0" step="1" value="${l.qty}"></td><td><input data-i="${i}" data-k="price" type="number" min="0" step=".01" value="${l.price}"></td><td><input data-i="${i}" data-k="disc" type="number" min="0" max="100" step=".1" value="${l.disc}"></td><td><input data-i="${i}" data-k="tax" type="number" min="0" max="100" step=".1" value="${l.tax}"></td><td class="num">${usd(t.base)}</td><td class="num">${usd(t.tax)}</td><td class="num"><b>${usd(t.total)}</b></td><td class="no-print"><button class="btn" data-del="${i}" style="min-height:28px;padding:0 8px">×</button></td></tr>`;
    })
    .join("");
  $("quoteBody")
    .querySelectorAll("input")
    .forEach((el) =>
      el.addEventListener("input", () => {
        const l = lines[+el.dataset.i],
          k = el.dataset.k;
        l[k] = ["name", "detail"].includes(k)
          ? el.value
          : NeoDat.number(
              el.value,
              0,
              ["disc", "tax"].includes(k) ? 100 : 1e12,
            );
        render();
      }),
    );
  $("quoteBody")
    .querySelectorAll("[data-del]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          if (lines.length > 1) {
            lines.splice(+b.dataset.del, 1);
            render();
          }
        }),
    );
  const sum = lines.reduce(
    (a, l) => {
      const t = totalsOf(l);
      a.base += t.base;
      a.tax += t.tax;
      a.total += t.total;
      return a;
    },
    { base: 0, tax: 0, total: 0 },
  );
  $("quoteTotals").innerHTML =
    `<div style="display:grid;gap:10px"><div style="display:flex;justify-content:space-between"><span>Base imponible</span><b>${usd(sum.base)}</b></div><div style="display:flex;justify-content:space-between"><span>IVA</span><b>${usd(sum.tax)}</b></div><div style="display:flex;justify-content:space-between;padding-top:12px;border-top:1px solid #dbe3ed;font-size:18px"><strong>Total</strong><strong style="color:#176fe5">${usd(sum.total)}</strong></div></div>`;
}
$("catalog").innerHTML = catalog
  .map(
    (p, i) =>
      `<button class="btn" data-cat="${i}" style="min-height:58px;justify-content:flex-start;text-align:left"><span><b>${NeoDat.escapeHtml(p.name)}</b><small style="display:block;color:#748198;margin-top:3px">${NeoDat.escapeHtml(p.detail)} · ${usd(p.price)} · IVA ${p.tax}%</small></span></button>`,
  )
  .join("");
$("catalog")
  .querySelectorAll("[data-cat]")
  .forEach(
    (b) =>
      (b.onclick = () => {
        const p = catalog[+b.dataset.cat];
        lines.push({
          name: p.name,
          detail: p.detail,
          qty: 1,
          price: p.price,
          disc: 0,
          tax: p.tax,
        });
        render();
      }),
  );
$("addLineBtn").onclick = () => {
  lines.push({
    name: "Nuevo producto",
    detail: "",
    qty: 1,
    price: 0,
    disc: 0,
    tax: 15,
  });
  render();
};
$("newBtn").onclick = () => {
  lines = [
    { name: "Nuevo producto", detail: "", qty: 1, price: 0, disc: 0, tax: 15 },
  ];
  $("client").value = "";
  $("taxId").value = "";
  $("email").value = "";
  $("phone").value = "";
  render();
};
$("csvBtn").onclick = () =>
  NeoDat.downloadCsv("proforma_neodat.csv", [
    [
      "Producto",
      "Detalle",
      "Cantidad",
      "Precio",
      "Descuento %",
      "IVA %",
      "Base",
      "IVA",
      "Total",
    ],
    ...lines.map((l) => {
      const t = totalsOf(l);
      return [
        l.name,
        l.detail,
        l.qty,
        l.price,
        l.disc,
        l.tax,
        t.base.toFixed(2),
        t.tax.toFixed(2),
        t.total.toFixed(2),
      ];
    }),
  ]);
render();
