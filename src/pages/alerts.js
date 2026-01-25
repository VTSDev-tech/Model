
import { qs, qsa, formatDateTime } from "../utils.js";
import { getState, updateAlert, trafficVideoForCamId } from "../store.js";
import { toast } from "../components/toast.js";
import { navigate } from "../router.js";
import { openModal, closeModal, wireModal } from "../components/modal.js";

let list = [];
let current = null;

function chipSeverity(s) {
  if (s === "high") return '<span class="chip chip-alert">HIGH</span>';
  if (s === "medium") return '<span class="chip chip-motion">MED</span>';
  return '<span class="chip chip-offline">LOW</span>';
}
function chipStatus(st) {
  if (st === "new") return '<span class="chip chip-alert">NEW</span>';
  if (st === "ack") return '<span class="chip chip-motion">ACK</span>';
  return '<span class="chip chip-live">RESOLVED</span>';
}

function render() {
  const root = qs("#alerts-root");
  const st = getState();
  const cams = st.cameras;

  const camOptions = [`<option value="all">Tất cả camera</option>`]
    .concat(cams.map((c) => `<option value="${c.id}">${c.id} - ${c.name}</option>`))
    .join("");

  root.innerHTML = `
    <div class="bg-white border border-gray-200 rounded-2xl p-4">
      <div class="grid grid-cols-4 gap-3">
        <div>
          <label class="text-xs text-gray-500 font-semibold">Trạng thái</label>
          <select id="al-status" class="select mt-1">
            <option value="all">Tất cả</option>
            <option value="new">Mới</option>
            <option value="ack">Đã xác nhận</option>
            <option value="resolved">Đã xử lý</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-gray-500 font-semibold">Camera</label>
          <select id="al-cam" class="select mt-1">${camOptions}</select>
        </div>
        <div>
          <label class="text-xs text-gray-500 font-semibold">Mức độ</label>
          <select id="al-sev" class="select mt-1">
            <option value="all">Tất cả</option>
            <option value="high">Cao</option>
            <option value="medium">Trung bình</option>
            <option value="low">Thấp</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-gray-500 font-semibold">Tìm kiếm</label>
          <input id="al-q" class="input mt-1" placeholder="Nhập nội dung cảnh báo..." />
        </div>
      </div>

      <div class="mt-4 overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Camera</th>
              <th>Khu vực</th>
              <th>Loại</th>
              <th>Mức</th>
              <th>Trạng thái</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="al-body"></tbody>
        </table>
      </div>
      <div class="mt-3 flex items-center justify-between text-sm text-gray-500">
        <div id="al-count">—</div>
        <div class="flex items-center gap-2">
          <button id="al-refresh" class="btn btn-secondary">Làm mới</button>
        </div>
      </div>
    </div>

    <!-- Alert detail -->
    <div class="mt-4 grid grid-cols-3 gap-4">
      <div class="col-span-2 bg-white border border-gray-200 rounded-2xl p-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-semibold text-gray-800">Chi tiết cảnh báo</div>
            <div class="text-xs text-gray-500 mt-1">Chọn 1 cảnh báo để xem video preview và thao tác</div>
          </div>
          <div class="flex items-center gap-2">
            <button id="al-open-cam" class="btn btn-secondary" disabled>Mở camera</button>
            <button id="al-play" class="btn btn-secondary" disabled>Phát lại</button>
          </div>
        </div>
        <div class="mt-4 border border-gray-200 rounded-xl overflow-hidden bg-black" style="aspect-ratio:16/9; position:relative;">
          <video id="al-video" class="cam-modal__video" muted autoplay loop playsinline></video>
          <div id="al-video-empty" class="absolute inset-0 flex items-center justify-center text-gray-300 text-sm">Chưa chọn cảnh báo</div>
        </div>

        <div class="mt-4 grid grid-cols-3 gap-3">
          <div class="kpi-card">
            <div class="kpi-title">Loại</div>
            <div class="kpi-value text-base" id="al-d-type">—</div>
            <div class="kpi-sub" id="al-d-time">—</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Mức độ</div>
            <div class="kpi-value text-base" id="al-d-sev">—</div>
            <div class="kpi-sub" id="al-d-zone">—</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Trạng thái</div>
            <div class="kpi-value text-base" id="al-d-status">—</div>
            <div class="kpi-sub" id="al-d-cam">—</div>
          </div>
        </div>

        <div class="mt-4 flex items-center gap-2">
          <button id="al-ack" class="btn btn-secondary" disabled>Xác nhận</button>
          <button id="al-resolve" class="btn btn-primary" disabled>Đánh dấu đã xử lý</button>
        </div>
      </div>

      <div class="bg-white border border-gray-200 rounded-2xl p-4">
        <div class="text-sm font-semibold text-gray-800">Ghi chú</div>
        <div class="text-xs text-gray-500 mt-1">Lưu note xử lý (demo)</div>
        <textarea id="al-note" class="input mt-3" rows="8" placeholder="Nhập ghi chú..."></textarea>
        <button id="al-save-note" class="btn btn-secondary w-full mt-3" disabled>Lưu ghi chú</button>

        <div class="divider my-4"></div>
        <div class="text-sm font-semibold text-gray-800">Gợi ý xử lý</div>
        <ul class="mt-2 text-sm text-gray-600 list-disc pl-5 space-y-1">
          <li>Kiểm tra camera và khu vực xung quanh.</li>
          <li>Đối chiếu bản ghi gần nhất trong mục “Lịch sử ghi hình”.</li>
          <li>Nếu camera offline, ưu tiên kiểm tra thiết bị/nguồn.</li>
        </ul>
      </div>
    </div>
  `;

  list = st.alerts.slice();
  applyFilter();
  wire();
}

