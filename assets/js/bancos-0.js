const $ = (id) => document.getElementById(id);
let tab = "inv";
const usd = (v) =>
    new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(v || 0),
  pct = (v) => `${(v || 0).toFixed(2)}%`;
const state = {
  inv: {
    capital: 10000,
    months: 12,
    inflation: 2.5,
    rows: [
      { name: "Banco A", rate: 5.6, fee: 0, risk: 1 },
      { name: "Banco B", rate: 6.2, fee: 25, risk: 2 },
      { name: "Cooperativa C", rate: 6.8, fee: 0, risk: 3 },
    ],
  },
  loan: {
    amount: 15000,
    months: 36,
    income: 1800,
    other: 150,
    rows: [
      { name: "Banco A", rate: 14.5, fee: 150 },
      { name: "Banco B", rate: 13.8, fee: 260 },
      { name: "Cooperativa C", rate: 15.2, fee: 90 },
    ],
  },
  card: {
    balance: 2500,
    payment: 150,
    income: 1800,
    rows: [
      { name: "Tarjeta A", rate: 18.9, fee: 0 },
      { name: "Tarjeta B", rate: 21.5, fee: 0 },
      { name: "Tarjeta C", rate: 16.8, fee: 25 },
    ],
  },
};
function pmt(P, annual, n) {
  return NeoDatFinance.loanPayment(P, annual, n);
}
function controls() {
  let s = state[tab],
    h = "";
  if (tab === "inv")
    h = `<div class="form-grid"><div class="field wide"><label>Capital inicial</label><input id="capital" type="number" value="${s.capital}"></div><div class="field"><label>Plazo meses</label><input id="months" type="number" value="${s.months}"></div><div class="field"><label>Inflación anual %</label><input id="inflation" type="number" step=".1" value="${s.inflation}"></div></div>`;
  if (tab === "loan")
    h = `<div class="form-grid"><div class="field wide"><label>Monto</label><input id="amount" type="number" value="${s.amount}"></div><div class="field"><label>Plazo meses</label><input id="months" type="number" value="${s.months}"></div><div class="field"><label>Ingreso mensual</label><input id="income" type="number" value="${s.income}"></div><div class="field wide"><label>Otras cuotas</label><input id="other" type="number" value="${s.other}"></div></div>`;
  if (tab === "card")
    h = `<div class="form-grid"><div class="field wide"><label>Saldo</label><input id="balance" type="number" value="${s.balance}"></div><div class="field"><label>Pago previsto</label><input id="payment" type="number" value="${s.payment}"></div><div class="field"><label>Ingreso mensual</label><input id="income" type="number" value="${s.income}"></div></div>`;
  $("controls").innerHTML = h;
  $("controls")
    .querySelectorAll("input")
    .forEach((el) =>
      el.addEventListener("input", () => {
        s[el.id] = NeoDat.number(
          el.value,
          el.id === "months" ? 1 : 0,
          el.id === "months" ? 1200 : 1e12,
        );
        render();
      }),
    );
}
function metrics(row) {
  const s = state[tab];
  if (tab === "inv") {
    const years = s.months / 12,
      gross = s.capital * Math.pow(1 + row.rate / 100, years),
      net = gross - row.fee,
      gain = net - s.capital,
      real = ((1 + row.rate / 100) / (1 + s.inflation / 100) - 1) * 100;
    return {
      main: net,
      score: gain,
      desc: `Ganancia ${usd(gain)} · retorno real ${pct(real)}`,
      a: pct(row.rate),
      b: usd(row.fee),
    };
  }
  if (tab === "loan") {
    const q = pmt(s.amount, row.rate, s.months),
      total = q * s.months + row.fee,
      cost = total - s.amount,
      burden = s.income ? ((q + s.other) / s.income) * 100 : 0;
    return {
      main: q,
      score: -total,
      desc: `Costo total ${usd(cost)} · carga ${pct(burden)}`,
      a: pct(row.rate),
      b: usd(row.fee),
    };
  }
  const payoff = NeoDatFinance.cardPayoff(
      s.balance,
      row.rate,
      s.payment,
      row.fee,
    ),
    m = payoff.months,
    interest = payoff.interest;
  return {
    main: m,
    score: Number.isFinite(m) ? -m : -1e9,
    desc: !Number.isFinite(m)
      ? "Pago insuficiente para amortizar"
      : `Interés estimado ${usd(interest)}`,
    a: pct(row.rate),
    b: usd(row.fee),
  };
}
function render() {
  const s = state[tab],
    ms = s.rows.map(metrics),
    best = Math.max(...ms.map((x) => x.score)),
    bestIndex = ms.findIndex((x) => x.score === best);
  $("bestBadge").textContent = s.rows[bestIndex]?.name || "—";
  $("bankHead").innerHTML =
    `<tr><th>Institución</th><th>Tasa anual</th><th>Cargo inicial/anual</th><th>${tab === "inv" ? "Valor final" : tab === "loan" ? "Cuota" : "Meses para pagar"}</th><th>Lectura</th><th></th></tr>`;
  $("bankBody").innerHTML = s.rows
    .map((r, i) => {
      const m = ms[i],
        main =
          tab === "card"
            ? Number.isFinite(m.main)
              ? `${m.main} meses`
              : "No amortiza"
            : usd(m.main);
      return `<tr style="${i === bestIndex ? "background:#f1faf6" : ""}"><td><input data-i="${i}" data-k="name" value="${NeoDat.escapeHtml(r.name)}"></td><td><input data-i="${i}" data-k="rate" type="number" step=".1" value="${r.rate}"></td><td><input data-i="${i}" data-k="fee" type="number" step="1" value="${r.fee}"></td><td><b>${main}</b></td><td>${m.desc}</td><td><button class="btn" data-del="${i}" style="min-height:28px;padding:0 8px">×</button></td></tr>`;
    })
    .join("");
  $("bankBody")
    .querySelectorAll("input")
    .forEach((el) =>
      el.addEventListener("input", () => {
        let r = s.rows[+el.dataset.i];
        r[el.dataset.k] =
          el.dataset.k === "name" ? el.value : NeoDat.number(el.value);
        render();
      }),
    );
  $("bankBody")
    .querySelectorAll("[data-del]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          if (s.rows.length > 1) {
            s.rows.splice(+b.dataset.del, 1);
            render();
          }
        }),
    );
  const k = ms[bestIndex] || { main: 0, desc: "" };
  const vals =
    tab === "inv"
      ? [
          ["Mejor valor final", usd(k.main), "Alternativa destacada"],
          ["Capital", usd(s.capital), "Base"],
          ["Plazo", `${s.months} meses`, "Horizonte"],
          ["Inflación", pct(s.inflation), "Supuesto"],
        ]
      : tab === "loan"
        ? [
            ["Menor cuota", usd(k.main), "Alternativa destacada"],
            ["Monto", usd(s.amount), "Crédito"],
            ["Plazo", `${s.months} meses`, "Horizonte"],
            ["Ingreso", usd(s.income), "Mensual"],
          ]
        : [
            [
              "Menor plazo",
              Number.isFinite(k.main) ? `${k.main} meses` : "No amortiza",
              "Alternativa destacada",
            ],
            ["Saldo", usd(s.balance), "Tarjeta"],
            ["Pago", usd(s.payment), "Mensual"],
            ["Ingreso", usd(s.income), "Mensual"],
          ];
  $("bankKpis").innerHTML = vals
    .map(
      (x, i) =>
        `<article class="kpi ${i === 0 ? "accent" : ""}"><span>${x[0]}</span><b>${x[1]}</b><small>${x[2]}</small></article>`,
    )
    .join("");
  $("bankReading").innerHTML =
    `<strong style="color:#172237">Lectura ejecutiva:</strong> ${NeoDat.escapeHtml(s.rows[bestIndex]?.name || "La mejor alternativa")} presenta la mejor relación según los parámetros actuales. ${k.desc}`;
}
document.querySelectorAll(".tab").forEach(
  (b) =>
    (b.onclick = () => {
      document
        .querySelectorAll(".tab")
        .forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      tab = b.dataset.tab;
      controls();
      render();
    }),
);
$("addBtn").onclick = () => {
  state[tab].rows.push(
    tab === "inv"
      ? { name: "Nueva alternativa", rate: 5, fee: 0, risk: 2 }
      : { name: "Nueva alternativa", rate: 15, fee: 0 },
  );
  render();
};
$("csvBtn").onclick = () => {
  const s = state[tab];
  NeoDat.downloadCsv(`comparador_${tab}_neodat.csv`, [
    ["Institución", "Tasa", "Cargo"],
    ...s.rows.map((r) => [r.name, r.rate, r.fee]),
  ]);
};
controls();
render();
