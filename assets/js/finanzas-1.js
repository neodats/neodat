/*
      Si index.html se abre sin supabase-sync.js, el motor del simulador continúa
      funcionando en modo local. En el repositorio, cuando el archivo existe,
      se conserva la sincronización real con Supabase.
    */
if (typeof supabaseSync === "undefined") {
  window.__flowSimLocalRunId = "";
  window.__flowSimSupabaseFallback = {
    get runId() {
      return window.__flowSimLocalRunId || "";
    },
    initialize() {
      const status = document.getElementById("supabaseStatus");
      if (status) {
        status.textContent = "Supabase: modo local";
        status.classList.remove("connected", "syncing", "error");
      }
    },
    beginRun() {
      window.__flowSimLocalRunId =
        window.crypto && typeof window.crypto.randomUUID === "function"
          ? window.crypto.randomUUID()
          : "local-" + Date.now() + "-" + Math.random().toString(16).slice(2);
      return window.__flowSimLocalRunId;
    },
    markStatus() {},
    requestSync() {},
    async finishRun() {
      window.__flowSimLocalRunId = "";
      return true;
    },
    async suspendForDeletion() {
      return true;
    },
    async resumeAfterDeletion() {
      return true;
    },
  };
  window.supabaseSync = window.__flowSimSupabaseFallback;
}
