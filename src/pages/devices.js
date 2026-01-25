
import { qs, qsa, formatDateTime } from "../utils.js";
import { getState, addDevice, updateDevice, deleteDevice } from "../store.js";
import { toast } from "../components/toast.js";

let editing = null;

function render() {
  const root = qs("#devices-root");
  const st = getState();

  const camOptions = st.cameras.map((c) => `<option value="${c.id}">${c.id} - ${c.name}</option>`).join("");

  root.innerHTML = `
    <div class="bg-white border border-gray-200 rounded-2xl p-4">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm font-semibold text-gray-800">Thiết bị camera</div>
          <div class="text-xs text-gray-500 mt-1">Quản lý RTSP, IP, firmware (demo)</div>
        </div>
        <button id="dev-add" class="btn btn-primary">+ Thêm thiết bị</button>
      </div>

      <div class="mt-4 overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Camera</th>
              <th>IP</th>
              <th>Khu vực</th>
              <th>Model</th>
              <th>Firmware</th>
              <th>Trạng thái</th>
              <th>Lần check</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${st.devices.map((d) => `
              <tr>
                <td><div class="font-semibold">${d.camId}</div><div class="text-xs text-gray-500">${d.name}</div></td>
                <td class="font-mono text-xs">${d.ip}</td>
                <td class="text-sm">${d.zone}</td>
                <td class="text-sm">${d.model}</td>
                <td class="text-sm">${d.firmware}</td>
                <td>${d.status === "offline" ? '<span class="chip chip-offline">OFFLINE</span>' : d.status === "alert" ? '<span class="chip chip-alert">ALERT</span>' : '<span class="chip chip-live">ONLINE</span>'}</td>
                <td class="text-xs font-mono text-gray-600">${formatDateTime(d.lastCheck)}</td>
                <td class="text-right">
                  <button class="btn btn-secondary text-xs" data-test="${d.id}">Test</button>
                  <button class="btn btn-secondary text-xs" data-edit="${d.id}">Sửa</button>
                  <button class="btn btn-danger text-xs" data-del="${d.id}">Xoá</button>
                </td>
              </tr>
              <tr>
                <td colspan="8" class="text-xs text-gray-500">
                  <span class="font-mono">${d.rtsp}</span>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div class="divider my-4"></div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-xs text-gray-500 font-semibold">Camera</label>
          <select id="df-cam" class="select mt-1">${camOptions}</select>
        </div>
        <div>
          <label class="text-xs text-gray-500 font-semibold">IP</label>
          <input id="df-ip" class="input mt-1" placeholder="192.168.1.20" />
        </div>
        <div>
          <label class="text-xs text-gray-500 font-semibold">RTSP</label>
          <input id="df-rtsp" class="input mt-1" placeholder="rtsp://..." />
        </div>
        <div>
          <label class="text-xs text-gray-500 font-semibold">Khu vực</label>
          <input id="df-zone" class="input mt-1" placeholder="Khu A..." />
        </div>
        <div>
          <label class="text-xs text-gray-500 font-semibold">Model</label>
          <input id="df-model" class="input mt-1" placeholder="IPC-2MP" />
        </div>
        <div>
          <label class="text-xs text-gray-500 font-semibold">Firmware</label>
          <input id="df-fw" class="input mt-1" placeholder="v1.0.0" />
        </div>
        <div class="col-span-2 flex items-center gap-2">
          <button id="df-save" class="btn btn-primary">Lưu</button>
          <button id="df-cancel" class="btn btn-secondary">Huỷ</button>
          <div class="text-xs text-gray-500 ml-auto" id="df-hint">Tạo mới thiết bị</div>
        </div>
      </div>
    </div>
  `;

  wire();
}

function resetForm() {
  editing = null;
  qs("#df-ip").value = "";
  qs("#df-rtsp").value = "";
  qs("#df-zone").value = "";
  qs("#df-model").value = "IPC-2MP";
  qs("#df-fw").value = "v1.0.0";
  qs("#df-hint").textContent = "Tạo mới thiết bị";
}

function fillForm(dev) {
  editing = dev.id;
  qs("#df-cam").value = dev.camId;
  qs("#df-ip").value = dev.ip;
  qs("#df-rtsp").value = dev.rtsp;
  qs("#df-zone").value = dev.zone;
  qs("#df-model").value = dev.model;
  qs("#df-fw").value = dev.firmware;
  qs("#df-hint").textContent = `Đang sửa thiết bị: ${dev.camId}`;
}

function wire() {
  qs("#dev-add")?.addEventListener("click", () => {
    resetForm();
    toast({ title: "Thiết bị", message: "Nhập thông tin thiết bị và bấm Lưu", variant: "info" });
  });

  qsa("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-edit");
      const dev = getState().devices.find((d) => d.id === id);
      if (dev) fillForm(dev);
    });
  });

  qsa("[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-del");
      const dev = getState().devices.find((d) => d.id === id);
      if (!dev) return;
      if (!confirm(`Xoá thiết bị camera ${dev.camId}?`)) return;
      deleteDevice(id);
      toast({ title: "Xoá", message: "Đã xoá thiết bị", variant: "success" });
      render();
    });
  });

  qsa("[data-test]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-test");
      const dev = getState().devices.find((d) => d.id === id);
      if (!dev) return;

      toast({ title: "Test", message: `Đang test kết nối ${dev.camId}...`, variant: "info", timeout: 1500 });

      setTimeout(() => {
        const ok = Math.random() > 0.2;
        updateDevice(id, { lastCheck: Date.now(), status: ok ? "online" : "offline" });
        toast({
          title: ok ? "Kết nối OK" : "Kết nối FAIL",
          message: ok ? "Thiết bị phản hồi ổn định" : "Không phản hồi RTSP (demo)",
          variant: ok ? "success" : "danger",
        });
        render();
      }, 900);
    });
  });

  qs("#df-save")?.addEventListener("click", () => {
    const camId = qs("#df-cam").value;
    const ip = (qs("#df-ip").value || "").trim();
    const rtsp = (qs("#df-rtsp").value || "").trim();
    const zone = (qs("#df-zone").value || "").trim();
    const model = (qs("#df-model").value || "").trim();
    const fw = (qs("#df-fw").value || "").trim();

    if (!ip || !rtsp) {
      toast({ title: "Thiếu thông tin", message: "Vui lòng nhập IP và RTSP", variant: "danger" });
      return;
    }

    const cam = getState().cameras.find((c) => c.id === camId);
    const name = cam?.name || "Camera";

    if (editing) {
      updateDevice(editing, { camId, name, ip, rtsp, zone: zone || cam?.zone || "-", model, firmware: fw, lastCheck: Date.now() });
      toast({ title: "Cập nhật", message: "Đã cập nhật thiết bị", variant: "success" });
    } else {
      addDevice({ camId, name, ip, rtsp, zone: zone || cam?.zone || "-", model: model || "IPC", firmware: fw || "v1.0.0", status: "online", lastCheck: Date.now() });
      toast({ title: "Tạo mới", message: "Đã thêm thiết bị", variant: "success" });
    }
    render();
    resetForm();
  });

  qs("#df-cancel")?.addEventListener("click", () => {
    resetForm();
    toast({ title: "Huỷ", message: "Đã huỷ thao tác", variant: "info" });
  });

  resetForm();
}

export function initDevicesPage() {
  render();
}
export function refreshDevices() {
  initDevicesPage();
}