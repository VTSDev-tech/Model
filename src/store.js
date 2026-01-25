import { safeJsonParse, uuid } from "./utils.js";

const LS = {
  settings: "wc_settings",
  cameras: "wc_cameras",
  recordings: "wc_recordings",
  alerts: "wc_alerts",
  users: "wc_users",
  devices: "wc_devices",
};

const listeners = new Set();

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function notify() {
  listeners.forEach((fn) => {
    try {
      fn(getState());
    } catch {}
  });
}

function load(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  return safeJsonParse(raw, fallback);
}
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function resetDemoData() {
  localStorage.removeItem(LS.settings);
  localStorage.removeItem(LS.cameras);
  localStorage.removeItem(LS.recordings);
  localStorage.removeItem(LS.alerts);
  localStorage.removeItem(LS.users);
  localStorage.removeItem(LS.devices);
  initStore(true);
}

// Traffic / vehicle demo videos
// NOTE: We use Google sample videos here because some networks block upload.wikimedia.org.
// These are stable, CORS-friendly, and play well on Chrome/Edge.
const DEMO_TRAFFIC_VIDEOS = [
  "https://upload.wikimedia.org/wikipedia/commons/transcoded/7/70/Street_traffic.webm/Street_traffic.webm.360p.webm",
  "https://upload.wikimedia.org/wikipedia/commons/transcoded/6/68/Avtocesta.webm/Avtocesta.webm.360p.webm",
  "https://upload.wikimedia.org/wikipedia/commons/transcoded/f/fa/Cars_Passing_by_at_Night.webm/Cars_Passing_by_at_Night.webm.360p.webm",
  "https://upload.wikimedia.org/wikipedia/commons/transcoded/7/78/Alaskan_Way_Viaduct_timelapse.webm/Alaskan_Way_Viaduct_timelapse.webm.480p.vp9.webm",
];

export function trafficVideoForIndex(i) {
  return DEMO_TRAFFIC_VIDEOS[i % DEMO_TRAFFIC_VIDEOS.length];
}

export const defaultConfig = {
  system_title: "Hệ Thống Quản Lý Camera",
  warehouse_name: "Camera Nhà Kho",
  subtitle: "Giám sát an ninh tập trung",
  storage_total_bytes: 8 * 1024 ** 4, // 8 TB
  accent_color: "#0284c7",
  alert_sound: true,
  auto_refresh_sec: 5,
};

function seedCameras() {
  const zones = [
    { zone: "Cổng ra vào", short: "Gate" },
    { zone: "Khu A - Hàng nhập", short: "A" },
    { zone: "Khu B - Hàng xuất", short: "B" },
    { zone: "Khu C - Lưu trữ", short: "C" },
    { zone: "Khu vực đóng gói", short: "Pack" },
    { zone: "Ngoài trời", short: "Outdoor" },
  ];

  const list = [];
  for (let i = 1; i <= 12; i++) {
    const z = zones[(i - 1) % zones.length];
    list.push({
      id: `CAM-${String(i).padStart(3, "0")}`,
      name:
        i === 1
          ? "Cổng chính"
          : i === 6
            ? "Khu C1"
            : i === 10
              ? "Bãi xe"
              : `Camera ${z.short}-${i}`,
      location: z.zone,
      zone: z.zone,
      status: i === 5 || i === 8 ? "offline" : i === 6 ? "alert" : "online",
      alertType: i === 6 ? "Phát hiện người lạ" : "",
      demoSrc: trafficVideoForIndex(i),
      rtsp: `rtsp://demo.local/cam${i}`,
      lastSeen: Date.now() - i * 60_000,
    });
  }
  return list;
}

function seedUsers() {
  return [
    {
      id: uuid("user"),
      name: "Admin",
      email: "admin@warehouse.vn",
      role: "Admin",
      status: "active",
    },
    {
      id: uuid("user"),
      name: "Supervisor 1",
      email: "spv1@warehouse.vn",
      role: "Supervisor",
      status: "active",
    },
    {
      id: uuid("user"),
      name: "Operator 1",
      email: "op1@warehouse.vn",
      role: "Operator",
      status: "active",
    },
    {
      id: uuid("user"),
      name: "Viewer 1",
      email: "view1@warehouse.vn",
      role: "Viewer",
      status: "active",
    },
    {
      id: uuid("user"),
      name: "Guest",
      email: "guest@warehouse.vn",
      role: "Viewer",
      status: "locked",
    },
  ];
}

function seedDevices(cameras) {
  return cameras.map((c, idx) => ({
    id: uuid("dev"),
    camId: c.id,
    name: c.name,
    zone: c.zone,
    ip: `192.168.1.${20 + idx}`,
    rtsp: c.rtsp,
    model: "IPC-2MP",
    firmware: `v1.${idx % 5}.${idx % 9}`,
    status: c.status,
    lastCheck: Date.now() - idx * 120_000,
  }));
}

function randInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}
function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function seedRecordings(cameras) {
  // Create demo recordings for last 7 days
  const now = Date.now();
  const events = ["continuous", "motion", "alert"];
  const list = [];
  for (let d = 0; d < 7; d++) {
    for (let i = 0; i < 18; i++) {
      const cam = pick(cameras);
      const start = now - d * 86400_000 - randInt(0, 3600_000 * 10);
      const durationSec = pick([15, 30, 45, 60, 90, 120, 180, 300]);
      const ev =
        cam.status === "alert" && Math.random() < 0.35 ? "alert" : pick(events);
      const sizeBytes = durationSec * randInt(220_000, 520_000); // ~0.2-0.5MB/s
      list.push({
        id: uuid("rec"),
        camId: cam.id,
        camName: cam.name,
        zone: cam.zone,
        eventType: ev,
        startTs: start,
        durationSec,
        sizeBytes,
        demoSrc: cam.demoSrc,
      });
    }
  }
  // newest first
  list.sort((a, b) => b.startTs - a.startTs);
  return list;
}

function seedAlerts(cameras) {
  const now = Date.now();
  const types = [
    "Xâm nhập khu vực cấm",
    "Phát hiện người lạ",
    "Vượt rào",
    "Mất tín hiệu tạm thời",
    "Chuyển động bất thường",
  ];
  const sev = ["low", "medium", "high"];
  const list = [];
  for (let i = 0; i < 22; i++) {
    const cam = pick(cameras);
    const status = i < 8 ? "new" : i < 15 ? "ack" : "resolved";
    list.push({
      id: uuid("al"),
      camId: cam.id,
      camName: cam.name,
      zone: cam.zone,
      type: pick(types),
      severity: pick(sev),
      status,
      ts: now - randInt(10_000, 86400_000 * 5),
      note: "",
      demoSrc: cam.demoSrc,
    });
  }
  list.sort((a, b) => b.ts - a.ts);
  return list;
}

let state = null;

export function initStore(force = false) {
  const settings = load(LS.settings, null);
  const cameras = load(LS.cameras, null);
  const users = load(LS.users, null);
  const devices = load(LS.devices, null);
  const recordings = load(LS.recordings, null);
  const alerts = load(LS.alerts, null);

  const seededCameras = cameras && !force ? cameras : seedCameras();
  const seededUsers = users && !force ? users : seedUsers();
  const seededDevices =
    devices && !force ? devices : seedDevices(seededCameras);
  const seededRecordings =
    recordings && !force ? recordings : seedRecordings(seededCameras);
  const seededAlerts = alerts && !force ? alerts : seedAlerts(seededCameras);
  const seededSettings = settings && !force ? settings : defaultConfig;

  state = {
    settings: seededSettings,
    cameras: seededCameras,
    users: seededUsers,
    devices: seededDevices,
    recordings: seededRecordings,
    alerts: seededAlerts,
  };

  save(LS.settings, state.settings);
  save(LS.cameras, state.cameras);
  save(LS.users, state.users);
  save(LS.devices, state.devices);
  save(LS.recordings, state.recordings);
  save(LS.alerts, state.alerts);

  notify();
}

export function getState() {
  return state;
}

// Derive a demo traffic video from a camera id.
// This intentionally ignores any persisted demoSrc in localStorage so the app
// keeps working even if a previous demo source becomes unreachable.
export function trafficVideoForCamId(camId) {
  const idx = (state?.cameras || []).findIndex((c) => c.id === camId);
  return trafficVideoForIndex(idx >= 0 ? idx : 0);
}

export function setSettings(patch) {
  state.settings = { ...state.settings, ...patch };
  save(LS.settings, state.settings);
  notify();
}

export function updateCamera(camId, patch) {
  state.cameras = state.cameras.map((c) =>
    c.id === camId ? { ...c, ...patch } : c,
  );
  save(LS.cameras, state.cameras);
  notify();
}

export function addUser(user) {
  state.users = [{ ...user, id: uuid("user") }, ...state.users];
  save(LS.users, state.users);
  notify();
}
export function updateUser(id, patch) {
  state.users = state.users.map((u) => (u.id === id ? { ...u, ...patch } : u));
  save(LS.users, state.users);
  notify();
}
export function deleteUser(id) {
  state.users = state.users.filter((u) => u.id !== id);
  save(LS.users, state.users);
  notify();
}

export function addDevice(dev) {
  state.devices = [{ ...dev, id: uuid("dev") }, ...state.devices];
  save(LS.devices, state.devices);
  notify();
}
export function updateDevice(id, patch) {
  state.devices = state.devices.map((d) =>
    d.id === id ? { ...d, ...patch } : d,
  );
  save(LS.devices, state.devices);
  notify();
}
export function deleteDevice(id) {
  state.devices = state.devices.filter((d) => d.id !== id);
  save(LS.devices, state.devices);
  notify();
}

export function updateAlert(id, patch) {
  state.alerts = state.alerts.map((a) =>
    a.id === id ? { ...a, ...patch } : a,
  );
  save(LS.alerts, state.alerts);
  notify();
}

export function addRecording(rec) {
  state.recordings = [{ ...rec, id: uuid("rec") }, ...state.recordings];
  save(LS.recordings, state.recordings);
  notify();
}

export function computeCounts() {
  const online = state.cameras.filter((c) => c.status === "online").length;
  const alert = state.cameras.filter((c) => c.status === "alert").length;
  const offline = state.cameras.filter((c) => c.status === "offline").length;
  const alertsOpen = state.alerts.filter((a) => a.status !== "resolved").length;
  const used = state.recordings.reduce((sum, r) => sum + (r.sizeBytes || 0), 0);
  const total =
    state.settings.storage_total_bytes || defaultConfig.storage_total_bytes;
  return {
    online,
    alert,
    offline,
    alertsOpen,
    usedBytes: used,
    totalBytes: total,
  };
}