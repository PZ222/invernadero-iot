// ====== Config API ======
const BASE_URL = "https://68bb0e9184055bce63f10925.mockapi.io/api/v1/Invernadero_IoT";

// ====== HTTP helpers ======
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

// ====== Acciones por tipo de dispositivo ======
const ACTIONS_BY_KIND = {
  vent: ["abrir", "mitad", "cerrar", "pausa"],        // Ventilas
  pump: ["ligero", "normal", "intensivo", "detener"], // Riego
  fan:  ["on", "off", "turbo"],                       // Extractor
};

// ====== Icono de encabezado (emoji) por tipo ======
const ICON_BY_KIND = {
  vent: "🪟",
  pump: "🚿",
  fan:  "🌀",
};

// ====== Mapeo estado -> archivo PNG (solo se usa en la zona de Estatus) ======
function statusImageFile(status) {
  if (!status) return "";
  const s = String(status).toLowerCase();

  // Ventilas
  if (s.includes("abierta") || s.includes("abrir")) return "Abierta.png";
  if (s.includes("cerrada") || s.includes("cerrar")) return "Cerrada.png";
  if (s.includes("mitad")) return "Mitad.png";
  if (s.includes("pausa")) return "Pausa.png";

  // Riego
  if (s.includes("ligero")) return "Ligero.png";
  if (s.includes("normal")) return "Normal.png";
  if (s.includes("intensivo")) return "Intensivo.png";
  if (s.includes("detener") || s.includes("detenido")) return "Detener.png";

  // Extractor
  if (s === "on") return "On.png";
  if (s === "off") return "Off.png";
  if (s.includes("turbo")) return "Turbo.png";

  return "";
}

