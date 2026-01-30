import { safeJsonParse, uuid } from "./utils.js";

const LS = {
  version: "wc_version",
  settings: "wc_settings",
  cameras: "wc_cameras",
  recordings: "wc_recordings",
  alerts: "wc_alerts",
  users: "wc_users",
  devices: "wc_devices",
};

// Nâng lên version 13 để ép trình duyệt cập nhật lại toàn bộ link camera mới
const DEMO_VERSION = 13; 

const listeners = new Set();

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function notify() {
  listeners.forEach((fn) => {
    try { fn(getState()); } catch {}
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

/**
 * ĐÃ SỬA: Hàm này cực kỳ quan trọng để file warehouse.js lấy được link video
 */
export function trafficVideoForIndex(i) {
  if (!state || !state.cameras || !state.cameras[i]) return "";
  return state.cameras[i].demoSrc;
}

export const defaultConfig = {
  system_title: "THUVISION",
  warehouse_name: "Camera Nhà Kho",
  subtitle: "Giám sát an ninh tập trung",
  storage_total_bytes: 8 * 1024 ** 4,
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
    
    // Sử dụng link stream.html để nhúng vào Iframe (Fix màn hình đen)
    const currentSrc = (i === 1) 
      ? "http://127.0.0.1:1984/stream.html?src=cam_nhakho&mode=webrtc" 
      : "";

    list.push({
      id: `CAM-${String(i).padStart(3, "0")}`,
      name: i === 1 ? "Cổng chính (LIVE)" : `Camera ${z.short}-${i}`,
      location: z.zone,
      zone: z.zone,
      status: i === 1 ? "online" : "offline",
      alertType: "",
      demoSrc: currentSrc, 
      rtsp: i === 1 ? `rtsp://admin:12345@192.168.1.64:554/Streaming/Channels/101` : "",
      lastSeen: Date.now() - (i * 60_000),
    });
  }
  return list;
}

function seedUsers() {
  return [
    { id: uuid("user"), name: "Admin", email: "admin@warehouse.vn", role: "Admin", status: "active" },
    { id: uuid("user"), name: "Supervisor 1", email: "spv1@warehouse.vn", role: "Supervisor", status: "active" },
    { id: uuid("user"), name: "Operator 1", email: "op1@warehouse.vn", role: "Operator", status: "active" },
    { id: uuid("user"), name: "Viewer 1", email: "view1@warehouse.vn", role: "Viewer", status: "active" },
    { id: uuid("user"), name: "Guest", email: "guest@warehouse.vn", role: "Viewer", status: "locked" },
  ];
}

function seedDevices(cameras) {
  return cameras.map((c, idx) => ({
    id: uuid("dev"),
    camId: c.id,
    name: c.name,
    zone: c.zone,
    ip: idx === 0 ? "192.168.1.64" : `0.0.0.0`,
    rtsp: c.rtsp,
    model: "IPC-2MP",
    firmware: `v1.${idx % 5}.${idx % 9}`,
    status: c.status,
    lastCheck: Date.now() - (idx * 120_000),
  }));
}

function seedRecordings(cameras) { return []; }
function seedAlerts(cameras) { return []; }

let state = null;

export function initStore(force = false) {
  const storedVersion = Number(localStorage.getItem(LS.version) || "0");
  if (storedVersion !== DEMO_VERSION) force = true;

  const settings = load(LS.settings, null);
  const cameras = load(LS.cameras, null);
  const users = load(LS.users, null);
  const devices = load(LS.devices, null);
  const recordings = load(LS.recordings, null);
  const alerts = load(LS.alerts, null);

  const seededCameras = cameras && !force ? cameras : seedCameras();
  const seededUsers = users && !force ? users : seedUsers();
  const seededDevices = devices && !force ? devices : seedDevices(seededCameras);
  const seededRecordings = recordings && !force ? recordings : seedRecordings(seededCameras);
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
  localStorage.setItem(LS.version, String(DEMO_VERSION));

  notify();
}

export function getState() { return state; }

export function trafficVideoForCamId(camId) {
  const cam = (state?.cameras || []).find((c) => c.id === camId);
  return cam ? cam.demoSrc : "";
}

export function setSettings(patch) {
  state.settings = { ...state.settings, ...patch };
  save(LS.settings, state.settings);
  notify();
}

export function updateCamera(camId, patch) {
  state.cameras = state.cameras.map((c) => (c.id === camId ? { ...c, ...patch } : c));
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
  state.devices = state.devices.map((d) => (d.id === id ? { ...d, ...patch } : d));
  save(LS.devices, state.devices);
  notify();
}
export function deleteDevice(id) {
  state.devices = state.devices.filter((d) => d.id !== id);
  save(LS.devices, state.devices);
  notify();
}

export function updateAlert(id, patch) {
  state.alerts = state.alerts.map((a) => (a.id === id ? { ...a, ...patch } : a));
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
  const total = state.settings.storage_total_bytes || defaultConfig.storage_total_bytes;
  return { online, alert, offline, alertsOpen, usedBytes: used, totalBytes: total };
}