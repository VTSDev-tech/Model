
import { qs, qsa, formatDateTime, formatBytes } from "../utils.js";
import { getState, trafficVideoForCamId } from "../store.js";
import { openModal, closeModal, wireModal } from "../components/modal.js";
import { toast } from "../components/toast.js";

let currentList = [];
let currentIndex = 0;

function chipEvent(ev) {
  if (ev === "alert") return '<span class="chip chip-alert">ALERT</span>';
  if (ev === "motion") return '<span class="chip chip-motion">MOTION</span>';
  return '<span class="chip chip-cont">CONT</span>';
}

function renderFilters(payload) {
  const st = getState();
  const cams = st.cameras;

  const camOptions = [`<option value="all">Tất cả camera</option>`]
    .concat(cams.map((c) => `<option value="${c.id}">${c.id} - ${c.name}</option>`))
    .join("");

  const zoneOptions = [`<option value="all">Tất cả khu vực</option>`]
    .concat(Array.from(new Set(cams.map((c) => c.zone))).sort().map((z) => `<option value="${z}">${z}</option>`))
    .join("");

  const root = qs("#recordings-root");
  root.innerHTML = `
    <div class="bg-white border border-gray-200 rounded-2xl p-4">
      <div class="grid grid-cols-4 gap-3">
        <div>
          <label class="text-xs text-gray-500 font-semibold">Camera</label>
          <select id="rec-cam" class="select mt-1">${camOptions}</select>
        </div>
        <div>
          <label class="text-xs text-gray-500 font-semibold">Khu vực</label>
          <select id="rec-zone" class="select mt-1">${zoneOptions}</select>
        </div>
        <div>
          <label class="text-xs text-gray-500 font-semibold">Loại</label>
          <select id="rec-type" class="select mt-1">
            <option value="all">Tất cả</option>
            <option value="continuous">Liên tục</option>
            <option value="motion">Chuyển động</option>
            <option value="alert">Cảnh báo</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-gray-500 font-semibold">Tìm kiếm</label>
          <input id="rec-q" class="input mt-1" placeholder="Nhập CAM-xxx, vị trí..." />
        </div>
      </div>

      <div class="mt-4 overflow-x-auto">
        <table class="table" id="rec-table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Camera</th>
              <th>Khu vực</th>
              <th>Loại</th>
              <th>Thời lượng</th>
              <th>Dung lượng</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="rec-body"></tbody>
        </table>
      </div>

      <div class="mt-3 flex items-center justify-between text-sm text-gray-500">
        <div id="rec-count">—</div>
        <div class="flex items-center gap-2">
          <button id="rec-refresh" class="btn btn-secondary">Làm mới</button>
        </div>
      </div>
    </div>
  `;

  // apply payload filter (from camera modal)
  if (payload?.camId) {
    qs("#rec-cam").value = payload.camId;
  }
}

function applyFilter() {
  const st = getState();
  const cam = qs("#rec-cam")?.value || "all";
  const zone = qs("#rec-zone")?.value || "all";
  const type = qs("#rec-type")?.value || "all";
  const q = (qs("#rec-q")?.value || "").toLowerCase().trim();

  let list = st.recordings.slice();
  if (cam !== "all") list = list.filter((r) => r.camId === cam);
  if (zone !== "all") list = list.filter((r) => r.zone === zone);
  if (type !== "all") list = list.filter((r) => r.eventType === type);
  if (q) {
    list = list.filter((r) =>
      `${r.camId} ${r.camName} ${r.zone}`.toLowerCase().includes(q)
    );
  }
  currentList = list;
  renderTable();
}

function renderTable() {
  const body = qs("#rec-body");
  if (!body) return;

  body.innerHTML = currentList.slice(0, 60).map((r, idx) => `
    <tr data-idx="${idx}">
      <td class="font-mono text-xs text-gray-700">${formatDateTime(r.startTs)}</td>
      <td><div class="font-semibold text-gray-800">${r.camId}</div><div class="text-xs text-gray-500">${r.camName}</div></td>
      <td class="text-sm text-gray-700">${r.zone}</td>
      <td>${chipEvent(r.eventType)}</td>
      <td class="text-sm text-gray-700">${r.durationSec}s</td>
      <td class="text-sm text-gray-700">${formatBytes(r.sizeBytes)}</td>
      <td><button class="btn btn-primary text-xs" data-play="${idx}">Phát lại</button></td>
    </tr>
  `).join("");

  qs("#rec-count").textContent = `Hiển thị ${Math.min(60, currentList.length)} / ${currentList.length} bản ghi`;
  qsa("[data-play]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.getAttribute("data-play"));
      if (!Number.isNaN(i)) openPlayback(i);
    });
  });
}

function openPlayback(i) {
  currentIndex = i;
  const r = currentList[i];
  if (!r) return;

  qs("#playback-title").textContent = `Playback • ${r.camId}`;
  qs("#playback-meta").textContent = `${r.zone} • ${r.eventType.toUpperCase()} • ${r.durationSec}s`;
  qs("#playback-time").textContent = formatDateTime(r.startTs);
  qs("#playback-badge").textContent = "PLAYBACK";

  const v = qs("#playback-video");
  v.src = trafficVideoForCamId(r.camId);
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

function wirePlaybackModal() {
  wireModal("#playback-modal", { onClose: closePlayback });
  qs("#playback-close")?.addEventListener("click", closePlayback);

  qs("#pb-prev")?.addEventListener("click", () => {
    if (currentIndex > 0) openPlayback(currentIndex - 1);
    else toast({ title: "Playback", message: "Không có bản ghi trước", variant: "info" });
  });
  qs("#pb-next")?.addEventListener("click", () => {
    if (currentIndex < currentList.length - 1) openPlayback(currentIndex + 1);
    else toast({ title: "Playback", message: "Không có bản ghi tiếp theo", variant: "info" });
  });
  qs("#pb-open-list")?.addEventListener("click", () => {
    closePlayback();
    toast({ title: "Danh sách", message: "Bạn đang ở trang danh sách bản ghi", variant: "info" });
  });
  qs("#playback-download")?.addEventListener("click", () => {
    toast({ title: "Tải xuống", message: "Demo: chức năng tải file sẽ kết nối backend/NVR trong phiên bản thật.", variant: "info" });
  });
}

export function initRecordingsPage(payload = null) {
  renderFilters(payload);
  wirePlaybackModal();

  ["rec-cam", "rec-zone", "rec-type", "rec-q"].forEach((id) => {
    qs("#" + id)?.addEventListener("input", applyFilter);
    qs("#" + id)?.addEventListener("change", applyFilter);
  });

  qs("#rec-refresh")?.addEventListener("click", () => {
    toast({ title: "Làm mới", message: "Đã làm mới danh sách theo bộ lọc hiện tại", variant: "success" });
    applyFilter();
  });

  applyFilter();
}

export function refreshRecordings(payload = null) {
  initRecordingsPage(payload);
}