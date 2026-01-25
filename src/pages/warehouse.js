
import { qs, qsa, formatDateTime } from "../utils.js";
import { getState, computeCounts, trafficVideoForIndex } from "../store.js";
import { openModal, closeModal, wireModal } from "../components/modal.js";
import { toast } from "../components/toast.js";
import { navigate } from "../router.js";

let selectedCamIndex = 0;

function chipForStatus(status) {
  if (status === "offline") return '<span class="chip chip-offline">OFFLINE</span>';
  if (status === "alert") return '<span class="chip chip-alert">ALERT</span>';
  return '<span class="chip chip-live">LIVE</span>';
}

function renderZoneOptions() {
  const { cameras } = getState();
  const zones = Array.from(new Set(cameras.map((c) => c.zone))).sort();
  const sel = qs("#warehouse-zone-filter");
  if (!sel) return;
  sel.innerHTML = `<option value="all">Tất cả khu vực</option>` + zones.map((z) => `<option value="${z}">${z}</option>`).join("");
}

function renderGrid() {
  const { cameras } = getState();
  const grid = qs("#camera-grid");
  const zone = qs("#warehouse-zone-filter")?.value || "all";
  if (!grid) return;

  const filtered = zone === "all" ? cameras : cameras.filter((c) => c.zone === zone);

  grid.innerHTML = filtered.map((cam, i) => {
    const idx = cameras.findIndex((x) => x.id === cam.id);
    const isOffline = cam.status === "offline";
    const isAlert = cam.status === "alert";

    return `
      <div class="camera-card bg-white rounded-xl overflow-hidden border ${isAlert ? "camera-alert border-gray-200" : isOffline ? "border-gray-300" : "border-gray-200"} cursor-pointer"
           data-cam-index="${idx}">
        <div class="camera-feed aspect-video relative ${isOffline ? "opacity-60" : ""}">
          ${isAlert ? '<div class="alert-overlay absolute inset-0 z-10"></div>' : ""}
          ${isOffline ? '<div class="absolute inset-0 bg-gray-900/80 z-10"></div>' : ""}

          ${!isOffline ? `<video class="camera-video" autoplay muted loop playsinline preload="metadata" src="${trafficVideoForIndex(idx)}"></video>` : ""}

          ${isOffline ? `
            <div class="absolute inset-0 flex items-center justify-center z-20">
              <div class="text-center">
                <svg class="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"/>
                </svg>
                <p class="text-gray-300 text-sm font-medium">Mất kết nối</p>
              </div>
            </div>
          ` : ""}

          ${!isOffline ? `
            <div class="absolute top-2 left-2 flex items-center gap-1.5 bg-black/50 px-2 py-1 rounded text-xs text-white z-20">
              <span class="recording-dot w-2 h-2 bg-red-500 rounded-full"></span>REC
            </div>
          ` : ""}

          <div class="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded text-xs text-white font-mono z-20">${cam.id}</div>

          <div class="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white font-mono z-20">
            <span class="cam-ts" data-cam-index="${idx}">${formatDateTime(Date.now())}</span>
          </div>

          <div class="absolute bottom-2 right-2 z-20">
            ${isOffline ? '<span class="chip chip-offline">OFFLINE</span>' : isAlert ? '<span class="chip chip-alert">CẢNH BÁO</span>' : '<span class="chip chip-live">LIVE</span>'}
          </div>
        </div>

        <div class="p-3 ${isAlert ? "bg-red-50" : isOffline ? "bg-gray-50" : ""}">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <h4 class="font-medium ${isAlert ? "text-red-800" : isOffline ? "text-gray-500" : "text-gray-800"} text-sm">${cam.name}</h4>
              <p class="text-xs ${isAlert ? "text-red-600" : isOffline ? "text-gray-400" : "text-gray-500"}">${cam.location}</p>

              ${isAlert && cam.alertType ? `
                <div class="mt-1.5 flex items-center gap-1">
                  <span class="badge-dot badge-red"></span>
                  <span class="text-xs font-medium text-red-600">${cam.alertType}</span>
                </div>
              ` : ""}
            </div>

            <button class="p-1.5 hover:bg-gray-100 rounded-lg transition flex-shrink-0" title="Phóng to">
              <svg class="w-4 h-4 ${isAlert ? "text-red-600" : isOffline ? "text-gray-400" : "text-gray-500"}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  // wire click open modal
  qsa(".camera-card", grid).forEach((card) => {
    card.addEventListener("click", () => {
      const idx = Number(card.getAttribute("data-cam-index"));
      if (!Number.isNaN(idx)) openCameraModal(idx);
    });
  });
}

function updateTsInGrid() {
  qsa(".cam-ts").forEach((el) => {
    el.textContent = formatDateTime(Date.now());
  });
}

function openCameraModal(idx) {
  const { cameras } = getState();
  const cam = cameras[idx];
  if (!cam) return;
  selectedCamIndex = idx;

  qs("#modal-cam-name").textContent = `${cam.id} - ${cam.name}`;
  qs("#modal-cam-meta").textContent = `${cam.zone} • ${cam.location}`;
  qs("#modal-time").textContent = formatDateTime(Date.now());

  const badge = qs("#modal-status");
  const statusText = cam.status === "alert" ? "CẢNH BÁO" : cam.status === "offline" ? "OFFLINE" : "LIVE";
  badge.textContent = statusText;
  badge.classList.remove("is-live", "is-alert", "is-offline");
  badge.classList.add(cam.status === "alert" ? "is-alert" : cam.status === "offline" ? "is-offline" : "is-live");

  const video = qs("#modal-video");
  const offline = qs("#modal-offline");
  if (cam.status === "offline") {
    video.pause();
    video.removeAttribute("src");
    video.load();
    video.classList.add("hidden");
    offline.classList.remove("hidden");
  } else {
    offline.classList.add("hidden");
    video.classList.remove("hidden");
    video.src = trafficVideoForIndex(idx);
    video.play().catch(() => {});
  }

  openModal("#camera-modal");
}

function closeCameraModal() {
  const video = qs("#modal-video");
  if (video) {
    video.pause();
    video.removeAttribute("src");
    video.load();
  }
  closeModal("#camera-modal");
}

function wireModalActions() {
  wireModal("#camera-modal", { onClose: closeCameraModal });
  qs("#cam-modal-close")?.addEventListener("click", closeCameraModal);

  qs("#modal-open-recordings")?.addEventListener("click", () => {
    // Jump to recordings page with payload: camera filter
    const { cameras } = getState();
    const cam = cameras[selectedCamIndex];
    if (!cam) return;
    closeCameraModal();
    toast({ title: "Lịch sử ghi hình", message: `Đang lọc theo ${cam.id}` , variant:"info" });
    navigate("recordings", { payload: { camId: cam.id }});
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeCameraModal();
  });

  qs("#warehouse-fullscreen")?.addEventListener("click", () => {
    const el = document.documentElement;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  });
}

function renderCounts() {
  const c = computeCounts();
  qs("#warehouse-online").textContent = c.online;
  qs("#warehouse-alert").textContent = c.alert;
  qs("#warehouse-offline").textContent = c.offline;

  // storage
  const usedGB = (c.usedBytes / 1024 ** 3);
  const totalGB = (c.totalBytes / 1024 ** 3);
  qs("#warehouse-storage").textContent = `${usedGB.toFixed(1)} GB / ${totalGB.toFixed(0)} GB`;
}

export function initWarehousePage() {
  renderZoneOptions();
  renderGrid();
  renderCounts();
  wireModalActions();

  qs("#warehouse-zone-filter")?.addEventListener("change", () => {
    renderGrid();
  });

  setInterval(updateTsInGrid, 1000);
}

export function refreshWarehouse() {
  renderZoneOptions();
  renderGrid();
  renderCounts();
}