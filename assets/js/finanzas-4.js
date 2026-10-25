(() => {
  "use strict";

  const dom = {
    toolsButton: document.getElementById("toolsMenuBtn"),
    toolsMenu: document.getElementById("toolsMenu"),
    deleteButton: document.getElementById("deleteStoredDataBtn"),
    overlay: document.getElementById("deleteDataOverlay"),
    closeButton: document.getElementById("closeDeleteDataBtn"),
    cancelButton: document.getElementById("cancelDeleteDataBtn"),
    confirmButton: document.getElementById("confirmDeleteDataBtn"),
    confirmation: document.getElementById("deleteConfirmationInput"),
    error: document.getElementById("deleteDataError"),
  };

  function closeToolsMenu() {
    dom.toolsMenu?.classList.remove("open");
    dom.toolsMenu?.setAttribute("aria-hidden", "true");
    dom.toolsButton?.setAttribute("aria-expanded", "false");
  }

  function toggleToolsMenu() {
    const open = !dom.toolsMenu?.classList.contains("open");
    dom.toolsMenu?.classList.toggle("open", open);
    dom.toolsMenu?.setAttribute("aria-hidden", String(!open));
    dom.toolsButton?.setAttribute("aria-expanded", String(open));
  }

  function showDeleteError(message) {
    if (!dom.error) return;
    dom.error.hidden = !message;
    dom.error.textContent = message || "";
  }

  function configured() {
    const config = window.SUPABASE_CONFIG || {};
    return Boolean(
      config.url &&
      config.publishableKey &&
      !String(config.publishableKey).includes("PEGUE_AQUI"),
    );
  }

  function openDeleteDialog() {
    closeToolsMenu();
    showDeleteError("");

    dom.confirmation.value = "";
    dom.overlay.classList.add("open");
    dom.overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    window.setTimeout(() => dom.confirmation.focus(), 50);
  }

  function closeDeleteDialog() {
    if (dom.confirmButton?.disabled) return;
    dom.overlay.classList.remove("open");
    dom.overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    showDeleteError("");
  }

  function setDeleting(deleting) {
    dom.confirmButton.disabled = deleting;
    dom.confirmButton.classList.toggle("loading", deleting);
    dom.confirmation.disabled = deleting;
    dom.cancelButton.disabled = deleting;
    dom.closeButton.disabled = deleting;
  }

  function clearLivePanel() {
    [
      "liveCountPersons",
      "liveCountEvents",
      "liveCountMovements",
      "liveCountMetrics",
      "liveCountSyncs",
    ].forEach((id) => {
      const element = document.getElementById(id);
      if (element) element.textContent = "0";
    });

    const meta = document.getElementById("supabaseLiveMeta");
    if (meta) meta.textContent = "No existen datos guardados.";

    const wrap = document.getElementById("supabaseLiveTableWrap");
    if (wrap) {
      wrap.innerHTML =
        '<div class="supabase-live-empty">Todos los registros de FlowSim fueron eliminados de Supabase.</div>';
    }

    const status = document.getElementById("supabaseLiveStatus");
    if (status) {
      status.textContent = "Base limpia";
      status.classList.remove("error");
    }
  }

  async function deleteAllStoredData() {
    showDeleteError("");

    if (!configured()) {
      showDeleteError(
        "Supabase no está configurado. Revise supabase-config.js.",
      );
      return;
    }

    if (dom.confirmation.value.trim() !== "BORRAR TODO") {
      showDeleteError(
        "La confirmación no coincide. Escriba exactamente: BORRAR TODO",
      );
      dom.confirmation.focus();
      return;
    }

    setDeleting(true);
    const syncApi = window.FlowSimTramites?.supabase;

    try {
      await syncApi?.suspendForDeletion?.();

      const config = window.SUPABASE_CONFIG;
      const endpoint = `${String(config.url).replace(/\/$/, "")}/rest/v1/rpc/borrar_datos_flowsim`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          apikey: config.publishableKey,
          Authorization: `Bearer ${config.publishableKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        mode: "cors",
        cache: "no-store",
        body: JSON.stringify({
          p_confirmacion: "BORRAR TODO",
        }),
      });

      const responseText = await response.text();
      let result = null;

      try {
        result = responseText ? JSON.parse(responseText) : null;
      } catch (error) {}

      if (!response.ok || result?.ok === false) {
        const message =
          result?.message ||
          result?.details ||
          result?.hint ||
          responseText ||
          `Supabase respondió con el estado ${response.status}.`;
        throw new Error(message);
      }

      await syncApi?.discardAllLocalData?.();
      window.FlowSimTramites?.reset?.();

      clearLivePanel();
      closeDeleteDialog();

      if (typeof window.showToast === "function") {
        window.showToast(
          "Todos los datos guardados fueron eliminados.",
          "success",
        );
      } else {
        window.alert("Todos los datos guardados fueron eliminados.");
      }
    } catch (error) {
      console.error("Error al borrar datos de Supabase:", error);
      syncApi?.resumeAfterDeletionFailure?.();

      let message = error?.message || String(error);

      if (/function.*does not exist|404|PGRST202/i.test(message)) {
        message =
          "La función de borrado no está instalada. Ejecute ACTIVAR_BORRADO_DEFINITIVO.sql en Supabase SQL Editor.";
      }

      showDeleteError(message);
    } finally {
      setDeleting(false);
    }
  }

  dom.toolsButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleToolsMenu();
  });

  dom.toolsMenu?.addEventListener("click", (event) => {
    const item = event.target.closest(".tools-menu-item");
    if (item && item.id !== "deleteStoredDataBtn") {
      closeToolsMenu();
    }
  });

  dom.deleteButton?.addEventListener("click", openDeleteDialog);
  dom.closeButton?.addEventListener("click", closeDeleteDialog);
  dom.cancelButton?.addEventListener("click", closeDeleteDialog);
  dom.confirmButton?.addEventListener(
    "click",
    () => void deleteAllStoredData(),
  );

  dom.overlay?.addEventListener("click", (event) => {
    if (event.target === dom.overlay) closeDeleteDialog();
  });

  document.addEventListener("click", (event) => {
    if (
      !dom.toolsMenu?.contains(event.target) &&
      !dom.toolsButton?.contains(event.target)
    ) {
      closeToolsMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    if (dom.overlay?.classList.contains("open")) {
      closeDeleteDialog();
    } else {
      closeToolsMenu();
    }
  });
})();
