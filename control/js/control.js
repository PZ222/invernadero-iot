let devices = [];
let pollTimer = null;
const POLL_MS = 2000;

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
        <div class="alert alert-light border text-center">No hay dispositivos. Crea alguno desde Admin.</div>
      </div>`;
    return;
  }

  gridEl.innerHTML = list.map(d => {
    const icon = ICON_BY_KIND[d.deviceKind] ?? "📟";
    const actions = ACTIONS_BY_KIND[d.deviceKind] ?? [];
    const buttons = actions.map(a => `
      <button class="btn btn-sm btn-outline-primary btn-action" data-action="${a}" data-id="${d.id}">
        ${a}
      </button>
    `).join("");

    const statusHTML = statusBadge(d.status);
    const updated = d.lastUpdated ? new Date(d.lastUpdated).toLocaleString() : "—";

    return `
      <div class="col-12 col-md-6 col-lg-4">
        <div class="card card-device shadow-sm">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <div class="device-icon">${icon}</div>
              <div class="text-end">
                <div class="small text-muted">Tipo</div>
                <div class="fw-medium">${d.deviceKind || "—"}</div>
              </div>
            </div>
            <h2 class="h5">${d.name || "(sin nombre)"}</h2>

            <div class="d-flex align-items-center gap-2 mt-2">
              <span class="small text-muted">Estatus:</span>
              ${statusHTML}
            </div>

            <div class="d-flex flex-wrap gap-2 mt-3">
              ${buttons || '<span class="text-muted small">Sin acciones</span>'}
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

  // Event listeners para botones de acción
  gridEl.querySelectorAll("button[data-action]").forEach(btn => {
    btn.addEventListener("click", onActionClick);
  });
}

async function loadDevices() {
  try {
    // TIP: Puedes filtrar por tipo si quieres: ?deviceKind=vent
    const list = await apiGet("");
    // En este proyecto, el recurso es solo "dispositivos", no hay labs.
    // Si en tu recurso tienes mezclados, podrías filtrar aquí por type === "device".
    devices = Array.isArray(list) ? list : [];
    renderDevices(applyFilters(devices));
  } catch (e) {
    console.error(e);
    showToast("Error cargando dispositivos");
  }
}

async function onActionClick(e) {
  const btn = e.currentTarget;
  const id = btn.getAttribute("data-id");
  const action = btn.getAttribute("data-action");

  const dev = devices.find(d => String(d.id) === String(id));
  if (!dev) return;

  // Reglas lógicas simples (ejemplo):
  // - Ventila no puede "abrir" si ya está "abierta"
  // - Pump intensivo bloquea "vent" cerrar (ejemplo de interacción)
  const now = new Date().toISOString();
  let newStatus = action;

  // Normaliza estados
  const s = (dev.status || "").toLowerCase();
  if (dev.deviceKind === "vent") {
    if (action === "abrir" && s.includes("abierta")) {
      showToast("La ventila ya está abierta");
      return;
    }
    if (action === "cerrar" && s.includes("cerrada")) {
      showToast("La ventila ya está cerrada");
      return;
    }
  }

  try {
    const bodyUpdate = {
      status: newStatus,
      lastUpdated: now,
      // Si tu recurso tiene statusLog (array), puedes actualizarlo así:
      // statusLog: [...(dev.statusLog || []).slice(-9), { ts: now, action: newStatus }]
    };
    await apiPut(id, bodyUpdate);
    showToast(`Acción enviada: ${action}`);
    // Refresca el listado para ver el nuevo estado
    await loadDevices();
  } catch (err) {
    console.error(err);
    showToast("No se pudo actualizar el dispositivo");
  }
}

// UI events
searchEl.addEventListener("input", () => renderDevices(applyFilters(devices)));
kindEl.addEventListener("change", () => renderDevices(applyFilters(devices)));
reloadEl.addEventListener("click", loadDevices);

// Polling
function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(loadDevices, POLL_MS);
}
function stopPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
}

// init
loadDevices().then(startPolling);
