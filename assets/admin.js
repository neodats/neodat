(function () {
  'use strict';

  const config = window.NEODAT_SUPABASE_CONFIG || {};
  const isConfigured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config.url || '')
    && typeof config.anonKey === 'string'
    && config.anonKey.length > 30
    && !config.anonKey.includes('TU_CLAVE');

  const setupAlert = document.getElementById('setupAlert');
  const loginView = document.getElementById('loginView');
  const appView = document.getElementById('appView');
  const loginForm = document.getElementById('loginForm');
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const loginButton = document.getElementById('loginButton');
  const loginMessage = document.getElementById('loginMessage');
  const globalMessage = document.getElementById('globalMessage');
  const dateFrom = document.getElementById('dateFrom');
  const dateTo = document.getElementById('dateTo');
  const refreshButton = document.getElementById('refreshButton');
  const transactionDialog = document.getElementById('transactionDialog');
  const transactionForm = document.getElementById('transactionForm');

  let client = null;
  let currentSession = null;
  let resizeTimer = null;
  let loading = false;

  const state = {
    events: [],
    transactions: [],
    leads: [],
    processed: null
  };

  const viewTitles = {
    overview: 'Resumen ejecutivo',
    analytics: 'Analítica del sitio',
    finance: 'Ingresos y gastos',
    leads: 'Solicitudes recibidas'
  };

  const eventLabels = {
    page_view: 'Página vista',
    whatsapp_click: 'Clic en WhatsApp',
    email_click: 'Clic en correo',
    phone_click: 'Clic en teléfono',
    meeting_click: 'Interés en reunión',
    contact_form: 'Formulario enviado',
    simulator_click: 'Acceso a simulador',
    page_engagement: 'Interacción de página',
    outbound_click: 'Clic externo'
  };

  const chartColors = ['#a77b2f', '#244766', '#16855d', '#7b6aa6', '#c16b44', '#5c87a5'];

  function byId(id) {
    return document.getElementById(id);
  }

  function formatInteger(value) {
    return new Intl.NumberFormat('es-EC', { maximumFractionDigits: 0 }).format(Number(value) || 0);
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value) || 0);
  }

  function formatPercent(value) {
    return new Intl.NumberFormat('es-EC', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(Number(value) || 0) + ' %';
  }

  function localDateIso(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatDateTime(value) {
    if (!value) return '—';
    return new Intl.DateTimeFormat('es-EC', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  function formatDate(value) {
    if (!value) return '—';
    const normalized = value.length === 10 ? `${value}T12:00:00` : value;
    return new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium' }).format(new Date(normalized));
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function safePath(path) {
    const raw = String(path || '/').split('?')[0];
    const clean = raw.replace(/^\/+/, '').replace(/\.html$/i, '') || 'index';
    const names = {
      index: 'Inicio',
      'quienes-somos': 'Quiénes somos',
      servicios: 'Servicios',
      metodo: 'Método',
      ambitos: 'Ámbitos',
      contacto: 'Contacto',
      simuladores: 'Simuladores',
      'simuladores/finanzas': 'Simulador financiero'
    };
    return names[clean] || clean.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function sourceName(referrer) {
    if (!referrer) return 'Directo';
    try {
      const url = new URL(referrer);
      if (url.hostname === window.location.hostname) return 'Navegación interna';
      return url.hostname.replace(/^www\./, '');
    } catch (error) {
      return 'Otro';
    }
  }

  function metadataValue(event, key, fallback) {
    const metadata = event && event.metadata && typeof event.metadata === 'object' ? event.metadata : {};
    const value = metadata[key];
    return value === undefined || value === null || value === '' ? fallback : value;
  }

  function trafficSource(event) {
    return String(metadataValue(event, 'source_name', sourceName(event && event.referrer))).trim() || 'Directo';
  }

  function trafficChannel(event) {
    return String(metadataValue(event, 'source_channel', 'Sin clasificar')).trim() || 'Sin clasificar';
  }

  function formatDecimal(value, digits) {
    return new Intl.NumberFormat('es-EC', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(Number(value) || 0);
  }

  function formatDuration(seconds) {
    const total = Math.max(0, Math.round(Number(seconds) || 0));
    if (total < 60) return `${total} s`;
    const minutes = Math.floor(total / 60);
    const remaining = total % 60;
    if (minutes < 60) return `${minutes} min ${remaining}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours} h ${minutes % 60} min`;
  }

  function countBy(rows, valueGetter) {
    const map = new Map();
    rows.forEach((row) => {
      const key = String(valueGetter(row) || 'Sin identificar').trim() || 'Sin identificar';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, 'es'));
  }

  function setMessage(element, message, success) {
    element.textContent = message || '';
    element.classList.toggle('success', Boolean(success));
  }

  function showGlobalMessage(message, success) {
    globalMessage.textContent = message;
    globalMessage.classList.toggle('success', Boolean(success));
    globalMessage.hidden = false;
    window.setTimeout(() => {
      globalMessage.hidden = true;
    }, 6000);
  }

  function setDefaultDates() {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);
    dateFrom.value = localDateIso(start);
    dateTo.value = localDateIso(end);
    byId('transactionDate').value = localDateIso(end);
  }

  function getRange() {
    const startValue = dateFrom.value;
    const endValue = dateTo.value;
    if (!startValue || !endValue) throw new Error('Seleccione las fechas de consulta.');
    if (startValue > endValue) throw new Error('La fecha inicial no puede ser posterior a la fecha final.');

    const start = new Date(`${startValue}T00:00:00`);
    const endExclusive = new Date(`${endValue}T00:00:00`);
    endExclusive.setDate(endExclusive.getDate() + 1);

    return {
      startValue,
      endValue,
      startIso: start.toISOString(),
      endExclusiveIso: endExclusive.toISOString()
    };
  }

  async function verifyAdmin(session) {
    if (!session || !session.user) return false;
    const { data, error } = await client
      .from('admin_users')
      .select('user_id, display_name')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (error) throw error;
    return Boolean(data && data.user_id);
  }

  async function enterApp(session) {
    const admin = await verifyAdmin(session);
    if (!admin) {
      await client.auth.signOut();
      throw new Error('La cuenta existe, pero no está registrada en la tabla admin_users.');
    }

    currentSession = session;
    loginView.hidden = true;
    appView.hidden = false;
    await loadData();
  }

  async function initialize() {
    setDefaultDates();

    if (!isConfigured || !window.supabase) {
      setupAlert.hidden = false;
      loginButton.disabled = true;
      setMessage(loginMessage, 'La conexión con Supabase aún no está configurada.');
      return;
    }

    client = window.supabase.createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });

    try {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      if (data.session) await enterApp(data.session);
    } catch (error) {
      setMessage(loginMessage, readableError(error));
    }
  }

  function readableError(error) {
    const message = String(error && error.message ? error.message : error || 'Error desconocido');
    if (/invalid login credentials/i.test(message)) return 'Correo o contraseña incorrectos.';
    if (/email not confirmed/i.test(message)) return 'La cuenta todavía no ha confirmado su correo.';
    if (/failed to fetch/i.test(message)) return 'No fue posible conectar con Supabase. Revise la URL, la clave y la conexión.';
    if (/relation .* does not exist/i.test(message)) return 'Faltan tablas en Supabase. Ejecute supabase/neodat-schema.sql.';
    if (/row-level security|permission denied/i.test(message)) return 'La política de seguridad de Supabase rechazó la operación.';
    return message;
  }

  async function handleLogin(event) {
    event.preventDefault();
    if (!client) return;

    loginButton.disabled = true;
    loginButton.textContent = 'Verificando…';
    setMessage(loginMessage, '');

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: loginEmail.value.trim(),
        password: loginPassword.value
      });
      if (error) throw error;
      await enterApp(data.session);
      loginForm.reset();
    } catch (error) {
      setMessage(loginMessage, readableError(error));
    } finally {
      loginButton.disabled = false;
      loginButton.textContent = 'Ingresar al panel';
    }
  }

  async function fetchAll(buildQuery) {
    const pageSize = 1000;
    const rows = [];
    let from = 0;

    while (true) {
      const query = buildQuery().range(from, from + pageSize - 1);
      const { data, error } = await query;
      if (error) throw error;
      rows.push(...(data || []));
      if (!data || data.length < pageSize) break;
      from += pageSize;
      if (from >= 50000) break;
    }

    return rows;
  }

  async function loadData() {
    if (loading || !client || !currentSession) return;
    loading = true;
    refreshButton.disabled = true;
    refreshButton.textContent = '…';

    try {
      const range = getRange();
      const [events, transactions, leads] = await Promise.all([
        fetchAll(() => client
          .from('analytics_events')
          .select('id, created_at, event_type, page_path, page_title, referrer, visitor_id, session_id, device_type, browser, language, screen_width, is_conversion, metadata')
          .gte('created_at', range.startIso)
          .lt('created_at', range.endExclusiveIso)
          .order('created_at', { ascending: false })),
        fetchAll(() => client
          .from('financial_transactions')
          .select('id, created_at, transaction_date, transaction_type, category, description, amount, source, created_by')
          .gte('transaction_date', range.startValue)
          .lte('transaction_date', range.endValue)
          .order('transaction_date', { ascending: false })),
        fetchAll(() => client
          .from('contact_leads')
          .select('id, created_at, name, company, email, phone, city, priority, services, message, page_path, status, notes')
          .gte('created_at', range.startIso)
          .lt('created_at', range.endExclusiveIso)
          .order('created_at', { ascending: false }))
      ]);

      state.events = events;
      state.transactions = transactions;
      state.leads = leads;
      state.processed = processData(range);
      renderAll();
    } catch (error) {
      showGlobalMessage(readableError(error), false);
    } finally {
      loading = false;
      refreshButton.disabled = false;
      refreshButton.textContent = '↻';
    }
  }

  function processData(range) {
    const pageViews = state.events.filter((event) => event.event_type === 'page_view');
    const engagementEvents = state.events.filter((event) => event.event_type === 'page_engagement');
    const conversions = state.events.filter((event) => event.is_conversion || ['contact_form', 'whatsapp_click', 'email_click', 'phone_click', 'meeting_click'].includes(event.event_type));
    const uniqueVisitorsSet = new Set(pageViews.map((event) => event.visitor_id).filter(Boolean));
    const sessionsSet = new Set(pageViews.map((event) => event.session_id).filter(Boolean));

    const income = state.transactions
      .filter((row) => row.transaction_type === 'Ingreso')
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const expense = state.transactions
      .filter((row) => row.transaction_type === 'Gasto')
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);

    const dailyMap = new Map();
    const cursor = new Date(`${range.startValue}T12:00:00`);
    const final = new Date(`${range.endValue}T12:00:00`);
    while (cursor <= final) {
      const key = localDateIso(cursor);
      dailyMap.set(key, 0);
      cursor.setDate(cursor.getDate() + 1);
    }
    pageViews.forEach((event) => {
      const key = localDateIso(new Date(event.created_at));
      if (dailyMap.has(key)) dailyMap.set(key, dailyMap.get(key) + 1);
    });

    const pageMap = new Map();
    pageViews.forEach((event) => {
      const key = event.page_path || '/';
      if (!pageMap.has(key)) pageMap.set(key, { path: key, visits: 0, users: new Set() });
      const page = pageMap.get(key);
      page.visits += 1;
      if (event.visitor_id) page.users.add(event.visitor_id);
    });
    const pages = Array.from(pageMap.values())
      .map((row) => ({ path: row.path, visits: row.visits, users: row.users.size }))
      .sort((a, b) => b.visits - a.visits);

    const conversionMap = new Map();
    conversions.forEach((event) => conversionMap.set(event.event_type, (conversionMap.get(event.event_type) || 0) + 1));
    const conversionBreakdown = Array.from(conversionMap.entries())
      .map(([type, count]) => ({ type, label: eventLabels[type] || type, count }))
      .sort((a, b) => b.count - a.count);

    const devices = countBy(pageViews, (event) => event.device_type || 'Sin identificar');
    const sources = countBy(pageViews, (event) => trafficSource(event));
    const channels = countBy(pageViews, (event) => trafficChannel(event));
    const browsers = countBy(pageViews, (event) => event.browser || 'Sin identificar');
    const operatingSystems = countBy(pageViews, (event) => metadataValue(event, 'os', 'Sin identificar'));
    const timezones = countBy(pageViews, (event) => metadataValue(event, 'timezone', 'Sin identificar'));
    const languages = countBy(pageViews, (event) => event.language || 'Sin identificar');
    const campaigns = countBy(
      pageViews.filter((event) => metadataValue(event, 'utm_campaign', '')),
      (event) => metadataValue(event, 'utm_campaign', 'Sin campaña')
    );

    const sessionMap = new Map();
    pageViews.forEach((event) => {
      const key = event.session_id || `sin_sesion_${event.id}`;
      if (!sessionMap.has(key)) {
        sessionMap.set(key, {
          id: key,
          visitorId: event.visitor_id || '',
          startedAt: event.created_at,
          lastAt: event.created_at,
          landingPage: metadataValue(event, 'landing_page', event.page_path || '/'),
          source: trafficSource(event),
          channel: trafficChannel(event),
          device: event.device_type || 'Sin identificar',
          browser: event.browser || 'Sin identificar',
          os: metadataValue(event, 'os', 'Sin identificar'),
          timezone: metadataValue(event, 'timezone', 'Sin identificar'),
          visitorStatus: metadataValue(event, 'visitor_status', 'Sin identificar'),
          pageViews: 0,
          activeSeconds: 0,
          maxScroll: 0,
          clicks: 0,
          conversions: 0
        });
      }
      const row = sessionMap.get(key);
      row.pageViews += 1;
      if (new Date(event.created_at) < new Date(row.startedAt)) row.startedAt = event.created_at;
      if (new Date(event.created_at) > new Date(row.lastAt)) row.lastAt = event.created_at;
    });

    engagementEvents.forEach((event) => {
      const row = sessionMap.get(event.session_id);
      if (!row) return;
      row.activeSeconds += Number(metadataValue(event, 'active_seconds', 0)) || 0;
      row.maxScroll = Math.max(row.maxScroll, Number(metadataValue(event, 'max_scroll_percent', 0)) || 0);
      row.clicks += Number(metadataValue(event, 'click_count', 0)) || 0;
      if (new Date(event.created_at) > new Date(row.lastAt)) row.lastAt = event.created_at;
    });

    conversions.forEach((event) => {
      const row = sessionMap.get(event.session_id);
      if (row) row.conversions += 1;
    });

    const sessions = Array.from(sessionMap.values()).sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
    const totalActiveSeconds = sessions.reduce((sum, row) => sum + row.activeSeconds, 0);
    const engagedSessions = sessions.filter((row) => row.activeSeconds >= 10 || row.pageViews >= 2 || row.conversions > 0 || row.maxScroll >= 50).length;
    const bouncedSessions = sessions.filter((row) => row.pageViews <= 1 && row.activeSeconds < 10 && row.conversions === 0 && row.maxScroll < 50).length;

    const returningVisitorsSet = new Set(
      pageViews
        .filter((event) => metadataValue(event, 'visitor_status', '') === 'Recurrente')
        .map((event) => event.visitor_id)
        .filter(Boolean)
    );
    const newVisitors = Math.max(0, uniqueVisitorsSet.size - returningVisitorsSet.size);

    return {
      range,
      pageViews,
      engagementEvents,
      conversions,
      uniqueVisitors: uniqueVisitorsSet.size,
      newVisitors,
      returningVisitors: returningVisitorsSet.size,
      sessionsCount: sessionsSet.size,
      sessions,
      totalActiveSeconds,
      avgActiveSeconds: sessions.length ? totalActiveSeconds / sessions.length : 0,
      pagesPerSession: sessions.length ? pageViews.length / sessions.length : 0,
      engagementRate: sessions.length ? (engagedSessions / sessions.length) * 100 : 0,
      bounceRate: sessions.length ? (bouncedSessions / sessions.length) * 100 : 0,
      income,
      expense,
      net: income - expense,
      daily: Array.from(dailyMap.entries()).map(([date, value]) => ({ date, value })),
      pages,
      conversionBreakdown,
      devices,
      sources,
      channels,
      browsers,
      operatingSystems,
      timezones,
      languages,
      campaigns
    };
  }

  function renderAll() {
    renderMetrics();
    renderRankings();
    renderTables();
    renderFinance();
    renderLeads();
    renderCharts();
  }

  function renderMetrics() {
    const data = state.processed;
    const conversionRate = data.uniqueVisitors ? (data.conversions.length / data.uniqueVisitors) * 100 : 0;

    byId('metricVisits').textContent = formatInteger(data.pageViews.length);
    byId('metricVisitsNote').textContent = `${formatInteger(data.sessionsCount)} sesiones registradas`;
    byId('metricUsers').textContent = formatInteger(data.uniqueVisitors);
    byId('metricUsersNote').textContent = `${formatInteger(data.newVisitors)} nuevos · ${formatInteger(data.returningVisitors)} recurrentes`;
    byId('metricConversions').textContent = formatInteger(data.conversions.length);
    byId('metricConversionsNote').textContent = `${formatPercent(conversionRate)} de conversión`;
    byId('metricRevenue').textContent = formatCurrency(data.income);
    byId('metricRevenueNote').textContent = `Neto: ${formatCurrency(data.net)}`;
    byId('metricSessions').textContent = formatInteger(data.sessionsCount);
    byId('metricSessionsNote').textContent = `${formatPercent(data.bounceRate)} de rebote estimado`;
    byId('metricPagesPerSession').textContent = formatDecimal(data.pagesPerSession, 1);
    byId('metricPagesPerSessionNote').textContent = 'Páginas vistas por sesión';
    byId('metricActiveTime').textContent = formatDuration(data.avgActiveSeconds);
    byId('metricActiveTimeNote').textContent = 'Tiempo activo medio por sesión';
    byId('metricEngagement').textContent = formatPercent(data.engagementRate);
    byId('metricEngagementNote').textContent = 'Sesiones con interacción relevante';
    byId('trendTotal').textContent = `${formatInteger(data.pageViews.length)} visitas`;
    byId('deviceTotal').textContent = formatInteger(data.pageViews.length);
  }

  function rankRows(rows, labelKey, valueKey, maxRows) {
    if (!rows.length) return '<div class="empty-state">Sin datos en el periodo seleccionado.</div>';
    const displayed = rows.slice(0, maxRows || 6);
    const max = Math.max(...displayed.map((row) => Number(row[valueKey]) || 0), 1);
    return displayed.map((row) => `
      <div class="rank-row">
        <strong title="${escapeHtml(row[labelKey])}">${escapeHtml(row[labelKey])}</strong>
        <span>${formatInteger(row[valueKey])}</span>
        <div class="rank-track"><div class="rank-fill" style="width:${Math.max(4, (Number(row[valueKey]) / max) * 100)}%"></div></div>
      </div>
    `).join('');
  }

  function renderRankings() {
    const data = state.processed;
    byId('conversionList').innerHTML = rankRows(data.conversionBreakdown, 'label', 'count', 6);
    byId('sourceList').innerHTML = rankRows(data.sources, 'name', 'value', 8);
    byId('channelList').innerHTML = rankRows(data.channels, 'name', 'value', 8);
    byId('campaignList').innerHTML = rankRows(data.campaigns, 'name', 'value', 8);
    byId('browserList').innerHTML = rankRows(data.browsers, 'name', 'value', 8);
    byId('osList').innerHTML = rankRows(data.operatingSystems, 'name', 'value', 8);
    byId('timezoneList').innerHTML = rankRows(data.timezones, 'name', 'value', 8);
    byId('languageList').innerHTML = rankRows(data.languages, 'name', 'value', 8);

    const total = Math.max(data.devices.reduce((sum, row) => sum + row.value, 0), 1);
    byId('deviceLegend').innerHTML = data.devices.length
      ? data.devices.map((row, index) => `
          <div class="legend-row">
            <i class="legend-dot" style="background:${chartColors[index % chartColors.length]}"></i>
            <span>${escapeHtml(row.name)}</span>
            <strong>${formatPercent((row.value / total) * 100)}</strong>
          </div>
        `).join('')
      : '<div class="empty-state">Sin datos.</div>';
  }

  function emptyRow(columns, message) {
    return `<tr><td colspan="${columns}"><div class="empty-state">${escapeHtml(message)}</div></td></tr>`;
  }

  function eventDetail(event) {
    if (event.event_type === 'page_engagement') {
      return `${formatDuration(metadataValue(event, 'active_seconds', 0))} · ${formatInteger(metadataValue(event, 'max_scroll_percent', 0))}% scroll · ${formatInteger(metadataValue(event, 'click_count', 0))} clics`;
    }
    if (event.event_type === 'page_view') {
      const viewport = `${formatInteger(metadataValue(event, 'viewport_width', 0))}×${formatInteger(metadataValue(event, 'viewport_height', 0))}`;
      const connection = metadataValue(event, 'connection', '');
      return connection ? `${viewport} · red ${connection}` : viewport;
    }
    const label = metadataValue(event, 'label', '');
    const campaign = metadataValue(event, 'utm_campaign', '');
    if (label && campaign) return `${label} · ${campaign}`;
    return label || campaign || '—';
  }

  function renderTables() {
    const data = state.processed;
    byId('topPagesBody').innerHTML = data.pages.length
      ? data.pages.slice(0, 8).map((row) => `
          <tr>
            <td><span class="table-title">${escapeHtml(safePath(row.path))}</span><span class="table-subtitle">${escapeHtml(row.path)}</span></td>
            <td>${formatInteger(row.visits)}</td>
            <td>${formatInteger(row.users)}</td>
          </tr>
        `).join('')
      : emptyRow(3, 'No existen páginas vistas en este periodo.');

    byId('sessionsCount').textContent = `${formatInteger(data.sessions.length)} sesiones`;
    byId('sessionsBody').innerHTML = data.sessions.length
      ? data.sessions.slice(0, 200).map((session) => `
          <tr>
            <td>${escapeHtml(formatDateTime(session.startedAt))}</td>
            <td><span class="table-title">${escapeHtml(session.visitorStatus)}</span><span class="table-subtitle">${escapeHtml(session.visitorId.slice(0, 22))}</span></td>
            <td><span class="table-title">${escapeHtml(safePath(session.landingPage))}</span><span class="table-subtitle">${escapeHtml(session.landingPage)}</span></td>
            <td><span class="table-title">${escapeHtml(session.source)}</span><span class="table-subtitle">${escapeHtml(session.channel)}</span></td>
            <td>${formatInteger(session.pageViews)}</td>
            <td>${escapeHtml(formatDuration(session.activeSeconds))}</td>
            <td>${formatInteger(session.maxScroll)} %</td>
            <td>${session.conversions ? `<span class="type-badge income">${formatInteger(session.conversions)}</span>` : '—'}</td>
          </tr>
        `).join('')
      : emptyRow(8, 'No existen sesiones en el periodo seleccionado.');

    byId('eventsCount').textContent = `${formatInteger(state.events.length)} eventos`;
    byId('eventsBody').innerHTML = state.events.length
      ? state.events.slice(0, 250).map((event) => `
          <tr>
            <td>${escapeHtml(formatDateTime(event.created_at))}</td>
            <td><span class="status-badge">${escapeHtml(eventLabels[event.event_type] || event.event_type)}</span></td>
            <td><span class="table-title">${escapeHtml(safePath(event.page_path))}</span><span class="table-subtitle">${escapeHtml(event.page_path || '/')}</span></td>
            <td>${escapeHtml(event.device_type || '—')}</td>
            <td><span class="table-title">${escapeHtml(event.browser || '—')}</span><span class="table-subtitle">${escapeHtml(metadataValue(event, 'os', '—'))}</span></td>
            <td><span class="table-title">${escapeHtml(trafficSource(event))}</span><span class="table-subtitle">${escapeHtml(trafficChannel(event))}</span></td>
            <td>${escapeHtml(metadataValue(event, 'timezone', '—'))}</td>
            <td><span class="table-subtitle detail-cell" title="${escapeHtml(eventDetail(event))}">${escapeHtml(eventDetail(event))}</span></td>
          </tr>
        `).join('')
      : emptyRow(8, 'No existen eventos en el periodo seleccionado.');
  }

  function renderFinance() {
    const data = state.processed;
    byId('financeIncome').textContent = formatCurrency(data.income);
    byId('financeExpense').textContent = formatCurrency(data.expense);
    byId('financeNet').textContent = formatCurrency(data.net);
    byId('financeCount').textContent = formatInteger(state.transactions.length);

    byId('transactionsBody').innerHTML = state.transactions.length
      ? state.transactions.map((row) => `
          <tr>
            <td>${escapeHtml(formatDate(row.transaction_date))}</td>
            <td><span class="type-badge ${row.transaction_type === 'Ingreso' ? 'income' : 'expense'}">${escapeHtml(row.transaction_type)}</span></td>
            <td>${escapeHtml(row.category)}</td>
            <td><span class="table-title">${escapeHtml(row.description || '—')}</span></td>
            <td>${escapeHtml(row.source || '—')}</td>
            <td class="number-cell"><strong>${escapeHtml(formatCurrency(row.amount))}</strong></td>
            <td><button class="delete-button" type="button" data-delete-transaction="${escapeHtml(row.id)}" aria-label="Eliminar movimiento">×</button></td>
          </tr>
        `).join('')
      : emptyRow(7, 'No existen movimientos financieros en este periodo.');
  }

  function renderLeads() {
    const leads = state.leads;
    byId('leadTotal').textContent = formatInteger(leads.length);
    byId('leadNew').textContent = formatInteger(leads.filter((lead) => lead.status === 'Nuevo').length);
    byId('leadProgress').textContent = formatInteger(leads.filter((lead) => ['Contactado', 'En proceso'].includes(lead.status)).length);
    byId('leadClosed').textContent = formatInteger(leads.filter((lead) => lead.status === 'Cerrado').length);

    const statuses = ['Nuevo', 'Contactado', 'En proceso', 'Cerrado', 'Descartado'];
    byId('leadsBody').innerHTML = leads.length
      ? leads.map((lead) => `
          <tr>
            <td>${escapeHtml(formatDateTime(lead.created_at))}</td>
            <td><span class="table-title">${escapeHtml(lead.name)}</span><span class="table-subtitle">${escapeHtml(lead.company || lead.city || 'Sin empresa')}</span></td>
            <td><span class="table-title">${escapeHtml(lead.email)}</span><span class="table-subtitle">${escapeHtml(lead.phone || 'Sin teléfono')}</span></td>
            <td><span class="table-title">${escapeHtml((lead.services || []).join(', ') || 'No especificado')}</span><span class="table-subtitle" title="${escapeHtml(lead.message)}">${escapeHtml(lead.message)}</span></td>
            <td>${escapeHtml(lead.priority || 'Consulta general')}</td>
            <td>
              <select class="status-select" data-lead-status="${escapeHtml(lead.id)}" aria-label="Estado de ${escapeHtml(lead.name)}">
                ${statuses.map((status) => `<option value="${status}" ${status === lead.status ? 'selected' : ''}>${status}</option>`).join('')}
              </select>
            </td>
          </tr>
        `).join('')
      : emptyRow(6, 'No existen solicitudes en este periodo.');
  }

  function prepareCanvas(canvas, cssHeight) {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(280, Math.floor(rect.width || canvas.parentElement.clientWidth || 600));
    const height = cssHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.height = `${height}px`;
    const context = canvas.getContext('2d');
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    return { context, width, height };
  }

  function drawLineChart(canvas, rows) {
    const empty = byId('visitsEmpty');
    const hasData = rows.some((row) => row.value > 0);
    empty.hidden = hasData;
    if (!hasData) {
      const { context, width, height } = prepareCanvas(canvas, 290);
      context.clearRect(0, 0, width, height);
      return;
    }

    const { context: ctx, width, height } = prepareCanvas(canvas, 290);
    const padding = { top: 18, right: 14, bottom: 40, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const maxValue = Math.max(...rows.map((row) => row.value), 1);
    const gridMax = Math.ceil(maxValue / 5) * 5 || 5;

    ctx.font = '10px Inter, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#e7ecf1';
    ctx.fillStyle = '#7b8795';
    ctx.lineWidth = 1;

    for (let index = 0; index <= 4; index += 1) {
      const y = padding.top + (chartHeight / 4) * index;
      const label = Math.round(gridMax - (gridMax / 4) * index);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      ctx.fillText(String(label), 5, y);
    }

    const points = rows.map((row, index) => {
      const x = rows.length === 1 ? padding.left + chartWidth / 2 : padding.left + (index / (rows.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - (row.value / gridMax) * chartHeight;
      return { x, y, row };
    });

    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, 'rgba(167,123,47,.30)');
    gradient.addColorStop(1, 'rgba(167,123,47,.02)');
    ctx.beginPath();
    ctx.moveTo(points[0].x, height - padding.bottom);
    points.forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.strokeStyle = '#a77b2f';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.fillStyle = '#a77b2f';
    points.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    const maxLabels = width < 500 ? 5 : 8;
    const labelStep = Math.max(1, Math.ceil(rows.length / maxLabels));
    ctx.fillStyle = '#7b8795';
    ctx.textAlign = 'center';
    rows.forEach((row, index) => {
      if (index % labelStep !== 0 && index !== rows.length - 1) return;
      const date = new Date(`${row.date}T12:00:00`);
      const label = new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'short' }).format(date).replace('.', '');
      ctx.fillText(label, points[index].x, height - 16);
    });
  }

  function drawBarChart(canvas, rows) {
    const empty = byId('pagesEmpty');
    const data = rows.slice(0, 8);
    const hasData = data.some((row) => row.visits > 0);
    empty.hidden = hasData;
    if (!hasData) {
      const { context, width, height } = prepareCanvas(canvas, 330);
      context.clearRect(0, 0, width, height);
      return;
    }

    const { context: ctx, width, height } = prepareCanvas(canvas, 330);
    const left = Math.min(150, Math.max(92, width * .25));
    const right = 36;
    const top = 10;
    const bottom = 18;
    const available = width - left - right;
    const rowHeight = (height - top - bottom) / data.length;
    const max = Math.max(...data.map((row) => row.visits), 1);

    ctx.font = '10.5px Inter, sans-serif';
    ctx.textBaseline = 'middle';

    data.forEach((row, index) => {
      const y = top + index * rowHeight + rowHeight / 2;
      const barHeight = Math.min(19, rowHeight * .48);
      const barWidth = (row.visits / max) * available;
      ctx.fillStyle = '#6f7d8d';
      ctx.textAlign = 'right';
      const label = safePath(row.path);
      ctx.fillText(label.length > 21 ? `${label.slice(0, 20)}…` : label, left - 12, y);

      ctx.fillStyle = '#edf1f5';
      roundRect(ctx, left, y - barHeight / 2, available, barHeight, 6);
      ctx.fill();

      ctx.fillStyle = index === 0 ? '#a77b2f' : '#244766';
      roundRect(ctx, left, y - barHeight / 2, Math.max(4, barWidth), barHeight, 6);
      ctx.fill();

      ctx.fillStyle = '#172638';
      ctx.textAlign = 'left';
      ctx.fillText(formatInteger(row.visits), Math.min(width - 26, left + barWidth + 7), y);
    });
  }

  function roundRect(ctx, x, y, width, height, radius) {
    const safeRadius = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + safeRadius, y);
    ctx.arcTo(x + width, y, x + width, y + height, safeRadius);
    ctx.arcTo(x + width, y + height, x, y + height, safeRadius);
    ctx.arcTo(x, y + height, x, y, safeRadius);
    ctx.arcTo(x, y, x + width, y, safeRadius);
    ctx.closePath();
  }

  function drawDonut(canvas, rows) {
    const { context: ctx, width, height } = prepareCanvas(canvas, 160);
    const total = rows.reduce((sum, row) => sum + row.value, 0);
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * .39;
    const lineWidth = 18;

    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'butt';

    if (!total) {
      ctx.strokeStyle = '#edf1f5';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }

    let start = -Math.PI / 2;
    rows.forEach((row, index) => {
      const angle = (row.value / total) * Math.PI * 2;
      ctx.strokeStyle = chartColors[index % chartColors.length];
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, start, start + angle - .025);
      ctx.stroke();
      start += angle;
    });
  }

  function renderCharts() {
    if (!state.processed) return;
    drawLineChart(byId('visitsChart'), state.processed.daily);
    drawBarChart(byId('pagesChart'), state.processed.pages);
    drawDonut(byId('deviceChart'), state.processed.devices);
  }

  function switchView(view) {
    document.querySelectorAll('.view-section').forEach((section) => section.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.view === view));
    const section = byId(`view-${view}`);
    if (section) section.classList.add('active');
    byId('viewTitle').textContent = viewTitles[view] || 'Administración';
    document.querySelector('.sidebar').classList.remove('open');
    window.setTimeout(renderCharts, 30);
  }

  async function saveTransaction(event) {
    event.preventDefault();
    const button = byId('saveTransactionButton');
    button.disabled = true;
    button.textContent = 'Guardando…';
    setMessage(byId('transactionMessage'), '');

    try {
      const payload = {
        transaction_date: byId('transactionDate').value,
        transaction_type: byId('transactionType').value,
        category: byId('transactionCategory').value.trim(),
        description: byId('transactionDescription').value.trim() || null,
        amount: Number(byId('transactionAmount').value),
        source: byId('transactionSource').value.trim() || null,
        created_by: currentSession.user.id
      };
      const { error } = await client.from('financial_transactions').insert(payload);
      if (error) throw error;
      transactionDialog.close();
      transactionForm.reset();
      byId('transactionDate').value = localDateIso(new Date());
      byId('transactionType').value = 'Ingreso';
      showGlobalMessage('Movimiento guardado correctamente en Supabase.', true);
      await loadData();
    } catch (error) {
      setMessage(byId('transactionMessage'), readableError(error));
    } finally {
      button.disabled = false;
      button.textContent = 'Guardar en Supabase';
    }
  }

  async function deleteTransaction(id) {
    if (!window.confirm('¿Desea eliminar este movimiento financiero?')) return;
    try {
      const { error } = await client.from('financial_transactions').delete().eq('id', id);
      if (error) throw error;
      showGlobalMessage('Movimiento eliminado.', true);
      await loadData();
    } catch (error) {
      showGlobalMessage(readableError(error), false);
    }
  }

  async function updateLeadStatus(id, status, select) {
    select.disabled = true;
    try {
      const { error } = await client.from('contact_leads').update({ status }).eq('id', id);
      if (error) throw error;
      const lead = state.leads.find((row) => row.id === id);
      if (lead) lead.status = status;
      renderLeads();
      showGlobalMessage('Estado actualizado en Supabase.', true);
    } catch (error) {
      showGlobalMessage(readableError(error), false);
      await loadData();
    } finally {
      select.disabled = false;
    }
  }

  function csvCell(value) {
    const text = Array.isArray(value) ? value.join(' | ') : String(value ?? '');
    return `"${text.replaceAll('"', '""')}"`;
  }

  function downloadCsv(filename, headers, rows) {
    const content = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function exportAnalytics() {
    downloadCsv(
      `neodat-analitica-${dateFrom.value}-${dateTo.value}.csv`,
      ['Fecha', 'Evento', 'Página', 'Título', 'Visitante', 'Sesión', 'Dispositivo', 'Navegador', 'Sistema operativo', 'Plataforma', 'Idioma', 'Zona horaria', 'Conexión', 'Viewport', 'Pantalla', 'Canal', 'Fuente', 'UTM source', 'UTM medium', 'UTM campaign', 'UTM content', 'UTM term', 'Landing page', 'Estado visitante', 'Tiempo activo', 'Scroll máximo', 'Clics', 'Conversión'],
      state.events.map((row) => [
        row.created_at,
        eventLabels[row.event_type] || row.event_type,
        row.page_path,
        row.page_title,
        row.visitor_id,
        row.session_id,
        row.device_type,
        row.browser,
        metadataValue(row, 'os', ''),
        metadataValue(row, 'platform', ''),
        row.language,
        metadataValue(row, 'timezone', ''),
        metadataValue(row, 'connection', ''),
        `${metadataValue(row, 'viewport_width', '')}x${metadataValue(row, 'viewport_height', '')}`,
        `${metadataValue(row, 'screen_width', row.screen_width || '')}x${metadataValue(row, 'screen_height', '')}`,
        trafficChannel(row),
        trafficSource(row),
        metadataValue(row, 'utm_source', ''),
        metadataValue(row, 'utm_medium', ''),
        metadataValue(row, 'utm_campaign', ''),
        metadataValue(row, 'utm_content', ''),
        metadataValue(row, 'utm_term', ''),
        metadataValue(row, 'landing_page', ''),
        metadataValue(row, 'visitor_status', ''),
        metadataValue(row, 'active_seconds', ''),
        metadataValue(row, 'max_scroll_percent', ''),
        metadataValue(row, 'click_count', ''),
        row.is_conversion ? 'Sí' : 'No'
      ])
    );
  }

  function exportFinance() {
    downloadCsv(
      `neodat-finanzas-${dateFrom.value}-${dateTo.value}.csv`,
      ['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Fuente', 'Valor USD'],
      state.transactions.map((row) => [row.transaction_date, row.transaction_type, row.category, row.description, row.source, row.amount])
    );
  }

  function exportLeads() {
    downloadCsv(
      `neodat-solicitudes-${dateFrom.value}-${dateTo.value}.csv`,
      ['Fecha', 'Nombre', 'Empresa', 'Correo', 'Teléfono', 'Ciudad', 'Prioridad', 'Servicios', 'Mensaje', 'Estado'],
      state.leads.map((row) => [row.created_at, row.name, row.company, row.email, row.phone, row.city, row.priority, row.services, row.message, row.status])
    );
  }

  loginForm.addEventListener('submit', handleLogin);
  byId('logoutButton').addEventListener('click', async () => {
    if (client) await client.auth.signOut();
    currentSession = null;
    appView.hidden = true;
    loginView.hidden = false;
    setMessage(loginMessage, 'Sesión cerrada correctamente.', true);
  });
  byId('applyFilterButton').addEventListener('click', loadData);
  refreshButton.addEventListener('click', loadData);
  byId('newTransactionButton').addEventListener('click', () => transactionDialog.showModal());
  byId('closeTransactionDialog').addEventListener('click', () => transactionDialog.close());
  byId('cancelTransactionButton').addEventListener('click', () => transactionDialog.close());
  transactionForm.addEventListener('submit', saveTransaction);
  byId('exportAnalyticsButton').addEventListener('click', exportAnalytics);
  byId('exportFinanceButton').addEventListener('click', exportFinance);
  byId('exportLeadsButton').addEventListener('click', exportLeads);
  byId('mobileMenuButton').addEventListener('click', () => document.querySelector('.sidebar').classList.toggle('open'));

  document.addEventListener('click', (event) => {
    const viewButton = event.target.closest('[data-view]');
    if (viewButton) switchView(viewButton.dataset.view);

    const goButton = event.target.closest('[data-go-view]');
    if (goButton) switchView(goButton.dataset.goView);

    const deleteButton = event.target.closest('[data-delete-transaction]');
    if (deleteButton) deleteTransaction(deleteButton.dataset.deleteTransaction);
  });

  document.addEventListener('change', (event) => {
    const select = event.target.closest('[data-lead-status]');
    if (select) updateLeadStatus(select.dataset.leadStatus, select.value, select);
  });

  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(renderCharts, 160);
  });

  initialize();
})();
