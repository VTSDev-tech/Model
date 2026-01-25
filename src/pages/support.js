
import { qs } from "../utils.js";
import { getState, resetDemoData } from "../store.js";
import { downloadText } from "../utils.js";
import { toast } from "../components/toast.js";

export function initSupportPage() {
  const root = qs("#support-root");
  const st = getState();

  root.innerHTML = `
    <div class="grid grid-cols-3 gap-4">
      <div class="col-span-2 bg-white border border-gray-200 rounded-2xl p-4">
        <div class="text-sm font-semibold text-gray-800">FAQ</div>
        <div class="mt-3 space-y-3">
          <details class="border border-gray-200 rounded-xl p-3">
            <summary class="font-semibold text-gray-800 cursor-pointer">Vì sao cần Live Server?</summary>
            <div class="text-sm text-gray-600 mt-2">Vì project dùng ES Modules (import/export). Mở file trực tiếp sẽ bị chặn CORS.</div>
          </details>
          <details class="border border-gray-200 rounded-xl p-3">
            <summary class="font-semibold text-gray-800 cursor-pointer">Video demo xe cộ lấy từ đâu?</summary>
            <div class="text-sm text-gray-600 mt-2">Dùng video public từ Wikimedia (mp4). Bạn có thể thay link trong store.</div>
          </details>
          <details class="border border-gray-200 rounded-xl p-3">
            <summary class="font-semibold text-gray-800 cursor-pointer">Làm sao để lên camera thật RTSP?</summary>
            <div class="text-sm text-gray-600 mt-2">Browser không phát trực tiếp RTSP. Cần gateway như WebRTC (MediaMTX) hoặc HLS. Mình có thể hướng dẫn phần này khi bạn sẵn sàng.</div>
          </details>
        </div>

        <div class="divider my-4"></div>

        <div class="text-sm font-semibold text-gray-800">Thông tin hệ thống</div>
        <div class="mt-2 grid grid-cols-3 gap-3 text-sm">
          <div class="kpi-card">
            <div class="kpi-title">Camera</div>
            <div class="kpi-value text-base">${st.cameras.length}</div>
            <div class="kpi-sub">demo</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Bản ghi</div>
            <div class="kpi-value text-base">${st.recordings.length}</div>
            <div class="kpi-sub">demo</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Cảnh báo</div>
            <div class="kpi-value text-base">${st.alerts.length}</div>
            <div class="kpi-sub">demo</div>
          </div>
        </div>
      </div>

      <div class="bg-white border border-gray-200 rounded-2xl p-4">
        <div class="text-sm font-semibold text-gray-800">Hành động</div>
        <div class="text-xs text-gray-500 mt-1">Export logs / reset demo</div>

        <button id="export-logs" class="btn btn-secondary w-full mt-3">Export logs (JSON)</button>
        <button id="reset-demo" class="btn btn-danger w-full mt-2">Reset demo data</button>

        <div class="divider my-4"></div>

        <div class="text-sm font-semibold text-gray-800">Liên hệ</div>
        <div class="mt-2 text-sm text-gray-600">
          Email: <b>support@warehouse.vn</b><br/>
          Hotline: <b>1900-0000</b><br/>
          Giờ làm việc: 08:00 - 18:00
        </div>

        <div class="mt-4 p-3 bg-sky-50 border border-sky-200 rounded-xl text-sm text-sky-900">
          Tip: Khi triển khai thật, nên có module log + audit trail cho mọi thao tác (ack/resolve/user changes).
        </div>
      </div>
    </div>
  `;

  qs("#export-logs")?.addEventListener("click", () => {
    const st = getState();
    downloadText("warehouse_camera_logs.json", JSON.stringify(st, null, 2), "application/json");
    toast({ title: "Export", message: "Đã tải logs (JSON)", variant: "success" });
  });

  qs("#reset-demo")?.addEventListener("click", () => {
    if (!confirm("Reset demo data? (sẽ xoá localStorage)")) return;
    resetDemoData();
    toast({ title: "Reset", message: "Đã reset demo data. Refresh trang để thấy dữ liệu mới.", variant: "info", timeout: 3000 });
  });
}

export function refreshSupport() {
  initSupportPage();
}