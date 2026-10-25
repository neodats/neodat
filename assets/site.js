(function () {
  "use strict";
  function escapeHtml(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );
  }
  function csvCell(value) {
    let text = String(value ?? "");
    if (
      /^[\s\u0000-\u001f]*[=+@-]/.test(text) &&
      !/^\s*-?\d+(\.\d+)?\s*$/.test(text)
    )
      text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  }
  function downloadCsv(filename, rows) {
    const content =
      "\uFEFF" + rows.map((row) => row.map(csvCell).join(";")).join("\r\n");
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function localDate(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  function number(value, min = 0, max = 1e12) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : min;
  }
  window.NeoDat = Object.freeze({
    escapeHtml,
    csvCell,
    downloadCsv,
    localDate,
    number,
  });
  document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.querySelector(".menu-toggle");
    const menu = document.querySelector("nav.menu");
    if (toggle && menu) {
      menu.id ||= "menu-principal";
      toggle.setAttribute("aria-controls", menu.id);
      const close = () => {
        menu.classList.remove("activo");
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "☰";
      };
      toggle.addEventListener("click", () => {
        const open = menu.classList.toggle("activo");
        toggle.setAttribute("aria-expanded", String(open));
        toggle.textContent = open ? "×" : "☰";
      });
      menu.addEventListener("click", (event) => {
        if (event.target.closest("a")) close();
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && menu.classList.contains("activo")) {
          close();
          toggle.focus();
        }
      });
      document.addEventListener("click", (event) => {
        if (!menu.contains(event.target) && !toggle.contains(event.target))
          close();
      });
      matchMedia("(min-width: 1001px)").addEventListener("change", close);
    }
    document
      .querySelectorAll("[data-print]")
      .forEach((button) =>
        button.addEventListener("click", () => window.print()),
      );
    document.querySelectorAll("img").forEach((img) => {
      if (!img.getAttribute("alt"))
        img.alt = img.closest(".marca,.brand,.footer-logo")
          ? "NeoDat Consultores"
          : "";
      img.decoding = "async";
      if (!img.closest("header,.hero")) img.loading = "lazy";
    });
    function labels() {
      document.querySelectorAll(".field label:not([for])").forEach((label) => {
        const field = label.parentElement.querySelector(
          "input,select,textarea",
        );
        if (field?.id) label.htmlFor = field.id;
      });
      document
        .querySelectorAll("table input:not([aria-label])")
        .forEach((input) => {
          const cell = input.closest("td"),
            table = input.closest("table");
          const heading = table
            ?.querySelectorAll("thead th")
            [cell?.cellIndex]?.textContent?.trim();
          input.setAttribute(
            "aria-label",
            heading || input.dataset.k || "Valor",
          );
        });
      document
        .querySelectorAll("button[data-del]:not([aria-label])")
        .forEach((button) =>
          button.setAttribute("aria-label", "Eliminar fila"),
        );
    }
    labels();
    // Simulator rows are recreated after edits. Restore focus and its caret.
    let focused = null;
    document.addEventListener(
      "input",
      (event) => {
        const el = event.target;
        if (!(el instanceof HTMLInputElement) || !el.dataset.k) return;
        focused = {
          table: el.closest("tbody")?.id,
          i: el.dataset.i,
          k: el.dataset.k,
          start: el.selectionStart,
          end: el.selectionEnd,
        };
      },
      true,
    );
    new MutationObserver(() => {
      labels();
      if (!focused) return;
      const saved = focused;
      focused = null;
      const next = document
        .getElementById(saved.table)
        ?.querySelector(`input[data-i="${saved.i}"][data-k="${saved.k}"]`);
      if (next) {
        next.focus({ preventScroll: true });
        if (saved.start !== null && next.type === "text")
          next.setSelectionRange(saved.start, saved.end);
      }
    }).observe(document.body, { childList: true, subtree: true });
  });
})();
