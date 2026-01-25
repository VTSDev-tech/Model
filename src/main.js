

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
  const clockEl = qs("#current-time");
  if (clockEl) clockEl.textContent = formatDateTime(Date.now());
}
setInterval(updateHeaderClock, 1000);


function applySettingsToUI() {
  const st = getState();
  if (!st) return; 

  qs("#system-title").textContent = st.settings?.system_title || "Hệ Thống Quản Lý Camera";
  qs("#warehouse-title").textContent = st.settings?.warehouse_name || "Camera Nhà Kho";
  qs("#system-subtitle").textContent = st.settings?.subtitle || "Giám sát an ninh tập trung";


  const bar = qs("#sidebar-storage-bar");
  if (bar && bar.style) {
    bar.style.background = st.settings?.accent_color || "#0284c7";
  }
}


function updateSidebarStats() {
  const c = computeCounts();
  if (!c) return;

  qs("#sidebar-online").textContent = c.online;
  qs("#sidebar-alert").textContent = c.alert;
  qs("#sidebar-offline").textContent = c.offline;

  const usedGB = c.usedBytes / 1024 ** 3;
  const totalGB = c.totalBytes / 1024 ** 3;
  const pct = Math.min(100, Math.round((c.usedBytes / Math.max(1, c.totalBytes)) * 100));
  
  qs("#sidebar-storage-text").textContent = `${usedGB.toFixed(1)} / ${totalGB.toFixed(0)} GB`;
  
  const storageBar = qs("#sidebar-storage-bar");
  if (storageBar && storageBar.style) {
    storageBar.style.width = pct + "%";
  }

  const badge = qs("#sidebar-alert-badge");
  if (badge) {
    if (c.alertsOpen > 0) {
      badge.textContent = String(c.alertsOpen);
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  }


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

  try { initWarehousePage?.(); } catch (e) { console.error("Lỗi Warehouse Page:", e); }
  try { initReportsPage?.(); } catch (e) { console.error("Lỗi Reports Page:", e); }
  try { initRecordingsPage?.(); } catch (e) { console.error("Lỗi Recordings Page:", e); }
  try { initAlertsPage?.(); } catch (e) { console.error("Lỗi Alerts Page:", e); }
  try { initUsersPage?.(); } catch (e) { console.error("Lỗi Users Page:", e); }
  try { initSettingsPage?.(); } catch (e) { console.error("Lỗi Settings Page:", e); }
  try { initDevicesPage?.(); } catch (e) { console.error("Lỗi Devices Page:", e); }
  try { initSupportPage?.(); } catch (e) { console.error("Lỗi Support Page:", e); }
}


function refreshCurrentPage({ page, payload }) {
  if (page === "warehouse") {
    refreshWarehouse?.();
    if (payload?.openCamId) {
      setTimeout(() => {
        const card = document.querySelector(`[data-cam-index][data-cam-id="${payload.openCamId}"]`);
        card?.click();
      }, 100);
    }
  }
  if (page === "reports")    refreshReports?.();
  if (page === "recordings") refreshRecordings?.(payload);
  if (page === "alerts")     refreshAlerts?.();
  if (page === "users")      refreshUsers?.();
  if (page === "settings")   refreshSettings?.();
  if (page === "devices")    refreshDevices?.();
  if (page === "support")    refreshSupport?.();
}


function boot() {

  initStore(); 
  

  applySettingsToUI();
  updateSidebarStats();
  updateHeaderClock();


  console.log("Hệ thống khởi động...");


  initAllPages();


  initRouter({
    onNavigate: ({ page, payload }) => {
      refreshCurrentPage({ page, payload });
    },
  });


  const hash = (location.hash || "").replace("#", "");
  if (hash) navigate(hash, { silent: true });
}


subscribe(() => {
  applySettingsToUI();
  updateSidebarStats();
});

// Khởi động
boot();