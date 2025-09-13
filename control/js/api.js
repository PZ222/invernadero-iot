// Config
const BASE_URL = "https://68bb0e9184055bce63f10925.mockapi.io/api/v1/Invernadero_IoT";

// Helpers de red
async function apiGet(path = "") {
  const res = await fetch(`${BASE_URL}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return res.json();
}

async function apiPut(id, body) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT /${id} -> ${res.status}`);
  return res.json();
}

// Dominio: acciones por tipo de dispositivo
const ACTIONS_BY_KIND = {
  vent: ["abrir", "mitad", "cerrar", "pausa"],                 // Ventilas
  pump: ["ligero", "normal", "intensivo", "detener"],          // Riego
  fan:  ["on", "off", "turbo"],                                // Extractor
};

// Mapeo de iconos por tipo
const ICON_BY_KIND = {
  vent: "🪟",
  pump: "🚿",
  fan:  "🌀",
};

// Mapeo visual de estado -> badge
function statusBadge(status) {
  const s = String(status || "").toLowerCase();

  // positivos
  if (["abrir","abierta","ligero","normal","on","turbo"].some(k => s.includes(k))) {
    return `<span class="badge text-bg-success status-badge badge-dot">${status}</span>`;
  }
  // atención
  if (["mitad","intensivo"].some(k => s.includes(k))) {
    return `<span class="badge text-bg-warning status-badge badge-dot">${status}</span>`;
  }
  // detenidos/cerrados/off
  if (["cerrar","cerrada","pausa","detener","detenido","off"].some(k => s.includes(k))) {
    return `<span class="badge text-bg-secondary status-badge badge-dot">${status}</span>`;
  }
  // default
  return `<span class="badge text-bg-info status-badge badge-dot">${status || "—"}</span>`;
}
