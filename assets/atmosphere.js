(function () {
  "use strict";
  function initialize() {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const fields = [...document.querySelectorAll(".data-field")];
    const instances = [];
    for (const canvas of fields) {
      const context = canvas.getContext("2d", { alpha: true });
      if (!context) continue;
      const host = canvas.closest(".data-atmosphere");
      const control = host.querySelector(".motion-toggle");
      let width = 1,
        height = 1,
        frame = 0,
        previous = 0,
        elapsed = 0;
      let visible = true,
        userPaused = false,
        resizeTimer = 0;
      const reduced = () => preference.matches;
      const active = () =>
        visible && !document.hidden && !userPaused && !reduced();
      function points(lane, phase, secondary = false) {
        const drift = Math.sin(phase + lane * 0.018) * 0.023;
        return secondary
          ? [
              [-0.13, 0.77 + lane * 0.006],
              [0.23, 0.92 + drift],
              [0.54, 0.02 + lane * 0.004],
              [1.13, 0.28 + lane * 0.002],
            ]
          : [
              [-0.13, 0.28 + lane * 0.009],
              [0.25, 0.05 + lane * 0.009 + drift],
              [0.36, 0.86 - lane * 0.003 + drift],
              [1.15, 0.17 + lane * 0.002],
            ];
      }
      function curve(controlPoints, t) {
        const u = 1 - t;
        return [0, 1].map(
          (axis) =>
            u * u * u * controlPoints[0][axis] +
            3 * u * u * t * controlPoints[1][axis] +
            3 * u * t * t * controlPoints[2][axis] +
            t * t * t * controlPoints[3][axis],
        );
      }
      function draw(time) {
        context.clearRect(0, 0, width, height);
        const phase = time / 17000;
        const gradient = context.createLinearGradient(
          0,
          0,
          width,
          height * 0.3,
        );
        gradient.addColorStop(0, "rgba(126,171,224,.27)");
        gradient.addColorStop(0.45, "rgba(113,165,222,.11)");
        gradient.addColorStop(1, "rgba(125,170,220,.02)");
        context.strokeStyle = gradient;
        context.lineWidth = 0.7;
        for (let lane = -30; lane <= 30; lane++) {
          const p = points(lane, phase);
          context.beginPath();
          context.moveTo(p[0][0] * width, p[0][1] * height);
          context.bezierCurveTo(
            p[1][0] * width,
            p[1][1] * height,
            p[2][0] * width,
            p[2][1] * height,
            p[3][0] * width,
            p[3][1] * height,
          );
          context.stroke();
        }
        context.strokeStyle = "rgba(93,145,206,.065)";
        for (let lane = -15; lane <= 15; lane++) {
          const p = points(lane, phase, true);
          context.beginPath();
          context.moveTo(p[0][0] * width, p[0][1] * height);
          context.bezierCurveTo(
            p[1][0] * width,
            p[1][1] * height,
            p[2][0] * width,
            p[2][1] * height,
            p[3][0] * width,
            p[3][1] * height,
          );
          context.stroke();
        }
        const count = width < 700 ? 23 : 42;
        for (let i = 0; i < count; i++) {
          const lane = ((i * 17) % 61) - 30;
          const t = (i * 0.173 + time / 44000) % 1;
          const [x, y] = curve(points(lane, phase), t);
          const edge = Math.sin(Math.PI * t);
          context.beginPath();
          context.arc(
            x * width,
            y * height,
            i % 7 === 0 ? 1.6 : 1,
            0,
            Math.PI * 2,
          );
          context.fillStyle =
            i % 13 === 0
              ? `rgba(242,174,42,${edge * 0.45})`
              : `rgba(191,219,255,${edge * 0.55})`;
          context.fill();
        }
      }
      function tick(now) {
        frame = 0;
        if (!active()) {
          previous = 0;
          return;
        }
        if (!previous || now - previous >= 33) {
          if (previous) elapsed += Math.min(now - previous, 100);
          previous = now;
          draw(elapsed);
        }
        frame = requestAnimationFrame(tick);
      }
      function sync() {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        previous = 0;
        if (control) {
          control.disabled = reduced();
          const label = reduced()
            ? "Animación desactivada"
            : userPaused
              ? "Reanudar animación de fondo"
              : "Pausar animación de fondo";
          const spanish = reduced()
            ? "Animación desactivada por su preferencia de movimiento reducido"
            : label;
          control.setAttribute("aria-label", spanish);
          control.setAttribute("aria-pressed", String(userPaused || reduced()));
          control.querySelector("[data-motion-symbol]").textContent =
            userPaused || reduced() ? "▷" : "Ⅱ";
          control.querySelector("[data-motion-label]").textContent = spanish;
        }
        draw(elapsed);
        if (active()) frame = requestAnimationFrame(tick);
      }
      function resize() {
        const bounds = host.getBoundingClientRect();
        width = Math.max(1, bounds.width);
        height = Math.max(1, bounds.height);
        const ratio = Math.min(
          window.devicePixelRatio || 1,
          width < 700 ? 1.25 : 1.5,
        );
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        draw(elapsed);
        host.classList.add("has-data-canvas");
      }
      resize();
      sync();
      if (control)
        control.addEventListener("click", () => {
          userPaused = !userPaused;
          sync();
        });
      const onResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 120);
      };
      window.addEventListener("resize", onResize, { passive: true });
      document.addEventListener("visibilitychange", sync);
      preference.addEventListener("change", sync);
      let observer = null;
      if ("IntersectionObserver" in window) {
        observer = new IntersectionObserver(
          (entries) => {
            visible = entries[0].isIntersecting;
            sync();
          },
          { threshold: 0 },
        );
        observer.observe(host);
      }
      instances.push({
        stop() {
          if (frame) cancelAnimationFrame(frame);
          frame = 0;
          previous = 0;
        },
        resume() {
          resize();
          sync();
        },
      });
    }
    window.addEventListener("pagehide", () =>
      instances.forEach((instance) => instance.stop()),
    );
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) instances.forEach((instance) => instance.resume());
    });
    if (window.gsap && document.querySelector(".hero-center")) {
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".hero-center h1,.hero-center>p,.hero-actions", {
          autoAlpha: 0,
          y: 17,
          duration: 0.85,
          stagger: 0.13,
          ease: "power2.out",
          clearProps: "all",
        });
      });
    }
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
