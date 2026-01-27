
import { qs } from "./utils.js";
import { initStore, subscribe, computeCounts, getState } from "./store.js";
import { initRouter, navigate } from "./router.js";
import { initWarehousePage, refreshWarehouse } from "./pages/warehouse.js";
import { initReportsPage, refreshReports } from "./pages/reports.js";
import { initRecordingsPage, refreshRecordings } from "./pages/recordings.js";
import { initAlertsPage, refreshAlerts } from "./pages/alerts.js";
import { initUsersPage, refreshUsers } from "./pages/users.js";
import { initSettingsPage, refreshSettings } from "./pages/settings.js";
import { initDevicesPage, refreshDevices } from "./pages/devices.js";
import { initSupportPage, refreshSupport } from "./pages/support.js";
import { formatDateTime } from "./utils.js";

function updateHeaderClock() {
  qs("#current-time").textContent = formatDateTime(Date.now());
}
setInterval(updateHeaderClock, 1000);

function applySettingsToUI() {
  const st = getState();
  qs("#system-title").textContent = st.settings.system_title || "Hệ Thống Quản Lý Camera";
  qs("#warehouse-title").textContent = st.settings.warehouse_name || "Camera Nhà Kho";
  qs("#system-subtitle").textContent = st.settings.subtitle || "Giám sát an ninh tập trung";
  // basic accent color (sidebar storage bar)
  const bar = qs("#sidebar-storage-bar");
  if (bar) bar.style.background = st.settings.accent_color || "#0284c7";
}

function updateSidebarStats() {
  const c = computeCounts();
  qs("#sidebar-online").textContent = c.online;
  qs("#sidebar-alert").textContent = c.alert;
  qs("#sidebar-offline").textContent = c.offline;

  const usedGB = c.usedBytes / 1024 ** 3;
  const totalGB = c.totalBytes / 1024 ** 3;
  const pct = Math.min(100, Math.round((c.usedBytes / Math.max(1, c.totalBytes)) * 100));
  qs("#sidebar-storage-text").textContent = `${usedGB.toFixed(1)} / ${totalGB.toFixed(0)} GB`;
  qs("#sidebar-storage-bar").style.width = pct + "%";

  const badge = qs("#sidebar-alert-badge");
  if (badge) {
    if (c.alertsOpen > 0) {
      badge.textContent = String(c.alertsOpen);
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  }

  // health indicator
  const dot = qs("#system-health-dot");
  const text = qs("#system-health-text");
  if (c.offline > 0) {
    dot.classList.remove("bg-green-500");
    dot.classList.add("bg-red-500");
    text.textContent = `Có ${c.offline} camera offline`;
  } else {
    dot.classList.remove("bg-red-500");
    dot.classList.add("bg-green-500");
    text.textContent = "Hệ thống hoạt động bình thường";
  }
}

function initAllPages() {
  initWarehousePage();
  initReportsPage();
  initRecordingsPage();
  initAlertsPage();
  initUsersPage();
  initSettingsPage();
  initDevicesPage();
  initSupportPage();
}

function refreshCurrentPage({ page, payload }) {
  // payload used for recordings filter and warehouse open cam
  if (page === "warehouse") {
    refreshWarehouse();
    if (payload?.openCamId) {
      // Open camera modal by simulating click: find card and click
      setTimeout(() => {
        const card = document.querySelector(`[data-cam-index][data-cam-id="${payload.openCamId}"]`);
        // In our implementation cards use data-cam-index only; open handled by warehouse module.
        // We'll just navigate and let user click; keep it simple (no DOM coupling).
      }, 100);
    }
  }
  if (page === "reports") refreshReports();
  if (page === "recordings") refreshRecordings(payload);
  if (page === "alerts") refreshAlerts();
  if (page === "users") refreshUsers();
  if (page === "settings") refreshSettings();
  if (page === "devices") refreshDevices();
  if (page === "support") refreshSupport();
}

function boot() {
  initStore();
  applySettingsToUI();
  updateSidebarStats();
  updateHeaderClock();

  // optional ElementSDK integration (won't crash if missing)
  try {
    if (window.elementSdk?.init) {
      window.elementSdk.init({
        defaultConfig: {},
        onConfigChange: (cfg) => {
          // You can map element SDK config into settings if needed later
          console.log("elementSdk config:", cfg);
        },
      });
    }
  } catch {}

  initAllPages();

  initRouter({
    onNavigate: ({ page, payload }) => {
      refreshCurrentPage({ page, payload });
    },
  });

  // Hash navigation
  const hash = (location.hash || "").replace("#", "");
  if (hash) navigate(hash, { silent: true });
}

subscribe(() => {
  applySettingsToUI();
  updateSidebarStats();
});

boot();