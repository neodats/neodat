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

  function persistentId(storage, key, prefix) {
    try {
      let value = storage.getItem(key);
      if (!value) {
        value = randomId(prefix);
        storage.setItem(key, value);
      }
      return value;
    } catch (error) {
      return randomId(prefix);
    }
  }

  const visitorId = persistentId(window.localStorage, 'neodat_visitor_id', 'visitor');
  const sessionId = persistentId(window.sessionStorage, 'neodat_session_id', 'session');

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

  function sanitizeMetadata(metadata) {
    const safe = {};
    if (!metadata || typeof metadata !== 'object') return safe;
    Object.entries(metadata).forEach(([key, value]) => {
      if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
        safe[String(key).slice(0, 80)] = typeof value === 'string' ? value.slice(0, 500) : value;
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
          Authorization: `Bearer ${config.anonKey}`,
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
      language: (navigator.language || '').slice(0, 20),
      screen_width: Math.round(window.screen && window.screen.width ? window.screen.width : window.innerWidth),
      is_conversion: conversionEvents.has(eventType),
      metadata: sanitizeMetadata(metadata)
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
      track('contact_form', { service_count: payload.services.length }, { keepalive: true })
    ]);

    return leadResult;
  }

  function clickEvent(anchor) {
    const manual = anchor.dataset.analyticsEvent;
    if (manual) return manual;

    const href = (anchor.getAttribute('href') || '').toLowerCase();
    if (href.includes('wa.me') || href.includes('whatsapp')) return 'whatsapp_click';
    if (href.startsWith('mailto:')) return 'email_click';
    if (href.startsWith('tel:')) return 'phone_click';
    if (href.includes('contacto.html') || href.includes('#contactoform')) return 'meeting_click';
    if (href.includes('simuladores')) return 'simulator_click';
    return '';
  }

  document.addEventListener('click', (event) => {
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

  if (!/\/admin\.html$/i.test(window.location.pathname)) {
    track('page_view', {
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight
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
