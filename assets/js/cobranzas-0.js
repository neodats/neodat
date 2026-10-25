(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const fmtMoney = (n) =>
    new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(Number(n || 0));
  const fmtDate = (s) =>
    new Intl.DateTimeFormat("es-EC", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(s + "T12:00:00"));
  const todayISO = () => NeoDat.localDate();
  const daysDiff = (a, b) =>
    Math.round(
      (new Date(a + "T12:00:00") - new Date(b + "T12:00:00")) / 86400000,
    );
  const uid = (prefix) =>
    prefix +
    Math.random().toString(36).slice(2, 8) +
    Date.now().toString(36).slice(-4);

  const defaultData = {
    students: [
      {
        id: "s1",
        name: "María Fernanda Ruiz",
        doc: "1104587213",
        program: "Administración de Empresas",
        phone: "+593 98 421 7630",
        email: "maria.ruiz@correo.ec",
        total: 1800,
      },
      {
        id: "s2",
        name: "José Andrés Castillo",
        doc: "1103728194",
        program: "Negocios Internacionales",
        phone: "+593 99 504 2811",
        email: "jose.castillo@correo.ec",
        total: 1800,
      },
      {
        id: "s3",
        name: "Valentina Torres",
        doc: "1105683175",
        program: "Marketing",
        phone: "+593 96 318 5074",
        email: "valentina.torres@correo.ec",
        total: 1500,
      },
      {
        id: "s4",
        name: "Daniel Salazar",
        doc: "1104782361",
        program: "Economía",
        phone: "+593 98 746 0912",
        email: "daniel.salazar@correo.ec",
        total: 1800,
      },
      {
        id: "s5",
        name: "Camila Ortega",
        doc: "1106284509",
        program: "Administración de Empresas",
        phone: "+593 99 267 8144",
        email: "camila.ortega@correo.ec",
        total: 1500,
      },
      {
        id: "s6",
        name: "Sebastián Vega",
        doc: "1103957248",
        program: "Finanzas",
        phone: "+593 97 602 4187",
        email: "sebastian.vega@correo.ec",
        total: 1800,
      },
    ],
    installments: [
      {
        id: "c1",
        studentId: "s1",
        concept: "Cuota 1 · Agosto",
        due: "2026-08-20",
        amount: 600,
        paid: 600,
      },
      {
        id: "c2",
        studentId: "s1",
        concept: "Cuota 2 · Septiembre",
        due: "2026-09-20",
        amount: 600,
        paid: 0,
      },
      {
        id: "c3",
        studentId: "s2",
        concept: "Cuota 1 · Agosto",
        due: "2026-08-18",
        amount: 600,
        paid: 350,
      },
      {
        id: "c4",
        studentId: "s2",
        concept: "Cuota 2 · Septiembre",
        due: "2026-09-18",
        amount: 600,
        paid: 0,
      },
      {
        id: "c5",
        studentId: "s3",
        concept: "Cuota 1 · Agosto",
        due: "2026-08-25",
        amount: 500,
        paid: 0,
      },
      {
        id: "c6",
        studentId: "s3",
        concept: "Cuota 2 · Septiembre",
        due: "2026-09-25",
        amount: 500,
        paid: 0,
      },
      {
        id: "c7",
        studentId: "s4",
        concept: "Cuota 1 · Agosto",
        due: "2026-08-12",
        amount: 600,
        paid: 600,
      },
      {
        id: "c8",
        studentId: "s4",
        concept: "Cuota 2 · Septiembre",
        due: "2026-09-12",
        amount: 600,
        paid: 0,
      },
      {
        id: "c9",
        studentId: "s5",
        concept: "Cuota 1 · Agosto",
        due: "2026-08-22",
        amount: 500,
        paid: 0,
      },
      {
        id: "c10",
        studentId: "s5",
        concept: "Cuota 2 · Septiembre",
        due: "2026-09-22",
        amount: 500,
        paid: 0,
      },
      {
        id: "c11",
        studentId: "s6",
        concept: "Cuota 1 · Agosto",
        due: "2026-08-10",
        amount: 600,
        paid: 600,
      },
      {
        id: "c12",
        studentId: "s6",
        concept: "Cuota 2 · Septiembre",
        due: "2026-09-10",
        amount: 600,
        paid: 0,
      },
    ],
    activities: [
      {
        type: "payment",
        title: "Pago registrado",
        detail: "Sebastián Vega · $600,00",
        time: "Hoy · 15:42",
      },
      {
        type: "message",
        title: "Recordatorio enviado",
        detail: "Camila Ortega · WhatsApp",
        time: "Hoy · 10:05",
      },
      {
        type: "payment",
        title: "Pago parcial registrado",
        detail: "José Andrés Castillo · $350,00",
        time: "Ayer · 16:20",
      },
      {
        type: "message",
        title: "Recordatorio enviado",
        detail: "María Fernanda Ruiz · WhatsApp",
        time: "Ayer · 09:00",
      },
    ],
    settings: { institution: "Institución Educativa" },
    automation: {
      pre: true,
      today: true,
      overdue: true,
      weekly: false,
      confirm: true,
      internal: true,
    },
  };

  let state = loadState();
  let currentChannel = "WhatsApp";
  let currentTemplate = "pre";

  function loadState() {
    try {
      const saved = localStorage.getItem("neodat_cobranzas_state_v1");
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed &&
        ["students", "installments", "activities"].every((key) =>
          Array.isArray(parsed[key]),
        ) &&
        parsed.settings &&
        parsed.automation
        ? parsed
        : structuredClone(defaultData);
    } catch (e) {
      return JSON.parse(JSON.stringify(defaultData));
    }
  }
  function saveState() {
    try {
      localStorage.setItem("neodat_cobranzas_state_v1", JSON.stringify(state));
    } catch {
      toast(
        "Almacenamiento no disponible",
        "Los cambios solo se conservan mientras esta página siga abierta. Exporte una copia antes de salir.",
      );
    }
  }

  function installmentStatus(i) {
    const balance = Math.max(0, i.amount - i.paid);
    if (balance <= 0.001) return "paid";
    if (i.paid > 0)
      return daysDiff(i.due, todayISO()) < 0 ? "overdue" : "partial";
    return daysDiff(i.due, todayISO()) < 0 ? "overdue" : "pending";
  }
  function statusLabel(s) {
    return (
      {
        paid: "Pagada",
        pending: "Pendiente",
        overdue: "Vencida",
        partial: "Parcial",
      }[s] || s
    );
  }
  function studentById(id) {
    return state.students.find((s) => s.id === id);
  }
  function studentTotals(id) {
    const its = state.installments.filter((i) => i.studentId === id);
    const billed = its.reduce((a, i) => a + i.amount, 0);
    const paid = its.reduce((a, i) => a + i.paid, 0);
    const overdue = its.some((i) => installmentStatus(i) === "overdue");
    const pending = its.some((i) =>
      ["pending", "partial"].includes(installmentStatus(i)),
    );
    return {
      billed,
      paid,
      balance: billed - paid,
      status: overdue ? "vencido" : pending ? "pendiente" : "al-dia",
    };
  }
  function studentStatusLabel(s) {
    return s === "al-dia"
      ? "Al día"
      : s === "vencido"
        ? "Vencido"
        : "Pendiente";
  }
  function studentBadge(s) {
    return s === "al-dia" ? "paid" : s === "vencido" ? "overdue" : "pending";
  }
  function initials(name) {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((x) => x[0])
      .join("")
      .toUpperCase();
  }

  function toast(title, detail) {
    const wrap = $("#toastWrap");
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `<div class="toast-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m5 12 4 4L19 6"/></svg></div><div><strong>${NeoDat.escapeHtml(title)}</strong><span>${NeoDat.escapeHtml(detail)}</span></div>`;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 3600);
  }

  function addActivity(type, title, detail) {
    state.activities.unshift({ type, title, detail, time: "Ahora" });
    state.activities = state.activities.slice(0, 12);
    saveState();
    renderActivities();
  }

  const viewMeta = {
    dashboard: [
      "Panel de control",
      "Seguimiento financiero y operativo de cobranzas",
    ],
    students: ["Estudiantes", "Directorio y comportamiento de pago"],
    payments: [
      "Cuotas y pagos",
      "Control detallado de obligaciones y recaudación",
    ],
    messages: ["Mensajería", "Recordatorios de cobranza y comunicaciones"],
    automations: [
      "Recordatorios automáticos",
      "Flujos de contacto por fecha de vencimiento",
    ],
    settings: ["Configuración", "Parámetros generales e integraciones"],
  };

  function showView(name) {
    $$(".view").forEach((v) =>
      v.classList.toggle("active", v.id === `view-${name}`),
    );
    $$(".nav-btn").forEach((b) =>
      b.classList.toggle("active", b.dataset.view === name),
    );
    $("#pageTitle").textContent = viewMeta[name][0];
    $("#pageSubtitle").textContent = viewMeta[name][1];
    $("#sidebar").classList.remove("open");
    $("#mobileOverlay").classList.remove("show");
    if (name === "dashboard") renderDashboard();
    if (name === "students") renderStudents();
    if (name === "payments") renderPayments();
    if (name === "messages") renderMessageStudentOptions();
  }

  $$(".nav-btn").forEach((b) =>
    b.addEventListener("click", () => showView(b.dataset.view)),
  );
  $$("[data-go]").forEach((b) =>
    b.addEventListener("click", () => showView(b.dataset.go)),
  );
  $("#menuBtn").addEventListener("click", () => {
    $("#sidebar").classList.add("open");
    $("#mobileOverlay").classList.add("show");
  });
  $("#mobileOverlay").addEventListener("click", () => {
    $("#sidebar").classList.remove("open");
    $("#mobileOverlay").classList.remove("show");
  });

  function renderDashboard() {
    const totalAmount = state.installments.reduce((a, i) => a + i.amount, 0);
    const totalPaid = state.installments.reduce((a, i) => a + i.paid, 0);
    const totalPending = Math.max(0, totalAmount - totalPaid);
    const paidCount = state.installments.filter(
      (i) => installmentStatus(i) === "paid",
    ).length;
    const pendingCount = state.installments.filter((i) =>
      ["pending", "partial"].includes(installmentStatus(i)),
    ).length;
    const overdueCount = state.installments.filter(
      (i) => installmentStatus(i) === "overdue",
    ).length;
    const compliance = state.installments.length
      ? Math.round((paidCount / state.installments.length) * 100)
      : 0;
    const collectionRate = totalAmount
      ? Math.round((totalPaid / totalAmount) * 100)
      : 0;

    $("#totalCollected").textContent = fmtMoney(totalPaid);
    $("#totalPending").textContent = fmtMoney(totalPending);
    $("#overdueCount").textContent = overdueCount;
    $("#complianceRate").textContent = compliance + "%";
    $("#collectionRateBadge").textContent = collectionRate + "%";
    $("#statusPaid").textContent = paidCount;
    $("#statusPending").textContent = pendingCount;
    $("#statusOverdue").textContent = overdueCount;
    $("#donutPercent").textContent = compliance + "%";

    const total = state.installments.length || 1;
    const pp = ((paidCount / total) * 100).toFixed(1),
      qp = (((paidCount + pendingCount) / total) * 100).toFixed(1);
    $("#statusDonut").style.background =
      `conic-gradient(var(--success) 0 ${pp}%, var(--warning) ${pp}% ${qp}%, var(--danger) ${qp}% 100%)`;

    renderChart();
    renderAttention();
    renderActivities();
  }

  function renderChart() {
    const chart = $("#collectionChart");
    chart.querySelectorAll(".bar-group").forEach((x) => x.remove());
    const months = [
      ["Mar", 4100, 3150],
      ["Abr", 4300, 3560],
      ["May", 4600, 3820],
      ["Jun", 4800, 4010],
      ["Jul", 5100, 4520],
      [
        "Ago",
        5200,
        state.installments
          .filter((i) => i.due.startsWith("2026-08"))
          .reduce((a, i) => a + i.paid, 0),
      ],
    ];
    const max = Math.max(...months.flatMap((m) => [m[1], m[2]]));
    months.forEach((m) => {
      const g = document.createElement("div");
      g.className = "bar-group";
      g.innerHTML = `<div class="bar expected" style="height:${((m[1] / max) * 100).toFixed(1)}%" title="${fmtMoney(m[1])} esperado"></div><div class="bar collected" style="height:${((m[2] / max) * 100).toFixed(1)}%" title="${fmtMoney(m[2])} recaudado"></div><span class="bar-label">${m[0]}</span>`;
      chart.appendChild(g);
    });
  }

  function renderAttention() {
    const items = state.installments
      .filter((i) => installmentStatus(i) !== "paid")
      .sort((a, b) => new Date(a.due) - new Date(b.due))
      .slice(0, 6);
    $("#attentionTable").innerHTML = items.length
      ? items
          .map((i) => {
            const s = studentById(i.studentId),
              st = installmentStatus(i),
              bal = i.amount - i.paid;
            return `<tr>
        <td><div class="student-cell"><div class="student-avatar">${NeoDat.escapeHtml(initials(s.name))}</div><div><strong>${NeoDat.escapeHtml(s.name)}</strong><span>${NeoDat.escapeHtml(s.program)}</span></div></div></td>
        <td>${NeoDat.escapeHtml(i.concept)}</td><td>${fmtDate(i.due)}</td><td class="amount">${fmtMoney(bal)}</td>
        <td><span class="badge ${st}">${statusLabel(st)}</span></td>
        <td><button class="btn btn-secondary btn-sm" data-remind="${NeoDat.escapeHtml(i.id)}">Recordar</button></td>
      </tr>`;
          })
          .join("")
      : `<tr><td colspan="6" class="empty">No existen cuotas pendientes.</td></tr>`;
    $$("[data-remind]").forEach((b) =>
      b.addEventListener("click", () => quickReminder(b.dataset.remind)),
    );
  }

  function renderActivities() {
    const icons = {
      payment: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 7 9 18l-5-5"/></svg>`,
      message: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/></svg>`,
    };
    $("#activityList").innerHTML = state.activities
      .slice(0, 6)
      .map(
        (a) => `<div class="activity">
      <div class="activity-icon ${a.type === "payment" ? "success" : "warning"}">${icons[a.type] || icons.message}</div>
      <div><strong>${NeoDat.escapeHtml(a.title)}</strong><span>${NeoDat.escapeHtml(a.detail)}</span></div><time>${NeoDat.escapeHtml(a.time)}</time>
    </div>`,
      )
      .join("");
  }

  function renderStudents() {
    const q = $("#studentSearch").value.trim().toLowerCase();
    const f = $("#studentStatusFilter").value;
    const rows = state.students.filter((s) => {
      const t = studentTotals(s.id);
      const hay = [s.name, s.doc, s.program, s.phone]
        .join(" ")
        .toLowerCase()
        .includes(q);
      return hay && (f === "all" || t.status === f);
    });
    $("#studentCountLabel").textContent =
      `${rows.length} registro${rows.length === 1 ? "" : "s"} visible${rows.length === 1 ? "" : "s"}`;
    $("#studentsTable").innerHTML = rows.length
      ? rows
          .map((s) => {
            const t = studentTotals(s.id),
              pct = t.billed
                ? Math.min(100, Math.round((t.paid / t.billed) * 100))
                : 0;
            return `<tr>
        <td><div class="student-cell"><div class="student-avatar">${NeoDat.escapeHtml(initials(s.name))}</div><div><strong>${NeoDat.escapeHtml(s.name)}</strong><span>${NeoDat.escapeHtml(s.doc)}</span></div></div></td>
        <td>${NeoDat.escapeHtml(s.program)}</td><td>${NeoDat.escapeHtml(s.phone)}</td><td class="amount">${fmtMoney(s.total)}</td><td>${fmtMoney(t.paid)}</td>
        <td><div class="progress"><i style="width:${pct}%"></i></div><div class="progress-label">${pct}% cubierto</div></td>
        <td><span class="badge ${studentBadge(t.status)}">${studentStatusLabel(t.status)}</span></td>
        <td><div class="action-menu"><button class="table-icon" title="Enviar recordatorio" data-message-student="${NeoDat.escapeHtml(s.id)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/></svg></button></div></td>
      </tr>`;
          })
          .join("")
      : `<tr><td colspan="8" class="empty">No se encontraron estudiantes.</td></tr>`;
    $$("[data-message-student]").forEach((b) =>
      b.addEventListener("click", () => {
        showView("messages");
        $("#messageStudent").value = b.dataset.messageStudent;
        applyTemplate(currentTemplate);
      }),
    );
  }

  function renderPayments() {
    const q = $("#paymentSearch").value.trim().toLowerCase();
    const fs = $("#paymentStatusFilter").value;
    const fm = $("#paymentMonthFilter").value;
    const rows = state.installments
      .filter((i) => {
        const s = studentById(i.studentId),
          st = installmentStatus(i);
        return (
          [s?.name || "", i.concept].join(" ").toLowerCase().includes(q) &&
          (fs === "all" || st === fs) &&
          (fm === "all" || i.due.slice(0, 7) === fm)
        );
      })
      .sort((a, b) => new Date(a.due) - new Date(b.due));
    $("#paymentCountLabel").textContent =
      `${rows.length} cuota${rows.length === 1 ? "" : "s"}`;
    $("#paymentsTable").innerHTML = rows.length
      ? rows
          .map((i) => {
            const s = studentById(i.studentId),
              st = installmentStatus(i),
              bal = Math.max(0, i.amount - i.paid);
            return `<tr>
        <td><div class="student-cell"><div class="student-avatar">${NeoDat.escapeHtml(initials(s.name))}</div><div><strong>${NeoDat.escapeHtml(s.name)}</strong><span>${NeoDat.escapeHtml(s.doc)}</span></div></div></td>
        <td>${NeoDat.escapeHtml(i.concept)}</td><td>${fmtDate(i.due)}</td><td>${fmtMoney(i.amount)}</td><td>${fmtMoney(i.paid)}</td><td class="amount">${fmtMoney(bal)}</td>
        <td><span class="badge ${st}">${statusLabel(st)}</span></td>
        <td><div class="action-menu">${bal > 0 ? `<button class="table-icon" title="Registrar pago" data-pay-id="${NeoDat.escapeHtml(i.id)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14"/></svg></button><button class="table-icon" title="Enviar recordatorio" data-remind="${NeoDat.escapeHtml(i.id)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/></svg></button>` : ""}</div></td>
      </tr>`;
          })
          .join("")
      : `<tr><td colspan="8" class="empty">No existen cuotas con esos criterios.</td></tr>`;
    $$("[data-remind]").forEach((b) =>
      b.addEventListener("click", () => quickReminder(b.dataset.remind)),
    );
    $$("[data-pay-id]").forEach((b) =>
      b.addEventListener("click", () => openPaymentModal(b.dataset.payId)),
    );
  }

  function populateMonthFilter() {
    const months = [
      ...new Set(state.installments.map((i) => i.due.slice(0, 7))),
    ].sort();
    const sel = $("#paymentMonthFilter"),
      current = sel.value;
    sel.innerHTML =
      `<option value="all">Todos los meses</option>` +
      months
        .map((m) => {
          const d = new Date(m + "-01T12:00:00");
          const label = new Intl.DateTimeFormat("es-EC", {
            month: "long",
            year: "numeric",
          }).format(d);
          return `<option value="${m}">${label.charAt(0).toUpperCase() + label.slice(1)}</option>`;
        })
        .join("");
    if ([...sel.options].some((o) => o.value === current)) sel.value = current;
  }

  function renderMessageStudentOptions() {
    const sel = $("#messageStudent"),
      current = sel.value;
    sel.innerHTML = state.students
      .map(
        (s) =>
          `<option value="${NeoDat.escapeHtml(s.id)}">${NeoDat.escapeHtml(s.name)} · ${NeoDat.escapeHtml(s.phone)}</option>`,
      )
      .join("");
    if (current && state.students.some((s) => s.id === current))
      sel.value = current;
    applyTemplate(currentTemplate);
  }

  const templates = {
    pre: "Estimado/a {nombre}, le recordamos que su {cuota} vence el {fecha}. El saldo pendiente es {saldo}. Agradecemos realizar su pago dentro de la fecha establecida. Si ya efectuó el pago, por favor ignore este mensaje.",
    today:
      "Estimado/a {nombre}, su {cuota} vence hoy. El valor pendiente es {saldo}. Le agradecemos gestionar el pago oportunamente. Si ya realizó el pago, por favor ignore este mensaje.",
    overdue:
      "Estimado/a {nombre}, registramos que su {cuota}, con vencimiento el {fecha}, mantiene un saldo pendiente de {saldo}. Agradecemos regularizar el pago o comunicarse con el área de cobranzas si requiere asistencia.",
    confirm:
      "Estimado/a {nombre}, confirmamos la recepción de su pago correspondiente a {cuota}. Gracias por mantener sus obligaciones al día.",
  };

  function nextOpenInstallment(studentId) {
    return (
      state.installments
        .filter(
          (i) => i.studentId === studentId && installmentStatus(i) !== "paid",
        )
        .sort((a, b) => new Date(a.due) - new Date(b.due))[0] ||
      state.installments
        .filter((i) => i.studentId === studentId)
        .sort((a, b) => new Date(b.due) - new Date(a.due))[0]
    );
  }

  function applyTemplate(key) {
    currentTemplate = key;
    $$(".template").forEach((t) =>
      t.classList.toggle("active", t.dataset.template === key),
    );
    $("#messageText").value = templates[key] || "";
  }

  function resolveMessage(raw, student, installment) {
    return raw
      .replaceAll("{nombre}", student?.name || "")
      .replaceAll("{cuota}", installment?.concept || "su cuota")
      .replaceAll(
        "{fecha}",
        installment?.due ? fmtDate(installment.due) : "la fecha prevista",
      )
      .replaceAll(
        "{saldo}",
        installment
          ? fmtMoney(Math.max(0, installment.amount - installment.paid))
          : "",
      );
  }

  function quickReminder(installmentId) {
    const i = state.installments.find((x) => x.id === installmentId),
      s = studentById(i.studentId);
    const st = installmentStatus(i);
    const key =
      st === "overdue"
        ? "overdue"
        : daysDiff(i.due, todayISO()) === 0
          ? "today"
          : "pre";
    const msg = resolveMessage(templates[key], s, i);
    addActivity(
      "message",
      "Recordatorio enviado",
      `${NeoDat.escapeHtml(s.name)} · WhatsApp`,
    );
    toast(
      "Recordatorio simulado",
      `Mensaje preparado para ${NeoDat.escapeHtml(s.phone)}: ${msg.slice(0, 95)}${msg.length > 95 ? "…" : ""}`,
    );
  }

  $$(".template").forEach((t) =>
    t.addEventListener("click", () => applyTemplate(t.dataset.template)),
  );
  $$(".channel").forEach((c) =>
    c.addEventListener("click", () => {
      currentChannel = c.dataset.channel;
      $$(".channel").forEach((x) => x.classList.toggle("active", x === c));
    }),
  );
  $$(".token").forEach((t) =>
    t.addEventListener("click", () => {
      const area = $("#messageText"),
        start = area.selectionStart,
        end = area.selectionEnd;
      area.value =
        area.value.slice(0, start) + t.dataset.token + area.value.slice(end);
      area.focus();
      area.selectionStart = area.selectionEnd = start + t.dataset.token.length;
    }),
  );
  $("#messageStudent").addEventListener("change", () =>
    applyTemplate(currentTemplate),
  );
  $("#sendMessageBtn").addEventListener("click", () => {
    const s = studentById($("#messageStudent").value);
    if (!s) {
      toast("Sin destinatario", "Seleccione un estudiante.");
      return;
    }
    const i = nextOpenInstallment(s.id);
    const msg = resolveMessage($("#messageText").value, s, i);
    addActivity(
      "message",
      "Recordatorio enviado",
      `${NeoDat.escapeHtml(s.name)} · ${currentChannel}`,
    );
    toast(
      `${currentChannel}: envío simulado`,
      `${NeoDat.escapeHtml(s.phone)} · ${msg.slice(0, 105)}${msg.length > 105 ? "…" : ""}`,
    );
  });

  function openModal(id) {
    $("#" + id).classList.add("show");
    $("#" + id).setAttribute("aria-hidden", "false");
  }
  function closeModal(id) {
    $("#" + id).classList.remove("show");
    $("#" + id).setAttribute("aria-hidden", "true");
  }
  $$("[data-close-modal]").forEach((b) =>
    b.addEventListener("click", () => closeModal(b.dataset.closeModal)),
  );
  $$(".modal").forEach((m) =>
    m.addEventListener("click", (e) => {
      if (e.target === m) closeModal(m.id);
    }),
  );

  $("#addStudentBtn").addEventListener("click", () =>
    openModal("studentModal"),
  );
  $("#studentForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const s = {
      id: uid("s"),
      name: $("#stName").value.trim(),
      doc: $("#stId").value.trim(),
      program: $("#stProgram").value.trim(),
      phone: $("#stPhone").value.trim(),
      email: $("#stEmail").value.trim(),
      total: Number($("#stTotal").value),
    };
    state.students.push(s);
    saveState();
    closeModal("studentModal");
    e.target.reset();
    renderStudents();
    renderMessageStudentOptions();
    toast(
      "Estudiante creado",
      `${NeoDat.escapeHtml(s.name)} fue incorporado correctamente.`,
    );
  });

  function openPaymentModal(installmentId) {
    const open = state.installments.filter(
      (i) => installmentStatus(i) !== "paid",
    );
    $("#payInstallment").innerHTML = open
      .map((i) => {
        const s = studentById(i.studentId);
        return `<option value="${NeoDat.escapeHtml(i.id)}">${NeoDat.escapeHtml(s.name)} · ${NeoDat.escapeHtml(i.concept)} · saldo ${fmtMoney(i.amount - i.paid)}</option>`;
      })
      .join("");
    if (installmentId) $("#payInstallment").value = installmentId;
    $("#payDate").value = todayISO();
    const i = state.installments.find(
      (x) => x.id === $("#payInstallment").value,
    );
    if (i) $("#payAmount").value = Math.max(0, i.amount - i.paid).toFixed(2);
    openModal("paymentModal");
  }
  $$("[data-open-payment]").forEach((b) =>
    b.addEventListener("click", () => openPaymentModal()),
  );
  $("#payInstallment").addEventListener("change", () => {
    const i = state.installments.find(
      (x) => x.id === $("#payInstallment").value,
    );
    if (i) $("#payAmount").value = Math.max(0, i.amount - i.paid).toFixed(2);
  });
  $("#paymentForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const i = state.installments.find(
      (x) => x.id === $("#payInstallment").value,
    );
    if (!i) return;
    const amount = Number($("#payAmount").value);
    const balance = Math.max(0, i.amount - i.paid);
    if (amount <= 0 || amount > balance + 0.001) {
      toast(
        "Valor no válido",
        `El pago debe ser mayor a cero y no superar ${fmtMoney(balance)}.`,
      );
      return;
    }
    i.paid = Number((i.paid + amount).toFixed(2));
    const s = studentById(i.studentId);
    addActivity(
      "payment",
      i.paid >= i.amount ? "Pago registrado" : "Pago parcial registrado",
      `${NeoDat.escapeHtml(s.name)} · ${fmtMoney(amount)}`,
    );
    saveState();
    closeModal("paymentModal");
    e.target.reset();
    renderAll();
    if (state.automation.confirm) {
      toast(
        "Pago registrado",
        `${fmtMoney(amount)} aplicado a ${NeoDat.escapeHtml(i.concept)}. Confirmación automática preparada para ${NeoDat.escapeHtml(s.phone)}.`,
      );
    } else {
      toast(
        "Pago registrado",
        `${fmtMoney(amount)} aplicado a ${NeoDat.escapeHtml(i.concept)}.`,
      );
    }
  });

  $("#studentSearch").addEventListener("input", renderStudents);
  $("#studentStatusFilter").addEventListener("change", renderStudents);
  $("#paymentSearch").addEventListener("input", renderPayments);
  $("#paymentStatusFilter").addEventListener("change", renderPayments);
  $("#paymentMonthFilter").addEventListener("change", renderPayments);

  $$("[data-auto]").forEach((c) => {
    c.checked = !!state.automation[c.dataset.auto];
    c.addEventListener("change", () => {
      state.automation[c.dataset.auto] = c.checked;
      saveState();
      toast(
        "Automatización actualizada",
        c.checked ? "Regla activada." : "Regla desactivada.",
      );
    });
  });

  $("#runAutomationBtn").addEventListener("click", () => {
    let matches = 0;
    state.installments.forEach((i) => {
      if (installmentStatus(i) === "paid") return;
      const d = daysDiff(i.due, todayISO());
      if (
        (d === 3 && state.automation.pre) ||
        (d === 0 && state.automation.today) ||
        (d === -2 && state.automation.overdue)
      )
        matches++;
    });
    addActivity(
      "message",
      "Prueba de automatización",
      `${matches} recordatorio${matches === 1 ? "" : "s"} detectado${matches === 1 ? "" : "s"}`,
    );
    toast(
      "Prueba completada",
      `${matches} cuota${matches === 1 ? "" : "s"} cumple${matches === 1 ? "" : "n"} las reglas activas para hoy.`,
    );
  });

  $("#saveSettingsBtn").addEventListener("click", () => {
    state.settings.institution =
      $("#institutionName").value.trim() || "Institución Educativa";
    saveState();
    toast(
      "Configuración guardada",
      "Los datos institucionales fueron actualizados.",
    );
  });

  $("#connectWhatsapp").addEventListener("click", () =>
    toast(
      "Integración externa requerida",
      "Para envíos reales debe conectar una cuenta de WhatsApp Business mediante su API oficial.",
    ),
  );
  $("#connectSms").addEventListener("click", () =>
    toast(
      "Integración externa requerida",
      "Para envíos reales debe conectar un proveedor de SMS mediante API.",
    ),
  );
  $("#notificationBtn").addEventListener("click", () => {
    const n = state.installments.filter(
      (i) => installmentStatus(i) === "overdue",
    ).length;
    toast(
      "Alertas de cobranza",
      `${n} cuota${n === 1 ? "" : "s"} vencida${n === 1 ? "" : "s"} requiere${n === 1 ? "" : "n"} atención.`,
    );
  });

  $("#institutionName").value =
    state.settings?.institution || "Institución Educativa";

  function renderAll() {
    populateMonthFilter();
    renderDashboard();
    renderStudents();
    renderPayments();
    renderMessageStudentOptions();
  }

  renderAll();
})();
