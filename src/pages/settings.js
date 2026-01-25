
import { qs } from "../utils.js";
import { getState, setSettings } from "../store.js";
import { toast } from "../components/toast.js";

function applyTheme(accent) {
  // Update some elements that are easy to theme (bars + small accents)
  const bar = qs("#sidebar-storage-bar");
  if (bar) bar.style.background = accent;
}

export function initSettingsPage() {
  const root = qs("#settings-root");
  const st = getState();
  const s = st.settings;

  root.innerHTML = `
    <div class="bg-white border border-gray-200 rounded-2xl p-4">
      <div class="grid grid-cols-2 gap-4">
        <div class="kpi-card">
          <div class="text-sm font-semibold text-gray-800">Hiển thị</div>
          <div class="mt-3 space-y-3">
            <div>
              <label class="text-xs text-gray-500 font-semibold">Tên hệ thống</label>
              <input id="st-title" class="input mt-1" value="${s.system_title}" />
            </div>
            <div>
              <label class="text-xs text-gray-500 font-semibold">Tên khu vực/kho</label>
              <input id="st-warehouse" class="input mt-1" value="${s.warehouse_name}" />
            </div>
            <div>
              <label class="text-xs text-gray-500 font-semibold">Accent color</label>
              <input id="st-accent" class="input mt-1" value="${s.accent_color}" />
              <div class="text-xs text-gray-500 mt-1">Ví dụ: #0284c7</div>
            </div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="text-sm font-semibold text-gray-800">Vận hành</div>
          <div class="mt-3 space-y-3">
            <div>
              <label class="text-xs text-gray-500 font-semibold">Auto refresh (giây)</label>
              <input id="st-refresh" class="input mt-1" type="number" min="2" max="60" value="${s.auto_refresh_sec}" />
            </div>
            <div class="flex items-center justify-between border border-gray-200 rounded-xl p-3">
              <div>
                <div class="text-sm font-semibold text-gray-800">Âm thanh cảnh báo</div>
                <div class="text-xs text-gray-500">Demo bật/tắt</div>
              </div>
              <input id="st-sound" type="checkbox" ${s.alert_sound ? "checked" : ""} />
            </div>

            <div class="border border-gray-200 rounded-xl p-3">
              <div class="text-sm font-semibold text-gray-800">Dung lượng lưu trữ</div>
              <div class="text-xs text-gray-500 mt-1">Thiết lập trong store (demo)</div>
              <div class="mt-2 text-sm text-gray-700">Tổng: ${(s.storage_total_bytes / 1024**4).toFixed(0)} TB</div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-4 flex items-center gap-2">
        <button id="st-save" class="btn btn-primary">Lưu cài đặt</button>
        <button id="st-reset" class="btn btn-secondary">Khôi phục mặc định</button>
        <div class="text-xs text-gray-500 ml-auto">Cài đặt lưu vào localStorage</div>
      </div>
    </div>
  `;

  qs("#st-save")?.addEventListener("click", () => {
    const title = (qs("#st-title").value || "").trim();
    const wh = (qs("#st-warehouse").value || "").trim();
    const accent = (qs("#st-accent").value || "").trim() || "#0284c7";
    const refresh = Math.max(2, Math.min(60, Number(qs("#st-refresh").value) || 5));
    const sound = !!qs("#st-sound").checked;

    setSettings({
      system_title: title || "Hệ Thống Quản Lý Camera",
      warehouse_name: wh || "Camera Nhà Kho",
      accent_color: accent,
      auto_refresh_sec: refresh,
      alert_sound: sound,
    });
    applyTheme(accent);
    toast({ title: "Cài đặt", message: "Đã lưu cài đặt", variant: "success" });
  });

  qs("#st-reset")?.addEventListener("click", () => {
    if (!confirm("Khôi phục mặc định?")) return;
    setSettings({
      system_title: "Hệ Thống Quản Lý Camera",
      warehouse_name: "Camera Nhà Kho",
      accent_color: "#0284c7",
      auto_refresh_sec: 5,
      alert_sound: true,
    });
    toast({ title: "Cài đặt", message: "Đã khôi phục mặc định", variant: "info" });
    initSettingsPage();
  });
}

export function refreshSettings() {
  initSettingsPage();
}