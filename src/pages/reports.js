
import { qs } from "../utils.js";
import { getState, computeCounts } from "../store.js";
import { formatBytes, formatDate } from "../utils.js";

function renderMiniChart(days, countsPerDay) {
  const max = Math.max(1, ...countsPerDay.map((x) => x.alerts));
  return `
    <div class="bg-white border border-gray-200 rounded-2xl p-4">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm font-semibold text-gray-800">Cảnh báo theo ngày (7 ngày)</div>
          <div class="text-xs text-gray-500 mt-1">Dựa trên dữ liệu demo trong localStorage</div>
        </div>
      </div>
      <div class="mt-4 grid grid-cols-7 gap-2 items-end" style="height:140px">
        ${countsPerDay.map((d) => {
          const h = Math.round((d.alerts / max) * 100);
          return `
            <div class="flex flex-col items-center gap-2">
              <div class="w-full rounded-lg bg-sky-600/15 relative overflow-hidden" style="height:120px">
                <div class="absolute bottom-0 left-0 right-0 bg-sky-600 rounded-lg" style="height:${h}%;"></div>
              </div>
              <div class="text-[11px] text-gray-500">${d.label}</div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

export function initReportsPage() {
  const root = qs("#reports-root");
  if (!root) return;

  const st = getState();
  const counts = computeCounts();

  // aggregate: alerts per day (last 7 days)
  const now = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400_000);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const end = start + 86400_000;
    const alerts = st.alerts.filter((a) => a.ts >= start && a.ts < end).length;
    days.push({ label: `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`, alerts });
  }

  const used = counts.usedBytes;
  const total = counts.totalBytes;
  const usedPct = Math.min(100, Math.round((used / Math.max(1, total)) * 100));

  root.innerHTML = `
    <div class="grid grid-cols-4 gap-4">
      <div class="kpi-card">
        <div class="kpi-title">Tổng camera</div>
        <div class="kpi-value">${st.cameras.length}</div>
        <div class="kpi-sub">Online: ${counts.online} • Offline: ${counts.offline}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Cảnh báo đang mở</div>
        <div class="kpi-value">${counts.alertsOpen}</div>
        <div class="kpi-sub">Chưa xử lý / đã xác nhận</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Dung lượng đã dùng</div>
        <div class="kpi-value">${formatBytes(used)}</div>
        <div class="kpi-sub">${usedPct}% / ${formatBytes(total)}</div>
        <div class="mt-3 mini-bar"><div style="width:${usedPct}%"></div></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Bản ghi (demo)</div>
        <div class="kpi-value">${st.recordings.length}</div>
        <div class="kpi-sub">Trong 7 ngày gần nhất</div>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-4 mt-4">
      <div class="col-span-2">
        ${renderMiniChart(days.length, days)}
      </div>
      <div class="bg-white border border-gray-200 rounded-2xl p-4">
        <div class="text-sm font-semibold text-gray-800">Tình trạng theo khu vực</div>
        <div class="text-xs text-gray-500 mt-1">Tổng hợp từ danh sách camera</div>

        <div class="mt-4 space-y-3">
          ${Array.from(new Set(st.cameras.map((c) => c.zone))).sort().map((z) => {
            const cams = st.cameras.filter((c) => c.zone === z);
            const online = cams.filter((c) => c.status === "online").length;
            const alert = cams.filter((c) => c.status === "alert").length;
            const offline = cams.filter((c) => c.status === "offline").length;
            return `
              <div class="border border-gray-200 rounded-xl p-3">
                <div class="flex items-center justify-between">
                  <div class="font-semibold text-gray-800 text-sm">${z}</div>
                  <div class="text-xs text-gray-500">${cams.length} camera</div>
                </div>
                <div class="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div class="rounded-lg bg-green-50 text-green-700 px-2 py-1">Online: <b>${online}</b></div>
                  <div class="rounded-lg bg-red-50 text-red-700 px-2 py-1">Alert: <b>${alert}</b></div>
                  <div class="rounded-lg bg-gray-100 text-gray-700 px-2 py-1">Offline: <b>${offline}</b></div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>

    <div class="mt-4 bg-white border border-gray-200 rounded-2xl p-4">
      <div class="text-sm font-semibold text-gray-800">Gợi ý vận hành</div>
      <ul class="mt-2 text-sm text-gray-600 list-disc pl-5 space-y-1">
        <li>Ưu tiên xử lý các cảnh báo mức <b>High</b> và các camera ở trạng thái <b>OFFLINE</b>.</li>
        <li>Kiểm tra định kỳ firmware của thiết bị và test kết nối RTSP.</li>
        <li>Lập lịch dọn dẹp/archiving bản ghi theo chính sách lưu trữ.</li>
      </ul>
    </div>
  `;
}

export function refreshReports() {
  initReportsPage();
}