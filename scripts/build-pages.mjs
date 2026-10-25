import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { format } from "prettier";
const root = resolve(import.meta.dirname, "..");
const data = JSON.parse(
  readFileSync(resolve(root, "content/site.json"), "utf8"),
);
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const icon = (name) =>
  readFileSync(resolve(root, `assets/icons/${name}.svg`), "utf8").replace(
    "<svg",
    '<svg class="icon" aria-hidden="true" focusable="false"',
  );
const arrow = () => icon("arrow-up-right");
const btn = (text, href, style = "primary") =>
  `<a class="button button-${style}" href="${href}">${text}${arrow()}</a>`;
const eyebrow = (text) => `<span class="eyebrow">${text}</span>`;
const heading = (kicker, title, description = "", link = "") =>
  `<div class="section-head"><div>${eyebrow(kicker)}<h2>${title}</h2>${description ? `<p>${description}</p>` : ""}</div>${link}</div>`;
const nav = [
  ["servicios", "Servicios"],
  ["metodo", "Método"],
  ["ambitos", "Ámbitos"],
  ["quienes-somos", "Equipo"],
  ["simuladores", "Simuladores"],
];
function header(page) {
  return `<header class="site-header"><div class="container navbar"><a class="marca" href="index.html" aria-label="NeoDat Consultores · Inicio"><span class="brand-mark"><img class="brand-base" src="Neo1.png" alt="NeoDat Consultores" width="164" height="64"><img class="brand-accent" src="Neo1.png" alt="" aria-hidden="true" width="164" height="64"></span></a><nav class="menu" aria-label="Navegación principal"><ul>${nav.map(([slug, label]) => `<li><a href="${slug}.html"${page === slug ? ' aria-current="page"' : ""}>${label}</a></li>`).join("")}</ul></nav><a class="header-contact" href="contacto.html"${page === "contacto" ? ' aria-current="page"' : ""}>Conversemos ${arrow()}</a><button class="menu-toggle" type="button" aria-label="Abrir menú" aria-expanded="false">☰</button></div></header>`;
}
function footer() {
  return `<footer class="site-footer"><div class="container footer-grid"><div class="footer-brand"><a class="marca" href="index.html" aria-label="NeoDat Consultores · Inicio"><span class="brand-mark"><img class="brand-base" src="Neo1.png" alt="NeoDat Consultores" width="164" height="64" loading="lazy"><img class="brand-accent" src="Neo1.png" alt="" aria-hidden="true" width="164" height="64" loading="lazy"></span></a><p>Visión financiera, capacidad analítica y tecnología aplicada a la gestión empresarial.</p><span class="footer-location">Loja, Ecuador</span></div><div class="footer-col"><h2>Conozca NeoDat</h2>${nav.map(([slug, label]) => `<a href="${slug}.html">${label}</a>`).join("")}</div><div class="footer-col"><h2>Hablemos de su empresa</h2><a href="mailto:neodatconsultores@gmail.com">neodatconsultores@gmail.com</a><a href="tel:+593960798571">+593 96 079 8571</a><a class="footer-contact-link" href="contacto.html">Envíenos su requerimiento ${arrow()}</a></div></div><div class="container footer-bottom"><span>© 2026 NeoDat Consultores. Todos los derechos reservados.</span><p class="privacy-links"><a href="privacidad.html">Privacidad</a> · <button type="button" data-privacy-settings>Preferencias de analítica</button></p></div></footer><a class="contact-float" href="https://wa.me/593960798571" target="_blank" rel="noopener noreferrer" aria-label="Contactar a NeoDat por WhatsApp">${icon("phone")}<span>WhatsApp</span></a>`;
}
function cta(
  title = "Cuéntenos qué necesita resolver.",
  description = "Cuéntenos qué necesita mejorar. Revisaremos su situación para definir juntos una ruta de trabajo.",
) {
  return `<section class="cta-section"><div class="container cta-grid"><div><h2>${title}</h2><p>${description}</p></div>${btn("Consultar sobre un proyecto", "contacto.html")}</div></section>`;
}
function hero(label, title, description, kicker = label) {
  return `<section class="interior-hero data-atmosphere"><canvas class="data-field" aria-hidden="true"></canvas><div class="container"><nav class="breadcrumb" aria-label="Ruta de navegación"><a href="index.html">Inicio</a><span aria-hidden="true">/</span><span aria-current="page">${label}</span></nav><div class="interior-copy">${eyebrow(kicker)}<h1>${title}</h1><p>${description}</p></div></div></section>`;
}
function serviceCard(service, full = false) {
  return `<article class="service-card"><span class="icon-box">${icon(service.icon)}</span><span class="category">${esc(service.category)}</span><h3>${esc(service.title)}</h3><p>${esc(service.description)}</p>${full ? `<ul>${service.items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : ""}<a class="text-link" href="contacto.html?servicio=${encodeURIComponent(service.title)}">${full ? "Consultar este servicio" : "Conocer más"} ${arrow()}</a></article>`;
}
const values = [
  [
    "target",
    "Precisión",
    "Información consistente y análisis que se puedan verificar.",
  ],
  [
    "layers",
    "Claridad",
    "Herramientas comprensibles para la gestión cotidiana.",
  ],
  [
    "sparkles",
    "Innovación",
    "Tecnología aplicada a necesidades concretas del negocio.",
  ],
  [
    "workflow",
    "Estrategia",
    "Soluciones conectadas con los objetivos de la empresa.",
  ],
];
const pages = {};
pages.index = {
  title: "NeoDat Consultores | Finanzas, datos y tecnología para su empresa",
  description:
    "Conectamos consultoría financiera, análisis de datos y soluciones digitales para fortalecer el control y las decisiones de su empresa.",
  body: `
<section class="hero-home data-atmosphere"><canvas class="data-field" aria-hidden="true"></canvas><div class="container hero-center"><span class="hero-kicker">NEODAT CONSULTORES</span><h1>Finanzas, datos y tecnología<br>para dirigir su empresa.</h1><p>Inteligencia de negocios, consultoría financiera y soluciones digitales para comprender resultados y actuar con mejor información.</p><div class="hero-actions">${btn("Cómo trabajamos", "metodo.html", "ghost")}${btn("Nuestros servicios", "servicios.html", "gold")}</div></div><div class="hero-utility container"><button class="motion-toggle" type="button" aria-label="Pausar animación de fondo" aria-pressed="false"><span data-motion-symbol aria-hidden="true">Ⅱ</span><span class="sr-only" data-motion-label>Pausar animación de fondo</span></button><a class="hero-scroll" href="#enfoque-neodat"><span>Descubra NeoDat</span>${icon("arrow-right")}</a><span class="hero-origin">Loja · Ecuador</span></div></section>
<section class="section home-intro" id="enfoque-neodat"><div class="container"><span class="eyebrow centered">CONSULTORÍA EMPRESARIAL · LOJA, ECUADOR</span><h2>Información financiera y operativa<br>para tomar decisiones.</h2><p>Las decisiones empresariales necesitan información confiable y una lectura que conecte las cifras con la operación. En NeoDat integramos <strong>finanzas, datos y tecnología</strong> para construir esa visión junto a su equipo.</p></div></section>
<section class="section solution-overview"><div class="container">${heading("Cómo podemos ayudarle", "Finanzas, análisis y automatización.", "Identificamos la necesidad y definimos una solución con entregables concretos, desde el diagnóstico hasta su implementación.", `<a class="text-link" href="servicios.html">Ver servicios ${arrow()}</a>`)}<div class="home-solutions">${[0, 2, 6].map((i, n) => `<article class="home-solution"><span class="solution-index">0${n + 1}</span><span class="icon-box">${icon(data.services[i].icon)}</span><h3>${esc(data.services[i].title)}</h3><p>${esc(data.services[i].description)}</p><a href="contacto.html?servicio=${encodeURIComponent(data.services[i].title)}" class="text-link" aria-label="Consultar ${esc(data.services[i].title)}">Conversemos ${arrow()}</a></article>`).join("")}</div></div></section>
<section class="section section-white"><div class="container method-feature"><div class="method-copy">${eyebrow("NUESTRO MÉTODO")}<h2>Del diagnóstico a la implementación.</h2><p>Partimos de las preguntas que necesita resolver. Después organizamos la información, diseñamos las herramientas y acompañamos a su equipo en su adopción.</p><div class="actions">${btn("Cómo trabajamos", "metodo.html", "outline")}</div></div><ol class="method-steps">${data.method.map((step, i) => `<li><span>0${i + 1}</span><div><h3>${esc(step.title)}</h3><p>${esc(step.description)}</p></div></li>`).join("")}</ol></div></section>
<section class="section tools-section"><div class="container">${heading("HERRAMIENTAS NEODAT", "Herramientas para evaluar escenarios.", "Ajuste supuestos, compare alternativas y observe sus resultados con nuestros simuladores.", `<a href="simuladores.html" class="text-link">Ver todas las herramientas ${arrow()}</a>`)}<div class="home-tools">${[2, 3, 5].map((i) => `<a class="tool-card" href="${data.catalog[i].href}"><span class="tool-type">SIMULADOR INTERACTIVO</span><span class="tool-icon">${icon(data.catalog[i].icon)}</span><h3>${esc(data.catalog[i].title)}</h3><p>${esc(data.catalog[i].description)}</p><span class="tool-access">Explorar herramienta ${arrow()}</span></a>`).join("")}</div><p class="tool-disclaimer">Los resultados son orientativos y dependen de los supuestos configurados en cada herramienta.</p></div></section>
<section class="section section-white"><div class="container team-preview"><div>${eyebrow("NUESTRO EQUIPO")}<h2>Experiencia en finanzas, datos y proyectos.</h2><p>Dirección de proyectos, finanzas e inteligencia de negocios para abordar los desafíos de su empresa desde distintas perspectivas.</p><div class="actions">${btn("Conozca al equipo", "quienes-somos.html", "outline")}</div></div><div class="team-triptych">${data.team.map((member) => `<figure><img src="${member.photo}" alt="${esc(member.alt)}" width="400" height="520" loading="lazy"><figcaption>${esc(member.alt)}</figcaption></figure>`).join("")}</div></div></section>
${cta("¿Qué necesita resolver su empresa?", "Comparta su necesidad. Revisaremos qué información tiene disponible, qué quiere mejorar y cómo podemos acompañarle.")}`,
};
pages.servicios = {
  title: "Servicios | NeoDat Consultores",
  description:
    "Consultoría financiera, dashboards, análisis de datos, automatización, desarrollo web y gestión de proyectos para su empresa.",
  body:
    hero(
      "Servicios",
      "Soluciones que conectan<br>información y gestión.",
      "Herramientas de análisis, control y tecnología diseñadas para las preguntas reales de su negocio.",
      "Lo que hacemos",
    ) +
    `<section class="section"><div class="container">${heading("Una oferta conectada", "Del dato al resultado.", "Podemos intervenir en una necesidad específica o construir una solución que integre varias áreas de su empresa.")}<div class="card-grid">${data.services.map((s) => serviceCard(s, true)).join("")}</div></div></section>${cta("Su necesidad define la solución.", "Podemos iniciar con un diagnóstico, construir una herramienta específica o desarrollar una solución que conecte sus datos, finanzas y procesos.")}`,
};
pages.metodo = {
  title: "Nuestro método | NeoDat Consultores",
  description:
    "Diagnóstico, diseño, implementación y acompañamiento: una metodología para convertir información dispersa en herramientas útiles.",
  body:
    hero(
      "Método",
      "Un proceso claro.<br>Herramientas que se utilizan.",
      "Entendemos su negocio, diseñamos la solución, la construimos y acompañamos a su equipo en su adopción.",
      "Cómo trabajamos",
    ) +
    `<section class="section section-white"><div class="container timeline">${data.method.map((step, i) => `<article class="timeline-step"><div class="timeline-stage"><span class="step-number">0${i + 1}</span><span>${esc(step.title)}</span></div><div><h2>${esc(step.heading)}</h2><p>${esc(step.description)}</p></div><ul>${step.items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></article>`).join("")}</div></section><section class="section"><div class="container">${heading("Entregables concretos", "Entregables de nuestros proyectos.", "Cada proyecto define sus propios entregables. Estas son algunas de las herramientas que podemos construir.")}<div class="card-grid">${[1, 6, 0, 5, 3, 7].map((i) => serviceCard(data.services[i])).join("")}</div></div></section>${cta("Si tiene datos, pero necesita claridad, conversemos.")}`,
};
pages.ambitos = {
  title: "Ámbitos de intervención | NeoDat Consultores",
  description:
    "Conectamos información y control en finanzas, dirección, operaciones, ventas, proyectos y tecnología.",
  body:
    hero(
      "Ámbitos",
      "Donde la información<br>cambia la gestión.",
      "Intervenimos en las áreas donde los datos dispersos, los reportes manuales y la falta de visibilidad dificultan decidir y ejecutar.",
      "Dónde aportamos",
    ) +
    `<section class="section section-white"><div class="container"><div class="card-grid">${data.areas.map((area) => `<article class="area-card"><small>${esc(area.category)}</small><h3>${esc(area.title)}</h3><p>${esc(area.description)}</p><ul>${area.items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></article>`).join("")}</div></div></section><section class="section"><div class="container">${heading("Reconozca su punto de partida", "¿Le resulta familiar?")}<div class="situation-grid">${[
      [
        "Vende, pero necesita entender su rentabilidad.",
        "Ordenamos ingresos, costos y márgenes para identificar líneas rentables y puntos críticos.",
      ],
      [
        "Los reportes llegan tarde o incompletos.",
        "Estructuramos información y automatizamos reportes para mejorar su disponibilidad y consistencia.",
      ],
      [
        "Los proyectos avanzan sin una lectura clara.",
        "Definimos hitos, responsables y seguimiento para dar visibilidad a los avances y entregables.",
      ],
      [
        "La información está repartida entre archivos.",
        "Consolidamos fuentes y construimos modelos para analizar y comparar con mayor precisión.",
      ],
    ]
      .map(
        ([t, d]) =>
          `<article class="situation-card"><h3>${t}</h3><p>${d}</p></article>`,
      )
      .join("")}</div></div></section>${cta()}`,
};
pages["quienes-somos"] = {
  title: "Nuestro equipo | NeoDat Consultores",
  description:
    "Conozca al equipo de NeoDat: experiencia en dirección de proyectos, finanzas, economía, datos e inteligencia de negocios.",
  body:
    hero(
      "Equipo",
      "Distintas especialidades.<br>Una misma visión empresarial.",
      "Integramos experiencia financiera, tecnológica y analítica para construir información clara y herramientas de gestión útiles.",
      "Quiénes somos",
    ) +
    `<section class="section section-white"><div class="container">${heading("El equipo NeoDat", "Criterio técnico.<br>Visión de negocio.", "Combinamos dirección de proyectos, finanzas y ciencia de datos para abordar los desafíos de la empresa desde distintas perspectivas.")}<div class="team-grid">${data.team.map((member) => `<article class="team-card"><img class="team-photo" src="${member.photo}" alt="${esc(member.alt)}" width="600" height="615" loading="lazy"><div class="team-info"><span class="specialty">${esc(member.specialty)}</span><h3>${esc(member.name)}</h3><div class="team-role">${esc(member.role)}</div><p>${esc(member.description)}</p></div></article>`).join("")}</div></div></section><section class="section"><div class="container">${heading("Lo que guía nuestro trabajo", "Una forma de hacer las cosas.")}<div class="value-grid">${values.map(([i, t, d]) => `<article>${icon(i)}<h3>${t}</h3><p>${d}</p></article>`).join("")}</div></div></section>${cta("Conozcamos el próximo desafío de su empresa.")}`,
};
const categories = {
  gestion: "Gestión",
  finanzas: "Finanzas",
  ahorro: "Ahorro",
  agroexportacion: "Agroexportación",
};
pages.simuladores = {
  title: "Simuladores empresariales | NeoDat Consultores",
  description:
    "Explore nueve simuladores de finanzas, procesos, ahorro, cobranzas y agroexportación. Ajuste parámetros y compare escenarios.",
  body:
    hero(
      "Simuladores",
      "Explore escenarios.<br>Entienda sus decisiones.",
      "Herramientas interactivas para comparar alternativas, explorar supuestos y comprender su impacto antes de actuar.",
      "Laboratorio NeoDat",
    ) +
    `<section class="section"><div class="container"><div class="marketplace-toolbar"><label class="marketplace-search">${icon("search")}<input id="simulatorSearch" type="search" placeholder="Buscar una herramienta…" aria-label="Buscar simuladores" autocomplete="off"></label><div class="marketplace-filters" role="group" aria-label="Filtrar por categoría">${[["todos", "Todos"], ...Object.entries(categories)].map(([key, label], i) => `<button class="marketplace-filter${i === 0 ? " active" : ""}" type="button" data-filter="${key}" aria-pressed="${i === 0}">${label}</button>`).join("")}</div></div><p class="catalog-count" id="marketplaceCount" role="status" aria-live="polite">${data.catalog.length} simuladores disponibles</p><div class="card-grid" id="marketplaceGrid">${data.catalog.map((item) => `<article class="marketplace-card" data-category="${item.category}" data-title="${esc(item.title + " " + item.description)}"><div class="catalog-cover category-${item.category}">${icon(item.icon)}<span>${categories[item.category]}</span></div><div class="catalog-body"><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p><a class="text-link" href="${item.href}" aria-label="Abrir ${esc(item.title)}">Abrir herramienta ${arrow()}</a></div></article>`).join("")}</div><div class="empty-state" id="marketplaceEmpty" hidden><h2>No encontramos esa herramienta.</h2><p>Pruebe con otra búsqueda o seleccione una categoría diferente.</p></div><p class="catalog-count" style="margin-top:28px">Resultados orientativos basados en los supuestos que configure. Revise las condiciones de cada herramienta.</p></div></section>${cta("¿Necesita una herramienta adaptada a su negocio?", "Conversemos sobre una solución diseñada para su información, sus procesos y sus decisiones.")}`,
  script: "assets/catalog.js",
};
pages.contacto = {
  title: "Contacto | NeoDat Consultores",
  description:
    "Cuéntenos qué necesita mejorar. Contacte con NeoDat para revisar una necesidad de datos, finanzas, proyectos o tecnología.",
  body:
    hero(
      "Contacto",
      "Hablemos de su<br>próximo paso.",
      "Cuéntenos qué necesita organizar, analizar o construir. Empezamos por entender su situación.",
      "Una conversación con propósito",
    ) +
    `<section class="section"><div class="container contact-layout"><aside class="contact-aside"><h2>Elija cómo<br>conversamos.</h2><p>Comparta su necesidad por el formulario o comuníquese directamente con nuestro equipo.</p><div class="contact-channel">${icon("phone")}<div><small>WhatsApp</small><a href="https://wa.me/593960798571" target="_blank" rel="noopener noreferrer">+593 96 079 8571 ${arrow()}</a></div></div><div class="contact-channel">${icon("mail")}<div><small>Correo electrónico</small><a href="mailto:neodatconsultores@gmail.com">neodatconsultores@gmail.com</a></div></div><div class="contact-channel">${icon("map-pin")}<div><small>Estamos en</small><b>Loja, Ecuador</b></div></div><p class="contact-notice">Para empezar, nos ayuda conocer qué problema quiere resolver, qué información tiene disponible y qué resultado espera obtener.</p></aside><section class="form-card" aria-label="Formulario de contacto">${readFileSync(resolve(root, "content/contact-form.html"), "utf8")}</section></div></section>`,
  script: "assets/contact.js",
};
pages.privacidad = {
  title: "Privacidad | NeoDat Consultores",
  description:
    "Información sobre las consultas, la analítica opcional y los datos locales de los simuladores de NeoDat.",
  body:
    hero(
      "Privacidad",
      "Información de privacidad",
      "Conozca cómo se utiliza la información al contactar con NeoDat o utilizar nuestras herramientas.",
      "SUS DATOS",
    ) +
    `<section class="section"><div class="container privacy-document">${readFileSync(resolve(root, "content/privacy.html"), "utf8")}</div></section>`,
};
for (const [slug, page] of Object.entries(pages)) {
  const url =
    slug === "index"
      ? "https://www.neodat.net/"
      : `https://www.neodat.net/${slug}.html`;
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' https://cdn.jsdelivr.net https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(page.title)}</title><meta name="description" content="${esc(page.description)}"><meta name="theme-color" content="#102344"><meta name="referrer" content="strict-origin-when-cross-origin"><link rel="canonical" href="${url}"><link rel="icon" type="image/png" href="logo.png"><meta property="og:type" content="website"><meta property="og:locale" content="es_EC"><meta property="og:title" content="${esc(page.title)}"><meta property="og:description" content="${esc(page.description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="https://www.neodat.net/Neo1.png"><meta name="twitter:card" content="summary_large_image"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;500;600&family=Inter:wght@400;450;500;550;600;650;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="assets/marketing.css"><link rel="stylesheet" href="assets/accessibility.css"><script src="assets/site.js"></script><script src="assets/vendor/gsap.min.js" defer></script><script src="assets/atmosphere.js" defer></script></head><body class="page-${slug}"><a class="skip-link" href="#contenido">Saltar al contenido</a>${header(slug)}<main id="contenido" tabindex="-1">${page.body}</main>${footer()}<script src="assets/supabase-config.js"></script><script src="assets/neodat-analytics.js"></script>${page.script ? `<script src="${page.script}"></script>` : ""}</body></html>`;
  writeFileSync(
    resolve(root, `${slug}.html`),
    await format(html, { parser: "html" }),
  );
}
const publicRoutes = [
  "",
  ...Object.keys(pages)
    .filter((k) => k !== "index")
    .map((k) => k + ".html"),
  ...data.catalog.map((item) => item.href),
];
writeFileSync(
  resolve(root, "sitemap.xml"),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    publicRoutes
      .map((path) => `  <url><loc>https://www.neodat.net/${path}</loc></url>`)
      .join("\n") +
    "\n</urlset>\n",
);
console.log(
  `Built ${Object.keys(pages).length} corporate pages and sitemap from shared templates.`,
);
