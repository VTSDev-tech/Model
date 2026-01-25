// Default configuration
const defaultConfig = {
  system_title: "Hệ Thống Quản Lý Camera",
  warehouse_name: "Camera Nhà Kho",
  primary_color: "#0284c7",
  background_color: "#f9fafb",
  text_color: "#1f2937",
  surface_color: "#ffffff",
  accent_color: "#0ea5e9",
};

// Camera data
const cameras = [
  {
    id: "CAM-001",
    name: "Cổng chính",
    location: "Lối vào",
    status: "online",
  },
  {
    id: "CAM-002",
    name: "Khu A1",
    location: "Hàng nhập",
    status: "online",
  },
  {
    id: "CAM-003",
    name: "Khu A2",
    location: "Hàng nhập",
    status: "online",
  },
  {
    id: "CAM-004",
    name: "Khu B1",
    location: "Hàng xuất",
    status: "online",
  },
  {
    id: "CAM-005",
    name: "Khu B2",
    location: "Hàng xuất",
    status: "offline",
  },
  {
    id: "CAM-006",
    name: "Khu C1",
    location: "Lưu trữ",
    status: "alert",
    alertType: "Phát hiện người lạ",
  },
  {
    id: "CAM-007",
    name: "Khu C2",
    location: "Lưu trữ",
    status: "online",
  },
  {
    id: "CAM-008",
    name: "Khu C3",
    location: "Lưu trữ",
    status: "offline",
  },
  {
    id: "CAM-009",
    name: "Sân bốc dỡ",
    location: "Ngoài trời",
    status: "online",
  },
  {
    id: "CAM-010",
    name: "Văn phòng kho",
    location: "Tầng 1",
    status: "online",
  },
  {
    id: "CAM-011",
    name: "Cổng phụ",
    location: "Lối ra",
    status: "online",
  },
  {
    id: "CAM-012",
    name: "Hành lang",
    location: "Kết nối",
    status: "online",
  },
];

// Demo vehicle/traffic videos (public domain / Wikimedia Commons)
const DEMO_VIDEOS = [
  "https://upload.wikimedia.org/wikipedia/commons/transcoded/7/70/Street_traffic.webm/Street_traffic.webm.360p.webm",
  "https://upload.wikimedia.org/wikipedia/commons/transcoded/6/68/Avtocesta.webm/Avtocesta.webm.360p.webm",
  "https://upload.wikimedia.org/wikipedia/commons/transcoded/f/fa/Cars_Passing_by_at_Night.webm/Cars_Passing_by_at_Night.webm.360p.webm",
  "https://upload.wikimedia.org/wikipedia/commons/transcoded/7/78/Alaskan_Way_Viaduct_timelapse.webm/Alaskan_Way_Viaduct_timelapse.webm.480p.vp9.webm",
];

function getDemoVideo(index) {
  return DEMO_VIDEOS[index % DEMO_VIDEOS.length];
}

