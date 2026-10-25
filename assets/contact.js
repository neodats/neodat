(function () {
  "use strict";
  const form = document.getElementById("contactoForm");
  if (!form) return;
  const config = window.NEODAT_SUPABASE_CONFIG || {};
  const requested = new URLSearchParams(location.search).get("servicio");
  const aliases = {
    "Desarrollo web empresarial": "Página web corporativa",
    "Gestión de proyectos": "Creación de proyectos",
    "Planeación y control de gestión": "Control de gestión",
  };
  form.querySelectorAll('input[name="servicio"]').forEach((input) => {
    if (input.value === (aliases[requested] || requested)) input.checked = true;
  });
  const button = form.querySelector('[type="submit"]');
  const status = document.getElementById("contactStatus");
  const fallback = document.getElementById("contactEmailFallback");
  let widget = null,
    captchaToken = "",
    requestId = null,
    lastBody = "",
    submitting = false;
  function message(text, state = "error") {
    status.textContent = text;
    status.dataset.state = state;
  }
  function mountCaptcha() {
    if (!config.turnstileSiteKey || !window.turnstile || widget !== null)
      return;
    widget = window.turnstile.render("#contactCaptcha", {
      sitekey: config.turnstileSiteKey,
      action: "contact",
      callback: (token) => {
        captchaToken = token;
      },
      "expired-callback": () => {
        captchaToken = "";
      },
      "error-callback": () => {
        captchaToken = "";
        message(
          "No se pudo completar la verificación. Reintente o use correo o WhatsApp.",
        );
      },
    });
  }
  if (config.turnstileSiteKey) {
    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = mountCaptcha;
    script.onerror = () =>
      message(
        "No se pudo cargar la verificación. Puede contactarnos por correo o WhatsApp.",
      );
    document.head.append(script);
  } else {
    button.textContent = "Preparar consulta por correo";
    const intro = form.closest(".form-card")?.querySelector(":scope > p");
    if (intro)
      intro.textContent =
        "Complete su consulta y prepare un correo con sus datos. El envío se completa en su aplicación de correo.";
    message(
      "Puede preparar su consulta por correo o contactarnos directamente por WhatsApp.",
      "info",
    );
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitting || !form.reportValidity()) return;
    const data = new FormData(form);
    const lead = {
      name: String(data.get("nombre") || "").trim(),
      company: String(data.get("empresa") || "").trim(),
      email: String(data.get("correo") || "").trim(),
      phone: String(data.get("telefono") || "").trim(),
      city: String(data.get("ciudad") || "").trim(),
      priority: String(data.get("urgencia") || "Consulta general"),
      services: data.getAll("servicio"),
      message: String(data.get("mensaje") || "").trim(),
    };
    if (lead.name.length < 2 || lead.message.length < 2) {
      message("Escriba al menos dos caracteres en nombre y descripción.");
      return;
    }
    const content = [
      "Nombre: " + lead.name,
      "Empresa: " + lead.company,
      "Correo: " + lead.email,
      "Teléfono: " + lead.phone,
      "Ciudad: " + lead.city,
      "Prioridad: " + lead.priority,
      "Servicios: " + lead.services.join(", "),
      "",
      lead.message,
    ].join("\n");
    fallback.href =
      "mailto:neodatconsultores@gmail.com?subject=" +
      encodeURIComponent("Consulta a NeoDat Consultores") +
      "&body=" +
      encodeURIComponent(content);
    fallback.hidden = false;
    if (!config.turnstileSiteKey || !config.contactEndpoint) {
      message(
        "Prepare el correo con el enlace de abajo y complete el envío en su aplicación de correo.",
        "info",
      );
      return;
    }
    if (!captchaToken) {
      message("Complete la verificación antes de enviar.");
      return;
    }
    const body = JSON.stringify(lead);
    if (body !== lastBody || !requestId) {
      requestId = crypto.randomUUID();
      lastBody = body;
    }
    submitting = true;
    button.disabled = true;
    form.setAttribute("aria-busy", "true");
    message("Enviando su solicitud…", "info");
    try {
      const result = await window.neodatAnalytics.saveLead(lead, {
        requestId,
        captchaToken,
        honeypot: data.get("website"),
      });
      if (!result.ok)
        throw new Error(
          result.status === 429
            ? "Se alcanzó el límite de envíos. Espere unos minutos o use correo o WhatsApp."
            : "No pudimos confirmar el envío. Sus datos siguen en el formulario; puede reintentar o preparar un correo.",
        );
      message(
        "Su solicitud quedó registrada. NeoDat podrá responderle a través de los datos de contacto indicados.",
        "success",
      );
      form.reset();
      requestId = null;
      lastBody = "";
      fallback.hidden = true;
    } catch (error) {
      message(
        error.message ||
          "No fue posible enviar la solicitud. Puede reintentar.",
      );
    } finally {
      submitting = false;
      button.disabled = false;
      form.removeAttribute("aria-busy");
      captchaToken = "";
      if (widget !== null) window.turnstile.reset(widget);
    }
  });
})();
