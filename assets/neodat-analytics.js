(function () {
  'use strict';

  const config = window.NEODAT_SUPABASE_CONFIG || {};
  const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config.url || '')
    && typeof config.anonKey === 'string'
    && config.anonKey.length > 30
    && !config.anonKey.includes('TU_CLAVE');

  const conversionEvents = new Set([
    'contact_form',
    'whatsapp_click',
    'email_click',
    'phone_click',
    'meeting_click'
  ]);

  function randomId(prefix) {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return `${prefix}_${window.crypto.randomUUID()}`;
    }
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  }

  function storageGet(storage, key) {
    try {
      return storage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function storageSet(storage, key, value) {
    try {
      storage.setItem(key, value);
      return true;
    } catch (error) {
      return false;
    }
  }

  function persistentId(storage, key, prefix) {
    let value = storageGet(storage, key);
    if (!value) {
      value = randomId(prefix);
      storageSet(storage, key, value);
    }
    return value;
  }

  const visitorKey = 'neodat_visitor_id';
  const visitorFirstSeenKey = 'neodat_visitor_first_seen';
  const sessionKey = 'neodat_session_id';
  const sessionStartedKey = 'neodat_session_started_at';
  const sessionLandingKey = 'neodat_session_landing_page';
  const sessionAttributionKey = 'neodat_session_attribution';
  const sessionVisitorStatusKey = 'neodat_session_visitor_status';

  const existingVisitor = Boolean(storageGet(window.localStorage, visitorKey));
  const visitorId = persistentId(window.localStorage, visitorKey, 'visitor');
  const sessionId = persistentId(window.sessionStorage, sessionKey, 'session');

  const firstSeen = storageGet(window.localStorage, visitorFirstSeenKey) || new Date().toISOString();
  storageSet(window.localStorage, visitorFirstSeenKey, firstSeen);

  const sessionVisitorStatus = storageGet(window.sessionStorage, sessionVisitorStatusKey)
    || (existingVisitor ? 'Recurrente' : 'Nuevo');
  storageSet(window.sessionStorage, sessionVisitorStatusKey, sessionVisitorStatus);

  const sessionStartedAt = storageGet(window.sessionStorage, sessionStartedKey) || new Date().toISOString();
  storageSet(window.sessionStorage, sessionStartedKey, sessionStartedAt);

  const landingPage = storageGet(window.sessionStorage, sessionLandingKey)
    || `${window.location.pathname}${window.location.search}`;
  storageSet(window.sessionStorage, sessionLandingKey, landingPage);

  function deviceType() {
    const width = window.innerWidth || document.documentElement.clientWidth || 0;
    if (width <= 767) return 'Móvil';
    if (width <= 1100) return 'Tablet';
    return 'Escritorio';
  }

  function browserName() {
    const agent = navigator.userAgent || '';
    if (/Edg\//.test(agent)) return 'Edge';
    if (/OPR\//.test(agent)) return 'Opera';
    if (/Chrome\//.test(agent)) return 'Chrome';
    if (/Safari\//.test(agent) && !/Chrome\//.test(agent)) return 'Safari';
    if (/Firefox\//.test(agent)) return 'Firefox';
    return 'Otro';
  }

  function osName() {
    const agent = navigator.userAgent || '';
    const platform = navigator.userAgentData && navigator.userAgentData.platform
      ? navigator.userAgentData.platform
      : navigator.platform || '';
    if (/Android/i.test(agent)) return 'Android';
    if (/iPhone|iPad|iPod/i.test(agent)) return 'iOS / iPadOS';
    if (/Windows/i.test(platform) || /Windows NT/i.test(agent)) return 'Windows';
    if (/Mac/i.test(platform) || /Mac OS X/i.test(agent)) return 'macOS';
    if (/Linux/i.test(platform) || /Linux/i.test(agent)) return 'Linux';
    return 'Otro';
  }

  function timezoneName() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Sin identificar';
    } catch (error) {
      return 'Sin identificar';
    }
  }

  function connectionType() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!connection) return '';
    return String(connection.effectiveType || connection.type || '').slice(0, 40);
  }

  function hostnameFromUrl(value) {
    if (!value) return '';
    try {
      return new URL(value, window.location.origin).hostname.replace(/^www\./i, '').toLowerCase();
    } catch (error) {
      return '';
    }
  }

  function currentCampaign() {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: (params.get('utm_source') || '').slice(0, 150),
      utm_medium: (params.get('utm_medium') || '').slice(0, 150),
      utm_campaign: (params.get('utm_campaign') || '').slice(0, 180),
      utm_content: (params.get('utm_content') || '').slice(0, 180),
      utm_term: (params.get('utm_term') || '').slice(0, 180)
    };
  }

  function classifyTraffic(referrer, campaign) {
    const refHost = hostnameFromUrl(referrer);
    const currentHost = window.location.hostname.replace(/^www\./i, '').toLowerCase();
    const source = (campaign.utm_source || '').toLowerCase();
    const medium = (campaign.utm_medium || '').toLowerCase();

    if (campaign.utm_source || campaign.utm_medium || campaign.utm_campaign) {
      if (/cpc|ppc|paid|ads|display/.test(medium)) return { channel: 'Campaña pagada', source: campaign.utm_source || 'Campaña' };
      if (/email|newsletter/.test(medium)) return { channel: 'Email', source: campaign.utm_source || 'Email' };
      if (/social/.test(medium) || /facebook|instagram|linkedin|tiktok|x|twitter/.test(source)) return { channel: 'Redes sociales', source: campaign.utm_source || 'Social' };
      return { channel: 'Campaña', source: campaign.utm_source || campaign.utm_medium || 'Campaña' };
    }

    if (!refHost) return { channel: 'Directo', source: 'Directo' };
    if (refHost === currentHost) return { channel: 'Navegación interna', source: 'NeoDat' };
    if (/google\.|bing\.|yahoo\.|duckduckgo\.|ecosia\./.test(refHost)) return { channel: 'Búsqueda orgánica', source: refHost };
    if (/facebook\.|instagram\.|linkedin\.|tiktok\.|twitter\.|x\.com$|youtube\./.test(refHost)) return { channel: 'Redes sociales', source: refHost };
    return { channel: 'Referido', source: refHost };
  }

  function buildSessionAttribution() {
    const campaign = currentCampaign();
    const traffic = classifyTraffic(document.referrer, campaign);
    return {
      entry_referrer: (document.referrer || '').slice(0, 1000),
      referrer_domain: hostnameFromUrl(document.referrer),
      source_channel: traffic.channel,
      source_name: traffic.source,
      ...campaign
    };
  }

  let sessionAttribution;
  try {
    sessionAttribution = JSON.parse(storageGet(window.sessionStorage, sessionAttributionKey) || 'null');
  } catch (error) {
    sessionAttribution = null;
  }
  if (!sessionAttribution || typeof sessionAttribution !== 'object') {
    sessionAttribution = buildSessionAttribution();
    storageSet(window.sessionStorage, sessionAttributionKey, JSON.stringify(sessionAttribution));
  }

  function sanitizeMetadata(metadata) {
    const safe = {};
    if (!metadata || typeof metadata !== 'object') return safe;
    Object.entries(metadata).forEach(([key, value]) => {
      if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
        safe[String(key).slice(0, 80)] = typeof value === 'string' ? value.slice(0, 1000) : value;
      }
    });
    return safe;
  }

  async function restInsert(table, payload, keepalive) {
    if (!configured) return { ok: false, reason: 'not_configured' };

    try {
      const response = await fetch(`${config.url}/rest/v1/${table}`, {
        method: 'POST',
        keepalive: Boolean(keepalive),
        headers: {
          apikey: config.anonKey,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const message = await response.text().catch(() => '');
        console.warn(`[NeoDat Analytics] ${table}: ${response.status}`, message);
      }

      return { ok: response.ok, status: response.status };
    } catch (error) {
      console.warn('[NeoDat Analytics] No se pudo registrar el evento.', error);
      return { ok: false, reason: 'network_error' };
    }
  }

  function technicalMetadata(extra) {
    const screenWidth = Math.round(window.screen && window.screen.width ? window.screen.width : window.innerWidth);
    const screenHeight = Math.round(window.screen && window.screen.height ? window.screen.height : window.innerHeight);
    return {
      timezone: timezoneName(),
      os: osName(),
      platform: String((navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '').slice(0, 100),
      connection: connectionType(),
      viewport_width: Math.round(window.innerWidth || 0),
      viewport_height: Math.round(window.innerHeight || 0),
      screen_width: screenWidth,
      screen_height: screenHeight,
      landing_page: landingPage.slice(0, 500),
      visitor_status: sessionVisitorStatus,
      visitor_first_seen: firstSeen,
      session_started_at: sessionStartedAt,
      source_channel: sessionAttribution.source_channel || 'Directo',
      source_name: sessionAttribution.source_name || 'Directo',
      referrer_domain: sessionAttribution.referrer_domain || '',
      utm_source: sessionAttribution.utm_source || '',
      utm_medium: sessionAttribution.utm_medium || '',
      utm_campaign: sessionAttribution.utm_campaign || '',
      utm_content: sessionAttribution.utm_content || '',
      utm_term: sessionAttribution.utm_term || '',
      ...(extra || {})
    };
  }

  function baseEvent(eventType, metadata) {
    return {
      event_type: eventType,
      page_path: `${window.location.pathname}${window.location.search}`.slice(0, 500),
      page_title: (document.title || '').slice(0, 250),
      referrer: (document.referrer || '').slice(0, 1000),
      visitor_id: visitorId,
      session_id: sessionId,
      device_type: deviceType(),
      browser: browserName(),
      language: (navigator.language || '').slice(0, 40),
      screen_width: Math.round(window.screen && window.screen.width ? window.screen.width : window.innerWidth),
      is_conversion: conversionEvents.has(eventType),
      metadata: sanitizeMetadata(technicalMetadata(metadata))
    };
  }

  function track(eventType, metadata, options) {
    const validType = String(eventType || '').trim().slice(0, 80);
    if (!validType) return Promise.resolve({ ok: false, reason: 'invalid_event' });
    return restInsert('analytics_events', baseEvent(validType, metadata), options && options.keepalive);
  }

  async function saveLead(lead) {
    const payload = {
      name: String(lead.name || '').trim().slice(0, 180),
      company: String(lead.company || '').trim().slice(0, 180) || null,
      email: String(lead.email || '').trim().slice(0, 250),
      phone: String(lead.phone || '').trim().slice(0, 80) || null,
      city: String(lead.city || '').trim().slice(0, 150) || null,
      priority: String(lead.priority || 'Consulta general').trim().slice(0, 100),
      services: Array.isArray(lead.services) ? lead.services.slice(0, 12).map((item) => String(item).slice(0, 150)) : [],
      message: String(lead.message || '').trim().slice(0, 4000),
      page_path: `${window.location.pathname}${window.location.search}`.slice(0, 500),
      visitor_id: visitorId,
      status: 'Nuevo'
    };

    const [leadResult] = await Promise.all([
      restInsert('contact_leads', payload, true),
      track('contact_form', {
        service_count: payload.services.length,
        declared_city: payload.city || ''
      }, { keepalive: true })
    ]);

    return leadResult;
  }

  function isExternalUrl(href) {
    if (!href || /^(mailto:|tel:|javascript:|#)/i.test(href)) return false;
    try {
      const url = new URL(href, window.location.href);
      return /^https?:$/i.test(url.protocol) && url.hostname !== window.location.hostname;
    } catch (error) {
      return false;
    }
  }

  function clickEvent(anchor) {
    const manual = anchor.dataset.analyticsEvent;
    if (manual) return manual;

    const hrefRaw = anchor.getAttribute('href') || '';
    const href = hrefRaw.toLowerCase();
    if (href.includes('wa.me') || href.includes('whatsapp')) return 'whatsapp_click';
    if (href.startsWith('mailto:')) return 'email_click';
    if (href.startsWith('tel:')) return 'phone_click';
    if (href.includes('contacto.html') || href.includes('#contactoform')) return 'meeting_click';
    if (href.includes('simuladores')) return 'simulator_click';
    if (isExternalUrl(hrefRaw)) return 'outbound_click';
    return '';
  }

  let clickCount = 0;
  let maxScroll = 0;
  let activeSeconds = 0;
  let activeStartedAt = document.visibilityState === 'visible' ? performance.now() : null;
  let engagementSent = false;

  function updateScrollDepth() {
    const doc = document.documentElement;
    const body = document.body;
    const scrollTop = window.scrollY || doc.scrollTop || 0;
    const scrollHeight = Math.max(doc.scrollHeight, body ? body.scrollHeight : 0);
    const viewport = window.innerHeight || doc.clientHeight || 0;
    const denominator = Math.max(scrollHeight - viewport, 1);
    maxScroll = Math.max(maxScroll, Math.min(100, Math.round((scrollTop / denominator) * 100)));
  }

  function pauseActiveTimer() {
    if (activeStartedAt === null) return;
    activeSeconds += Math.max(0, (performance.now() - activeStartedAt) / 1000);
    activeStartedAt = null;
  }

  function resumeActiveTimer() {
    if (activeStartedAt === null) activeStartedAt = performance.now();
  }

  function currentActiveSeconds() {
    const extra = activeStartedAt === null ? 0 : Math.max(0, (performance.now() - activeStartedAt) / 1000);
    return Math.round(activeSeconds + extra);
  }

  function sendEngagement() {
    if (engagementSent || /\/admin(?:\.html)?$/i.test(window.location.pathname)) return;
    engagementSent = true;
    pauseActiveTimer();
    updateScrollDepth();
    track('page_engagement', {
      active_seconds: Math.max(0, Math.min(currentActiveSeconds(), 86400)),
      max_scroll_percent: maxScroll,
      click_count: clickCount
    }, { keepalive: true });
  }

  document.addEventListener('click', (event) => {
    clickCount += 1;
    const anchor = event.target.closest('a, button[data-analytics-event]');
    if (!anchor) return;

    const eventType = anchor.matches('button')
      ? anchor.dataset.analyticsEvent
      : clickEvent(anchor);

    if (!eventType) return;

    track(eventType, {
      label: (anchor.textContent || anchor.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 180),
      destination: (anchor.getAttribute('href') || '').slice(0, 500)
    }, { keepalive: true });
  }, { capture: true });

  window.addEventListener('scroll', updateScrollDepth, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') pauseActiveTimer();
    else resumeActiveTimer();
  });

  window.addEventListener('pagehide', sendEngagement);
  window.addEventListener('beforeunload', sendEngagement);

  if (!/\/admin(?:\.html)?$/i.test(window.location.pathname)) {
    track('page_view', {
      is_session_landing: `${window.location.pathname}${window.location.search}` === landingPage,
      entry_referrer: sessionAttribution.entry_referrer || ''
    });
  }

  window.neodatAnalytics = Object.freeze({
    configured,
    track,
    saveLead,
    visitorId,
    sessionId
  });
})();