// Generate camera cards
function generateCameraGrid() {
  const grid = document.getElementById("camera-grid");
  grid.innerHTML = cameras
    .map(
      (cam, index) => `
        <div class="camera-card bg-white rounded-xl overflow-hidden border ${cam.status === "alert" ? "camera-alert border-gray-200" : cam.status === "offline" ? "border-gray-300" : "border-gray-200"} cursor-pointer" data-cam-index="${index}">
          <div class="camera-feed aspect-video relative ${cam.status === "offline" ? "opacity-60" : ""}">
            ${cam.status === "alert" ? '<div class="alert-overlay absolute inset-0 z-10"></div>' : ""}
            ${cam.status === "offline" ? '<div class="absolute inset-0 bg-gray-900/80 z-10"></div>' : ""}
            ${
              cam.status === "offline"
                ? `
            <div class="absolute inset-0 flex items-center justify-center z-20">
              <div class="text-center">
                <svg class="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"/>
                </svg>
                <p class="text-gray-300 text-sm font-medium">Mất kết nối</p>
              </div>
            </div>
              `
                : `
            <video class="camera-video" autoplay muted loop playsinline preload="metadata" src="${getDemoVideo(index)}"></video>
              `
            }
            ${
              cam.status !== "offline"
                ? `
            <div class="absolute top-2 left-2 flex items-center gap-1.5 bg-black/50 px-2 py-1 rounded text-xs text-white z-20">
              <span class="recording-dot w-2 h-2 bg-red-500 rounded-full"></span>
              REC
            </div>
            `
                : ""
            }
            <div class="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded text-xs text-white font-mono z-20">
              ${cam.id}
            </div>
            ${
              cam.status !== "offline"
                ? `
            <div class="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white font-mono z-20" id="time-${cam.id}">
              ${getCurrentTime()}
            </div>
            <div class="absolute bottom-2 right-2 flex items-center gap-1 ${cam.status === "alert" ? "bg-red-600" : "bg-black/50"} px-2 py-1 rounded text-xs ${cam.status === "alert" ? "text-white" : "text-green-400"} z-20">
              <span class="w-1.5 h-1.5 ${cam.status === "alert" ? "bg-white" : "bg-green-400"} rounded-full"></span>
              ${cam.status === "alert" ? "CẢNH BÁO" : "LIVE"}
            </div>
            `
                : `
            <div class="absolute bottom-2 right-2 flex items-center gap-1 bg-gray-600 px-2 py-1 rounded text-xs text-gray-300 z-20">
              <span class="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
              OFFLINE
            </div>
            `
            }
          </div>
          <div class="p-3 ${cam.status === "alert" ? "bg-red-50" : cam.status === "offline" ? "bg-gray-50" : ""}">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <h4 class="font-medium ${cam.status === "alert" ? "text-red-800" : cam.status === "offline" ? "text-gray-500" : "text-gray-800"} text-sm">${cam.name}</h4>
                <p class="text-xs ${cam.status === "alert" ? "text-red-600" : cam.status === "offline" ? "text-gray-400" : "text-gray-500"}">${cam.location}</p>
                ${
                  cam.status === "alert" && cam.alertType
                    ? `
                  <div class="mt-1.5 flex items-center gap-1">
                    <svg class="w-3 h-3 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                    <span class="text-xs font-medium text-red-600">${cam.alertType}</span>
                  </div>
                `
                    : ""
                }
              </div>
              <button class="p-1.5 hover:bg-gray-100 rounded-lg transition flex-shrink-0" title="Xem chi tiết">
                <svg class="w-4 h-4 ${cam.status === "alert" ? "text-red-600" : cam.status === "offline" ? "text-gray-400" : "text-gray-500"}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `,
    )
    .join("");
}

