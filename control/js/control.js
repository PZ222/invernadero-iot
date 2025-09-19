let devices = [];
let pollTimer = null;
const POLL_MS = 2000;

// Base de imágenes (Opción A: dentro de /control)
const IMG_BASE = "control/img/";

const gridEl   = document.getElementById("devicesGrid");
const searchEl = document.getElementById("searchInput");
const kindEl   = document.getElementById("kindFilter");
const reloadEl = document.getElementById("reloadBtn");

// Bootstrap toast
const toastEl  = document.getElementById("toast");
const toastMsg = document.getElementById("toastMsg");
const toast    = new bootstrap.Toast(toastEl, { delay: 1800 });

function showToast(msg) {
  toastMsg.textContent = msg;
  toast.show();
}

function applyFilters(list) {
  const q = (searchEl.value || "").toLowerCase().trim();
  const kind = (kindEl.value || "").trim();
  return list.filter(d => {
    const matchesText = !q || (d.name || "").toLowerCase().includes(q);
    const matchesKind = !kind || (d.deviceKind === kind);
    return matchesText && matchesKind;
  });
}

function renderDevices(list) {
  if (!list.length) {
    gridEl.innerHTML = `
      <div class="col-12">
        <div class="alert alert-dark border border-secondary text-center">No hay dispositivos. Crea alguno desde Admin.</div>
      </div>`;
    return;
  }

  gridEl.innerHTML = list.map(d => {
    const actions = (ACTIONS_BY_KIND[d.deviceKind] ?? []).map(a => `
      <button class="btn btn-sm btn-outline-light btn-action" data-action="${a}" data-id="${d.id}">
        ${a}
      </button>
    `).join("");

    const imgFile = statusImageFile(d.status);
    const statusHTML = imgFile
      ? `<img src="${IMG_BASE}${imgFile}" alt="${d.status}" class="img-fluid" style="max-height:60px">`
      : `<span class="badge text-bg-secondary">—</span>`;

    const headerIcon = ICON_BY_KIND[d.deviceKind] ?? "📟";
    const updated = d.lastUpdated ? new Date(d.lastUpdated).toLocaleString() : "—";

    return `
      <div class="col-12 col-md-6 col-lg-4">
        <div class="card card-device shadow-sm bg-dark text-light border-secondary">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <div class="device-icon" style="font-size:2rem">${headerIcon}</div>
              <div class="text-end">
                <div class="small text-muted">Tipo</div>
                <div class="fw-medium">${d.deviceKind || "—"}</div>
              </div>
            </div>
            <h2 class="h5">${d.name || "(sin nombre)"}</h2>

            <div class="mt-2">
              <span class="small text-muted me-1">Estatus:</span>
              ${statusHTML}
            </div>

            <div class="d-flex flex-wrap gap-2 mt-3">
              ${actions || '<span class="text-muted small">Sin acciones</span>'}
            </div>

            <div class="d-flex justify-content-between mt-3">
              <div class="small text-muted">id: ${d.id}</div>
              <div class="small text-muted">Actualizado: ${updated}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  gridEl.querySelectorAll("button[data-action]").forEach(btn => {
    btn.addEventListener("click", onActionClick);
  });
}

async function loadDevices() {
  try {
    const list = await apiGet("");
    devices = Array.isArray(list) ? list : [];
    renderDevices(applyFilters(devices));
  } catch (e) {
    console.error(e);
    gridEl.innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger">
          <strong>Error cargando dispositivos:</strong><br>
          ${String(e.message || e)}
          <div class="mt-2 small text-muted">Revisa la URL en <code>control/js/api.js</code> y que existan registros.</div>
        </div>
      </div>`;
  }
}

async function onActionClick(e) {
  const btn = e.currentTarget;
  const id = btn.getAttribute("data-id");
  const action = btn.getAttribute("data-action");

  const dev = devices.find(d => String(d.id) === String(id));
  if (!dev) return;

  const s = String(dev.status || "").toLowerCase();
  if (dev.deviceKind === "vent") {
    if (action === "abrir" && (s.includes("abierta") || s === "abrir")) { showToast("La ventila ya está abierta"); return; }
    if (action === "cerrar" && (s.includes("cerrada") || s === "cerrar")) { showToast("La ventila ya está cerrada"); return; }
  }

  try {
    const nowISO = new Date().toISOString();
    const prevLog = Array.isArray(dev.statusLog) ? dev.statusLog.slice(-9) : [];
    const nextLog = [...prevLog, { ts: nowISO, action }];

    const bodyUpdate = { status: action, lastUpdated: nowISO, statusLog: nextLog };
    await apiPut(id, bodyUpdate);
    showToast(`Acción enviada: ${action}`);
    await loadDevices();
  } catch (err) {
    console.error(err);
    showToast("No se pudo actualizar el dispositivo");
  }
}

// Eventos UI
searchEl.addEventListener("input", () => renderDevices(applyFilters(devices)));
kindEl.addEventListener("change", () => renderDevices(applyFilters(devices)));
reloadEl.addEventListener("click", loadDevices);

// Polling
function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(loadDevices, POLL_MS);
}

// init
loadDevices().then(startPolling);


// Eventos UI
document.getElementById("searchInput").addEventListener("input", () => renderDevices(applyFilters(devices)));
document.getElementById("kindFilter").addEventListener("change", () => renderDevices(applyFilters(devices)));
document.getElementById("reloadBtn").addEventListener("click", loadDevices);

// Polling
function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(loadDevices, POLL_MS);
}

// init
loadDevices().then(startPolling);

