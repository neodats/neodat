(() => {
  "use strict";

  const POLL_MS = 1000;
  const stateLive = {
    open: false,
    table: "personas",
    timer: null,
    loading: false,
    lastRunId: "",
  };

  const tableDefinitions = {
    personas: {
      table: "personas_simuladas",
      select:
        "id,simulacion_id,persona_codigo,tipo_usuario,con_cita,tramite_nombre,monto_usd,moneda,estado_final,fecha_ingreso,fecha_salida,updated_at",
      order: "updated_at.desc",
      columns: [
        ["simulacion_id", "Ejecución"],
        ["persona_codigo", "Persona"],
        ["tipo_usuario", "Usuario"],
        ["con_cita", "Con cita"],
        ["tramite_nombre", "Trámite"],
        ["monto_usd", "Monto USD"],
        ["estado_final", "Estado"],
        ["fecha_ingreso", "Ingreso"],
        ["fecha_salida", "Salida"],
        ["updated_at", "Actualizado"],
      ],
    },
    eventos: {
      table: "eventos_simulacion",
      select:
        "id,simulacion_id,persona_codigo,evento,area,departamento,procedimiento,fecha_hora,minuto_simulado,created_at",
      order: "id.desc",
      columns: [
        ["simulacion_id", "Ejecución"],
        ["id", "ID"],
        ["persona_codigo", "Persona"],
        ["evento", "Evento"],
        ["area", "Área"],
        ["departamento", "Departamento"],
        ["procedimiento", "Procedimiento"],
        ["fecha_hora", "Fecha y hora"],
        ["minuto_simulado", "Minuto"],
      ],
    },
    movimientos: {
      table: "movimientos_financieros",
      select:
        "id,simulacion_id,persona_codigo,tipo_movimiento,descripcion,moneda,monto_usd,efecto_capital_usd,capital_antes_usd,capital_despues_usd,fecha_hora",
      order: "id.desc",
      columns: [
        ["simulacion_id", "Ejecución"],
        ["id", "ID"],
        ["persona_codigo", "Persona"],
        ["tipo_movimiento", "Movimiento"],
        ["descripcion", "Descripción"],
        ["monto_usd", "Monto USD"],
        ["efecto_capital_usd", "Efecto USD"],
        ["capital_antes_usd", "Capital antes"],
        ["capital_despues_usd", "Capital después"],
        ["fecha_hora", "Fecha y hora"],
      ],
    },
    metricas: {
      table: "metricas_simulacion",
      select:
        "id,simulacion_id,minuto_simulado,personas_ingresadas,personas_finalizadas,personas_en_sistema,cola_maxima,espera_promedio_minutos,capital_disponible_usd,creditos_aprobados,creditos_rechazados,fecha_hora,created_at",
      order: "id.desc",
      columns: [
        ["simulacion_id", "Ejecución"],
        ["id", "ID"],
        ["minuto_simulado", "Minuto"],
        ["personas_ingresadas", "Ingresadas"],
        ["personas_finalizadas", "Finalizadas"],
        ["personas_en_sistema", "En sistema"],
        ["cola_maxima", "Cola máxima"],
        ["espera_promedio_minutos", "Espera promedio"],
        ["capital_disponible_usd", "Capital USD"],
        ["creditos_aprobados", "Créditos aprobados"],
        ["creditos_rechazados", "Créditos rechazados"],
        ["fecha_hora", "Fecha y hora"],
      ],
    },
    sincronizaciones: {
      table: "sincronizaciones_simulador",
      select:
        "simulacion_id,sync_id,estado,es_snapshot_completo,filas_personas,filas_pasos,filas_eventos,filas_movimientos,filas_creditos,filas_cartera,filas_variables,filas_metricas,created_at,completed_at",
      order: "created_at.desc",
      columns: [
        ["simulacion_id", "Ejecución"],
        ["sync_id", "Sincronización"],
        ["estado", "Estado"],
        ["es_snapshot_completo", "Snapshot"],
        ["filas_personas", "Personas"],
        ["filas_pasos", "Pasos"],
        ["filas_eventos", "Eventos"],
        ["filas_movimientos", "Movimientos"],
        ["filas_creditos", "Créditos"],
        ["filas_metricas", "Métricas"],
        ["completed_at", "Completada"],
      ],
    },
  };

  const domLive = {
    button: document.getElementById("liveSupabaseBtn"),
    overlay: document.getElementById("supabaseLiveOverlay"),
    close: document.getElementById("closeSupabaseLiveBtn"),
    status: document.getElementById("supabaseLiveStatus"),
    meta: document.getElementById("supabaseLiveMeta"),
    tableWrap: document.getElementById("supabaseLiveTableWrap"),
    countPersons: document.getElementById("liveCountPersons"),
    countEvents: document.getElementById("liveCountEvents"),
    countMovements: document.getElementById("liveCountMovements"),
    countMetrics: document.getElementById("liveCountMetrics"),
    countSyncs: document.getElementById("liveCountSyncs"),
    tabs: [...document.querySelectorAll("[data-live-table]")],
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function money(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "—";
    return new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(number);
  }

  function dateTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("es-EC", {
      dateStyle: "short",
      timeStyle: "medium",
    }).format(date);
  }

  function currentRunId() {
    return String(window.FlowSimTramites?.supabase?.runId || "");
  }

  function configReady() {
    const config = window.SUPABASE_CONFIG || {};
    return Boolean(
      config.url &&
      config.publishableKey &&
      !String(config.publishableKey).includes("PEGUE_AQUI"),
    );
  }

  function apiHeaders(count = false) {
    const headers = {
      apikey: window.SUPABASE_CONFIG.publishableKey,
      Authorization: `Bearer ${window.SUPABASE_CONFIG.publishableKey}`,
      Accept: "application/json",
    };
    if (count) headers.Prefer = "count=exact";
    return headers;
  }

  async function resolveRunId() {
    const activeRun = currentRunId();
    if (activeRun) return activeRun;

    const url = new URL(
      `${window.SUPABASE_CONFIG.url.replace(/\/$/, "")}/rest/v1/simulaciones`,
    );
    url.searchParams.set("select", "id");
    url.searchParams.set("order", "created_at.desc");
    url.searchParams.set("limit", "1");

    const response = await fetch(url, {
      headers: apiHeaders(false),
      cache: "no-store",
    });
    if (!response.ok)
      throw new Error(`No se pudo obtener la simulación (${response.status}).`);
    const rows = await response.json();
    return String(rows?.[0]?.id || "");
  }

  async function fetchRows(definition, limit = 100) {
    const base = window.SUPABASE_CONFIG.url.replace(/\/$/, "");
    const url = new URL(`${base}/rest/v1/${definition.table}`);
    url.searchParams.set("select", definition.select);
    url.searchParams.set("order", definition.order);
    url.searchParams.set("limit", String(limit));

    const response = await fetch(url, {
      headers: apiHeaders(false),
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`${definition.table}: ${response.status} ${detail}`);
    }

    return response.json();
  }

  async function fetchCount(table) {
    const base = window.SUPABASE_CONFIG.url.replace(/\/$/, "");
    const url = new URL(`${base}/rest/v1/${table}`);
    url.searchParams.set("select", "simulacion_id");
    url.searchParams.set("limit", "1");

    const response = await fetch(url, {
      headers: {
        ...apiHeaders(true),
        Range: "0-0",
      },
      cache: "no-store",
    });

    if (!response.ok) return 0;
    const contentRange = response.headers.get("content-range") || "";
    const total = contentRange.split("/")[1];
    return total && total !== "*" ? Number(total) || 0 : 0;
  }

  function formatCell(key, value) {
    if (value === null || value === undefined || value === "") return "—";
    if (key === "simulacion_id") {
      const fullId = String(value);
      return `<span title="${escapeHtml(fullId)}">${escapeHtml(fullId.slice(0, 8))}…</span>`;
    }
    if (
      key.endsWith("_usd") ||
      key === "monto_usd" ||
      key === "capital_disponible_usd"
    ) {
      return `<span class="supabase-live-money">${escapeHtml(money(value))}</span>`;
    }
    if (
      key.includes("fecha") ||
      key.endsWith("_at") ||
      key === "completed_at" ||
      key === "created_at" ||
      key === "updated_at"
    ) {
      return escapeHtml(dateTime(value));
    }
    if (typeof value === "boolean") return value ? "Sí" : "No";
    if (typeof value === "object") return escapeHtml(JSON.stringify(value));
    return escapeHtml(value);
  }

  function renderTable(definition, rows) {
    if (!rows.length) {
      domLive.tableWrap.innerHTML =
        '<div class="supabase-live-empty">Todavía no existen registros históricos para esta tabla.</div>';
      return;
    }

    const head = definition.columns
      .map(([, label]) => `<th>${escapeHtml(label)}</th>`)
      .join("");

    const body = rows
      .map((row) => {
        const cells = definition.columns
          .map(([key]) => `<td>${formatCell(key, row[key])}</td>`)
          .join("");
        return `<tr>${cells}</tr>`;
      })
      .join("");

    domLive.tableWrap.innerHTML = `
          <table class="supabase-live-table">
            <thead><tr>${head}</tr></thead>
            <tbody>${body}</tbody>
          </table>
        `;
  }

  async function refreshLiveData() {
    if (!stateLive.open || stateLive.loading) return;
    if (!configReady()) {
      domLive.status.textContent = "Supabase sin configurar";
      domLive.status.classList.add("error");
      domLive.meta.textContent =
        "Coloque la Publishable key en supabase-config.js.";
      return;
    }

    stateLive.loading = true;
    try {
      const definition = tableDefinitions[stateLive.table];

      const [rows, persons, events, movements, metrics, runs] =
        await Promise.all([
          fetchRows(definition, 100),
          fetchCount("personas_simuladas"),
          fetchCount("eventos_simulacion"),
          fetchCount("movimientos_financieros"),
          fetchCount("metricas_simulacion"),
          fetchCount("simulaciones"),
        ]);

      domLive.countPersons.textContent = persons.toLocaleString("es-EC");
      domLive.countEvents.textContent = events.toLocaleString("es-EC");
      domLive.countMovements.textContent = movements.toLocaleString("es-EC");
      domLive.countMetrics.textContent = metrics.toLocaleString("es-EC");
      domLive.countSyncs.textContent = runs.toLocaleString("es-EC");

      renderTable(definition, rows);

      const now = new Intl.DateTimeFormat("es-EC", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date());

      domLive.status.textContent = "Actualización automática";
      domLive.status.classList.remove("error");
      domLive.meta.textContent = `Historial acumulado · ${runs.toLocaleString("es-EC")} ejecuciones · ${rows.length} filas visibles · actualizado ${now}`;
    } catch (error) {
      console.error("Error al consultar Supabase:", error);
      domLive.status.textContent = "Error de lectura";
      domLive.status.classList.add("error");
      domLive.meta.textContent =
        error.message || "No se pudo consultar Supabase.";
    } finally {
      stateLive.loading = false;
    }
  }

  function startPolling() {
    window.clearInterval(stateLive.timer);
    stateLive.timer = window.setInterval(refreshLiveData, POLL_MS);
    void refreshLiveData();
  }

  function stopPolling() {
    window.clearInterval(stateLive.timer);
    stateLive.timer = null;
  }

  function openPanel() {
    stateLive.open = true;
    domLive.overlay.classList.add("open");
    domLive.overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    startPolling();
  }

  function closePanel() {
    stateLive.open = false;
    domLive.overlay.classList.remove("open");
    domLive.overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    stopPolling();
  }

  domLive.button?.addEventListener("click", openPanel);
  domLive.close?.addEventListener("click", closePanel);
  domLive.overlay?.addEventListener("click", (event) => {
    if (event.target === domLive.overlay) closePanel();
  });

  domLive.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      stateLive.table = tab.dataset.liveTable;
      domLive.tabs.forEach((item) =>
        item.classList.toggle("active", item === tab),
      );
      domLive.tableWrap.innerHTML =
        '<div class="supabase-live-empty">Consultando Supabase…</div>';
      void refreshLiveData();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && stateLive.open) closePanel();
  });
})();
