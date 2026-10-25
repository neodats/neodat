(function () {
  "use strict";
  const config = window.NEODAT_SUPABASE_CONFIG || {};
  const eventTypes = new Set([
    "page_view",
    "page_engagement",
    "whatsapp_click",
    "email_click",
    "phone_click",
    "meeting_click",
    "contact_form",
    "simulator_click",
    "outbound_click",
  ]);
  const conversionTypes = new Set([
    "contact_form",
    "whatsapp_click",
    "email_click",
    "phone_click",
  ]);
  const configured =
    /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config.url || "") &&
    /^sb_publishable_/.test(config.anonKey || "");
  const consentKey = "neodat_analytics_consent";
  const sessionKey = "neodat_analytics_session_v2";
  const visitorKey = "neodat_visitor_id";
  const timeoutMs = 10000;
  let memorySession = null;
  let activeStart = null;
  let activeSeconds = 0;
  let maxScroll = 0;
  let clicks = 0;
  let pageViewSent = false;
  let engagementSent = false;
  const pending = new Set();

  function read(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  function write(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* Storage may be disabled. */
    }
  }
  function remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* Memory fallback is sufficient. */
    }
  }
  function uuid() {
    return window.crypto.randomUUID();
  }
  function consented() {
    return (
      navigator.globalPrivacyControl !== true && read(consentKey) === "accepted"
    );
  }
  function pathOnly(value) {
    try {
      return new URL(value, window.location.href).pathname.slice(0, 500);
    } catch {
      return "/";
    }
  }
  function referrerOrigin() {
    try {
      return new URL(document.referrer).origin;
    } catch {
      return "";
    }
  }
  function session() {
    const now = Date.now();
    let current = memorySession;
    if (!current) {
      try {
        current = JSON.parse(read(sessionKey));
      } catch {
        current = null;
      }
    }
    if (
      !current ||
      typeof current.id !== "string" ||
      !Number.isFinite(current.lastAt) ||
      now - current.lastAt > 1800000
    ) {
      current = {
        id: `session_${uuid()}`,
        startedAt: new Date(now).toISOString(),
        lastAt: now,
        landing: pathOnly(location.href),
        source: referrerOrigin(),
      };
    }
    current.lastAt = now;
    memorySession = current;
    write(sessionKey, JSON.stringify(current));
    return current;
  }
  function visitor() {
    let id = read(visitorKey);
    if (!/^visitor_[\w-]{20,100}$/.test(id || "")) {
      id = `visitor_${uuid()}`;
      write(visitorKey, id);
    }
    return id;
  }
  async function post(
    url,
    payload,
    { key, keepalive = false, analytics = false } = {},
  ) {
    const controller = new AbortController();
    if (analytics) pending.add(controller);
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method: "POST",
        signal: controller.signal,
        keepalive,
        headers: {
          "Content-Type": "application/json",
          ...(key ? { apikey: key, Prefer: "return=minimal" } : {}),
        },
        body: JSON.stringify(payload),
      });
      return { ok: response.ok, status: response.status };
    } catch {
      return {
        ok: false,
        reason: controller.signal.aborted ? "timeout" : "network_error",
      };
    } finally {
      clearTimeout(timer);
      pending.delete(controller);
    }
  }
  function track(type, extra = {}, options = {}) {
    if (!eventTypes.has(type))
      return Promise.resolve({ ok: false, reason: "invalid_event" });
    if (!configured || !consented())
      return Promise.resolve({ ok: false, reason: "disabled" });
    const current = session();
    const metadata = {
      landing_page: current.landing,
      session_started_at: current.startedAt,
      source_name: current.source || "Directo",
      source_channel: current.source ? "Referido" : "Directo",
    };
    // Never collect form text, full URLs or user-provided labels.
    for (const key of [
      "active_seconds",
      "max_scroll_percent",
      "click_count",
      "service_count",
    ]) {
      if (Number.isFinite(extra[key]))
        metadata[key] = Math.max(0, Math.min(extra[key], 86400));
    }
    if (extra.destination) metadata.destination = pathOnly(extra.destination);
    return post(
      `${config.url}/rest/v1/analytics_events`,
      {
        event_type: type,
        page_path: pathOnly(location.href),
        page_title: document.title.slice(0, 250),
        referrer: current.source,
        visitor_id: visitor(),
        session_id: current.id,
        device_type:
          innerWidth <= 767
            ? "Móvil"
            : innerWidth <= 1100
              ? "Tablet"
              : "Escritorio",
        browser: /Edg\//.test(navigator.userAgent)
          ? "Edge"
          : /Firefox\//.test(navigator.userAgent)
            ? "Firefox"
            : /Chrome\//.test(navigator.userAgent)
              ? "Chrome"
              : /Safari\//.test(navigator.userAgent)
                ? "Safari"
                : "Otro",
        language: (navigator.language || "").slice(0, 40),
        screen_width: Math.round(innerWidth),
        is_conversion: conversionTypes.has(type),
        metadata,
      },
      {
        key: config.anonKey,
        keepalive: Boolean(options.keepalive),
        analytics: true,
      },
    );
  }
  async function saveLead(lead, options = {}) {
    if (!configured || !config.contactEndpoint || !config.turnstileSiteKey)
      return { ok: false, reason: "not_configured" };
    const result = await post(config.contactEndpoint, {
      ...lead,
      request_id: options.requestId,
      captcha_token: options.captchaToken,
      website: options.honeypot || "",
    });
    // A conversion means a confirmed database write, independently of tracking failures.
    if (result.ok)
      void track("contact_form", { service_count: lead.services?.length || 0 });
    return result;
  }
  function pause() {
    if (activeStart !== null) {
      activeSeconds += (performance.now() - activeStart) / 1000;
      activeStart = null;
    }
  }
  function resume() {
    if (
      consented() &&
      activeStart === null &&
      document.visibilityState === "visible"
    )
      activeStart = performance.now();
  }
  function start() {
    if (
      pageViewSent ||
      !consented() ||
      /\/admin\.html$/.test(location.pathname)
    )
      return;
    pageViewSent = true;
    resume();
    void track("page_view");
  }
  function setConsent(value) {
    write(consentKey, value === "accepted" ? "accepted" : "rejected");
    if (value !== "accepted") {
      pending.forEach((controller) => controller.abort());
      pause();
      memorySession = null;
      for (const key of [visitorKey, sessionKey, "neodat_visitor_first_seen"])
        remove(key);
      try {
        for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
          const key = window.sessionStorage.key(i);
          if (key.startsWith("neodat_session_"))
            window.sessionStorage.removeItem(key);
        }
      } catch {
        /* Storage may be disabled. */
      }
    } else {
      pageViewSent = false;
      engagementSent = false;
      activeSeconds = 0;
      maxScroll = 0;
      clicks = 0;
      start();
    }
    document.getElementById("analyticsConsent")?.remove();
  }
  function showPreferences() {
    if (document.getElementById("analyticsConsent")) return;
    const panel = document.createElement("section");
    panel.id = "analyticsConsent";
    panel.className = "consent-panel";
    panel.setAttribute("aria-label", "Preferencias de analítica");
    const paragraph = document.createElement("p");
    paragraph.textContent =
      "Con su permiso medimos visitas e interacciones para mejorar la web. Puede usar el sitio y enviar consultas sin aceptar la analítica.";
    panel.append(paragraph);
    for (const [label, value] of [
      ["Rechazar analítica", "rejected"],
      ["Aceptar analítica", "accepted"],
    ]) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.addEventListener("click", () => setConsent(value));
      panel.append(button);
    }
    document.body.append(panel);
  }
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    if (event.target.closest("[data-privacy-settings]")) {
      showPreferences();
      return;
    }
    if (!consented()) return;
    clicks++;
    const anchor = event.target.closest("a[href]");
    if (!anchor) return;
    const href = anchor.getAttribute("href");
    let type = "";
    try {
      const url = new URL(href, location.href);
      if (["wa.me", "api.whatsapp.com"].includes(url.hostname))
        type = "whatsapp_click";
      else if (url.protocol === "mailto:") type = "email_click";
      else if (url.protocol === "tel:") type = "phone_click";
      else if (
        url.origin === location.origin &&
        /contacto\.html$/.test(url.pathname)
      )
        type = "meeting_click";
      else if (
        url.origin === location.origin &&
        /simuladores/.test(url.pathname)
      )
        type = "simulator_click";
      else if (/^https?:$/.test(url.protocol) && url.origin !== location.origin)
        type = "outbound_click";
    } catch {
      return;
    }
    if (type) void track(type, { destination: href }, { keepalive: true });
  });
  addEventListener(
    "scroll",
    () => {
      if (!consented()) return;
      const height = document.documentElement.scrollHeight - innerHeight;
      maxScroll = Math.max(
        maxScroll,
        height > 0 ? Math.min(100, Math.round((scrollY / height) * 100)) : 100,
      );
    },
    { passive: true },
  );
  document.addEventListener("visibilitychange", () =>
    document.visibilityState === "hidden" ? pause() : resume(),
  );
  addEventListener("pagehide", () => {
    pause();
    if (pageViewSent && !engagementSent && consented()) {
      engagementSent = true;
      void track(
        "page_engagement",
        {
          active_seconds: Math.round(activeSeconds),
          max_scroll_percent: maxScroll,
          click_count: clicks,
        },
        { keepalive: true },
      );
    }
  });
  addEventListener("pageshow", (event) => {
    if (event.persisted) {
      engagementSent = false;
      pageViewSent = false;
      activeSeconds = 0;
      clicks = 0;
      maxScroll = 0;
      start();
    }
  });
  addEventListener("storage", (event) => {
    if (event.key === consentKey) {
      if (!consented()) {
        pending.forEach((c) => c.abort());
        pause();
      } else start();
    }
  });
  window.neodatAnalytics = Object.freeze({
    configured,
    track,
    saveLead,
    setConsent,
    showPreferences,
  });
  if (navigator.globalPrivacyControl === true) setConsent("rejected");

  start();
})();