function applyFilter() {
  const st = getState();
  const status = qs("#al-status")?.value || "all";
  const cam = qs("#al-cam")?.value || "all";
  const sev = qs("#al-sev")?.value || "all";
  const q = (qs("#al-q")?.value || "").toLowerCase().trim();

  let filtered = st.alerts.slice();
  if (status !== "all") filtered = filtered.filter((a) => a.status === status);
  if (cam !== "all") filtered = filtered.filter((a) => a.camId === cam);
  if (sev !== "all") filtered = filtered.filter((a) => a.severity === sev);
  if (q) filtered = filtered.filter((a) => (a.type + " " + a.zone + " " + a.camName).toLowerCase().includes(q));

  list = filtered;
  const body = qs("#al-body");
  body.innerHTML = list.slice(0, 80).map((a, idx) => `
    <tr data-idx="${idx}">
      <td class="font-mono text-xs">${formatDateTime(a.ts)}</td>
      <td><div class="font-semibold">${a.camId}</div><div class="text-xs text-gray-500">${a.camName}</div></td>
      <td class="text-sm text-gray-700">${a.zone}</td>
      <td class="text-sm text-gray-800">${a.type}</td>
      <td>${chipSeverity(a.severity)}</td>
      <td>${chipStatus(a.status)}</td>
      <td><button class="btn btn-secondary text-xs" data-view="${idx}">Xem</button></td>
    </tr>
  `).join("");

  qs("#al-count").textContent = `Hiển thị ${Math.min(80, list.length)} / ${list.length} cảnh báo`;

  qsa("[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.getAttribute("data-view"));
      if (!Number.isNaN(i)) selectAlert(i);
    });
  });
}

function selectAlert(i) {
  current = list[i];
  if (!current) return;

  qs("#al-video-empty").classList.add("hidden");
  const v = qs("#al-video");
  v.src = trafficVideoForCamId(current.camId);
  v.play().catch(() => {});
  qs("#al-d-type").textContent = current.type;
  qs("#al-d-time").textContent = formatDateTime(current.ts);
  qs("#al-d-sev").innerHTML = current.severity.toUpperCase();
  qs("#al-d-zone").textContent = current.zone;
  qs("#al-d-status").textContent = current.status.toUpperCase();
  qs("#al-d-cam").textContent = `${current.camId} • ${current.camName}`;

  qs("#al-note").value = current.note || "";

  // enable buttons
  ["#al-open-cam", "#al-play", "#al-ack", "#al-resolve", "#al-save-note"].forEach((s) => qs(s).disabled = false);
}

function wire() {
  ["al-status", "al-cam", "al-sev", "al-q"].forEach((id) => {
    qs("#" + id)?.addEventListener("input", applyFilter);
    qs("#" + id)?.addEventListener("change", applyFilter);
  });
  qs("#al-refresh")?.addEventListener("click", () => {
    toast({ title: "Làm mới", message: "Đã cập nhật danh sách cảnh báo", variant: "success" });
    applyFilter();
  });

  qs("#al-open-cam")?.addEventListener("click", () => {
    if (!current) return;
    toast({ title: "Mở camera", message: `Chuyển sang camera ${current.camId}`, variant: "info" });
    navigate("warehouse", { payload: { openCamId: current.camId } });
  });

  qs("#al-play")?.addEventListener("click", () => {
    if (!current) return;
    openPlaybackFromAlert();
  });

  qs("#al-ack")?.addEventListener("click", () => {
    if (!current) return;
    updateAlert(current.id, { status: "ack" });
    toast({ title: "Xác nhận", message: "Đã xác nhận cảnh báo", variant: "success" });
  });

  qs("#al-resolve")?.addEventListener("click", () => {
    if (!current) return;
    updateAlert(current.id, { status: "resolved" });
    toast({ title: "Đã xử lý", message: "Cảnh báo được đánh dấu đã xử lý", variant: "success" });
  });

  qs("#al-save-note")?.addEventListener("click", () => {
    if (!current) return;
    const note = qs("#al-note").value || "";
    updateAlert(current.id, { note });
    toast({ title: "Ghi chú", message: "Đã lưu ghi chú (demo)", variant: "success" });
  });

  // playback modal wiring
  wireModal("#playback-modal", { onClose: closePlayback });
  qs("#playback-close")?.addEventListener("click", closePlayback);
  qs("#playback-download")?.addEventListener("click", () => {
    toast({ title: "Tải xuống", message: "Demo: tải file cần backend/NVR thật.", variant: "info" });
  });
  qs("#pb-prev").disabled = true;
  qs("#pb-next").disabled = true;
  qs("#pb-open-list").disabled = true;
}

function openPlaybackFromAlert() {
  qs("#playback-title").textContent = `Playback • ${current.camId}`;
  qs("#playback-meta").textContent = `${current.zone} • ALERT • ${current.type}`;
  qs("#playback-time").textContent = formatDateTime(current.ts);
  qs("#playback-badge").textContent = "ALERT PLAYBACK";

  const v = qs("#playback-video");
  v.src = trafficVideoForCamId(current.camId);
  v.play().catch(() => {});

  openModal("#playback-modal");
}

function closePlayback() {
  const v = qs("#playback-video");
  v.pause();
  v.removeAttribute("src");
  v.load();
  closeModal("#playback-modal");
}

export function initAlertsPage() {
  render();
}

export function refreshAlerts() {
  initAlertsPage();
}