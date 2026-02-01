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

// --- XỬ LÝ DỌN DẸP DỮ LIỆU ---
window.handleClearAlerts = function() {
    if (confirm("Bạn có chắc chắn muốn xóa sạch toàn bộ lịch sử cảnh báo?")) {
        // Xóa LocalStorage
        localStorage.removeItem('thu_alerts');
        localStorage.removeItem('camera_alerts');
        
        // Thay vì reload(), ta nên reset Store nếu store.js hỗ trợ
        // Ở đây tạm thời dùng reload để đảm bảo sạch triệt để các biến global
        window.location.reload();
    }
};

// --- CẬP NHẬT ĐỒNG HỒ ---
function updateHeaderClock() {
    const el = qs("#current-time");
    if (el) el.textContent = formatDateTime(Date.now());
}
setInterval(updateHeaderClock, 1000);

// --- CẬP NHẬT UI THEO SETTINGS ---
function applySettingsToUI() {
    const st = getState();
    if (!st.settings) return;

    if (qs("#system-title")) qs("#system-title").textContent = st.settings.system_title || "ORANGE MANAGEMENT";
    if (qs("#warehouse-title")) qs("#warehouse-title").textContent = st.settings.warehouse_name || "Camera Nhà Kho";
    if (qs("#system-subtitle")) qs("#system-subtitle").textContent = st.settings.subtitle || "Giám sát an ninh tập trung";
    
    const bar = qs("#sidebar-storage-bar");
    if (bar) bar.style.background = st.settings.accent_color || "#0284c7";
}

// --- CẬP NHẬT TRẠNG THÁI SIDEBAR & HỆ THỐNG ---
function updateSidebarStats() {
    const c = computeCounts();
    
    // Cập nhật số lượng camera theo trạng thái
    if (qs("#sidebar-online")) qs("#sidebar-online").textContent = c.online;
    if (qs("#sidebar-alert")) qs("#sidebar-alert").textContent = c.alert;
    if (qs("#sidebar-offline")) qs("#sidebar-offline").textContent = c.offline;

    // Cập nhật dung lượng
    const usedGB = c.usedBytes / 1024 ** 3;
    const totalGB = c.totalBytes / 1024 ** 3;
    const pct = Math.min(100, Math.round((c.usedBytes / Math.max(1, c.totalBytes)) * 100));
    
    if (qs("#sidebar-storage-text")) qs("#sidebar-storage-text").textContent = `${usedGB.toFixed(1)} / ${totalGB.toFixed(0)} GB`;
    if (qs("#sidebar-storage-bar")) qs("#sidebar-storage-bar").style.width = pct + "%";

    // Cập nhật Badge cảnh báo đỏ ở sidebar
    const badge = qs("#sidebar-alert-badge");
    if (badge) {
        if (c.alertsOpen > 0) {
            badge.textContent = String(c.alertsOpen);
            badge.classList.remove("hidden");
        } else {
            badge.classList.add("hidden");
        }
    }

    // Cập nhật đèn tín hiệu sức khỏe hệ thống
    const dot = qs("#system-health-dot");
    const text = qs("#system-health-text");
    if (dot && text) {
        if (c.offline > 0) {
            dot.className = "w-2 h-2 bg-red-500 rounded-full animate-pulse";
            text.textContent = `Có ${c.offline} camera mất kết nối`;
        } else {
            dot.className = "w-2 h-2 bg-green-500 rounded-full";
            text.textContent = "Hệ thống hoạt động bình thường";
        }
    }
}

// --- KHỞI TẠO CÁC TRANG ---
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

// --- REFRESH DỮ LIỆU KHI CHUYỂN TRANG ---
function refreshCurrentPage({ page, payload }) {
    switch (page) {
        case "warehouse":
            refreshWarehouse();
            break;
        case "reports": refreshReports(); break;
        case "recordings": refreshRecordings(payload); break;
        case "alerts": refreshAlerts(); break;
        case "users": refreshUsers(); break;
        case "settings": refreshSettings(); break;
        case "devices": refreshDevices(); break;
        case "support": refreshSupport(); break;
    }
}

// --- BOOTSTRAP ---
function boot() {
    initStore(); // Load dữ liệu từ localStorage vào bộ nhớ
    applySettingsToUI();
    updateSidebarStats();
    updateHeaderClock();

    initAllPages();

    // Khởi tạo Router
    initRouter({
        onNavigate: ({ page, payload }) => {
            refreshCurrentPage({ page, payload });
        },
    });

    // Kiểm tra URL hash để điều hướng đúng trang khi F5
    const hash = (location.hash || "").replace("#", "");
    if (hash) {
        navigate(hash, { silent: true });
    } else {
        navigate("warehouse", { silent: true }); // Mặc định vào kho
    }
}

// Đăng ký lắng nghe thay đổi từ Store để cập nhật UI tự động
subscribe(() => {
    applySettingsToUI();
    updateSidebarStats();
});

// Chạy hệ thống
boot();