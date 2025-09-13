const BASE_URL = "https://68bb0e9184055bce63f10925.mockapi.io/api/v1/Invernadero_IoT";
console.log("[api] BASE_URL =", BASE_URL);

async function apiGet(path = "") {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, { cache: "no-store" });
  } catch (err) {
    throw new Error(`Error de red: ${err?.message || err}`);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GET ${path || "/"} -> ${res.status} ${res.statusText}: ${text}`);
  }
  const data = await res.json();
  console.log("[api] GET ok, items:", Array.isArray(data) ? data.length : typeof data);
  return data;
}

async function apiPut(id, body) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PUT /${id} -> ${res.status} ${res.statusText}: ${text}`);
  }
  return res.json();
}

const ACTIONS_BY_KIND = {
  vent: ["abrir", "mitad", "cerrar", "pausa"],
  pump: ["ligero", "normal", "intensivo", "detener"],
  fan:  ["on", "off", "turbo"],
};

const ICON_BY_KIND = { vent: "🪟", pump: "🚿", fan: "🌀" };

function statusImageFile(status) {
  if (!status) return "";
  const s = String(status).toLowerCase();
  if (s.includes("abierta") || s.includes("abrir")) return "Abierta.png";
  if (s.includes("cerrada") || s.includes("cerrar")) return "Cerrada.png";
  if (s.includes("mitad")) return "Mitad.png";
  if (s.includes("pausa")) return "Pausa.png";
  if (s.includes("ligero")) return "Ligero.png";
  if (s.includes("normal")) return "Normal.png";
  if (s.includes("intensivo")) return "Intensivo.png";
  if (s.includes("detener") || s.includes("detenido")) return "Detener.png";
  if (s === "on") return "On.png";
  if (s === "off") return "Off.png";
  if (s.includes("turbo")) return "Turbo.png";
  return "";
}