// Get current time formatted
function getCurrentTime() {
  const now = new Date();
  return now.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// Update time displays
function updateTimes() {
  const time = getCurrentTime();
  const currentTimeEl = document.getElementById("current-time");
  if (currentTimeEl) currentTimeEl.textContent = time;

  cameras.forEach((cam) => {
    const el = document.getElementById(`time-${cam.id}`);
    if (el) el.textContent = time;
  });

  const modal = document.getElementById("camera-modal");
  if (modal && modal.classList.contains("active")) {
    const mt = document.getElementById("modal-time");
    if (mt) mt.textContent = time;
  }
}

// Page navigation
function showPage(page) {
  // Hide all pages
  document.getElementById("warehouse-page").classList.add("hidden");
  document.getElementById("departments-page").classList.add("hidden");
  document.getElementById("parking-page").classList.add("hidden");

  // Remove active from all sidebar items
  document.querySelectorAll(".sidebar-item").forEach((item) => {
    item.classList.remove("active");
    const svg = item.querySelector("svg");
    const span = item.querySelector("span");
    if (svg) svg.classList.remove("text-sky-600");
    if (svg) svg.classList.add("text-gray-500");
    if (span) span.classList.remove("text-sky-700");
  });

  // Show selected page and activate button
  document.getElementById(`${page}-page`).classList.remove("hidden");

  const btnMap = {
    warehouse: document.getElementById("warehouse-btn"),
    departments: document.querySelectorAll(".sidebar-item")[0],
    parking: document.querySelectorAll(".sidebar-item")[1],
  };

  const activeBtn = btnMap[page];
  if (activeBtn) {
    activeBtn.classList.add("active");
    const svg = activeBtn.querySelector("svg");
    const span = activeBtn.querySelector("span");
    if (svg) {
      svg.classList.remove("text-gray-500");
      svg.classList.add("text-sky-600");
    }
    if (span) span.classList.add("text-sky-700");
  }
}

// Config change handler
async function onConfigChange(config) {
  const systemTitle = document.getElementById("system-title");
  const warehouseTitle = document.getElementById("warehouse-title");
  
  if (systemTitle) systemTitle.textContent = config.system_title || defaultConfig.system_title;
  if (warehouseTitle) warehouseTitle.textContent = config.warehouse_name || defaultConfig.warehouse_name;
}

// Map to capabilities
function mapToCapabilities(config) {
  return {
    recolorables: [],
    borderables: [],
    fontEditable: undefined,
    fontSizeable: undefined,
  };
}

// Map to edit panel values
function mapToEditPanelValues(config) {
  return new Map([
    ["system_title", config.system_title || defaultConfig.system_title],
    ["warehouse_name", config.warehouse_name || defaultConfig.warehouse_name],
  ]);
}

// ========= Camera Zoom Modal =========
function ensureModalElements() {
  return {
    modal: document.getElementById("camera-modal"),
    closeBtn: document.getElementById("cam-modal-close"),
    nameEl: document.getElementById("modal-cam-name"),
    metaEl: document.getElementById("modal-cam-meta"),
    videoEl: document.getElementById("modal-video"),
    offlineEl: document.getElementById("modal-offline"),
    timeEl: document.getElementById("modal-time"),
    statusEl: document.getElementById("modal-status"),
  };
}

function openCameraModal(camIndex) {
  const cam = cameras[camIndex];
  const els = ensureModalElements();
  if (!els.modal || !cam) return;

  // Title
  els.nameEl.textContent = `${cam.id} - ${cam.name}`;
  const statusText =
    cam.status === "alert"
      ? "CẢNH BÁO"
      : cam.status === "offline"
        ? "OFFLINE"
        : "LIVE";
  els.metaEl.textContent = `${cam.location} • ${statusText}`;

  // Time / status chips
  const now = getCurrentTime();
  els.timeEl.textContent = now;

  els.statusEl.textContent = statusText;
  els.statusEl.classList.remove("is-live", "is-alert", "is-offline");
  els.statusEl.classList.add(
    cam.status === "alert"
      ? "is-alert"
      : cam.status === "offline"
        ? "is-offline"
        : "is-live",
  );

  // Video / offline
  if (cam.status === "offline") {
    if (els.videoEl) {
      els.videoEl.pause();
      els.videoEl.removeAttribute("src");
      els.videoEl.load();
      els.videoEl.classList.add("hidden");
    }
    if (els.offlineEl) els.offlineEl.classList.remove("hidden");
  } else {
    if (els.offlineEl) els.offlineEl.classList.add("hidden");
    if (els.videoEl) {
      els.videoEl.classList.remove("hidden");
      els.videoEl.src = getDemoVideo(camIndex);
      const p = els.videoEl.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }
  }

  // Show
  els.modal.classList.add("active");
  els.modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeCameraModal() {
  const els = ensureModalElements();
  if (!els.modal) return;

  els.modal.classList.remove("active");
  els.modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");

  // Stop video to save CPU
  if (els.videoEl) {
    els.videoEl.pause();
    els.videoEl.removeAttribute("src");
    els.videoEl.load();
  }
}

function wireCameraCardClicks() {
  document.querySelectorAll(".camera-card").forEach((card) => {
    card.addEventListener("click", () => {
      const idx = Number(card.getAttribute("data-cam-index"));
      if (!Number.isNaN(idx)) openCameraModal(idx);
    });
  });

  const els = ensureModalElements();
  if (els.closeBtn) els.closeBtn.addEventListener("click", closeCameraModal);

  if (els.modal) {
    els.modal.addEventListener("click", (e) => {
      if (
        e.target === els.modal ||
        (e.target && e.target.dataset && e.target.dataset.close)
      ) {
        closeCameraModal();
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeCameraModal();
  });
}

// Initialize
generateCameraGrid();
wireCameraCardClicks();
updateTimes();
setInterval(updateTimes, 1000);

// Initialize Element SDK
if (window.elementSdk) {
  window.elementSdk.init({
    defaultConfig,
    onConfigChange,
    mapToCapabilities,
    mapToEditPanelValues,
  });
}

// Cloudflare / System Helper Script
(function () {
  function c() {
    var b = a.contentDocument || a.contentWindow.document;
    if (b) {
      var d = b.createElement("script");
      d.innerHTML =
        "window.__CF$cv$params={r:'9c03278267bde2f0',t:'MTc2ODc5MjM4Ny4wMDAwMDA='};var a=document.createElement('script');a.nonce='';a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);";
      b.getElementsByTagName("head")[0].appendChild(d);
    }
  }
  if (document.body) {
    var a = document.createElement("iframe");
    a.height = 1;
    a.width = 1;
    a.style.position = "absolute";
    a.style.top = 0;
    a.style.left = 0;
    a.style.border = "none";
    a.style.visibility = "hidden";
    document.body.appendChild(a);
    if ("loading" !== document.readyState) c();
    else if (window.addEventListener)
      document.addEventListener("DOMContentLoaded", c);
    else {
      var e = document.onreadystatechange || function () {};
      document.onreadystatechange = function (b) {
        e(b);
        "loading" !== document.readyState &&
          ((document.onreadystatechange = e), c());
      };
    }
  }
})();