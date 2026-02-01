import { safeJsonParse, uuid } from "./utils.js";

const LS = {
  version: "wc_version",
  settings: "wc_settings",
  cameras: "wc_cameras",
  recordings: "wc_recordings",
  alerts: "wc_alerts",
  users: "wc_users",
  devices: "wc_devices",
  logs: "wc_logs", 
};

const DEMO_VERSION = 26; 
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

export function logAction(actionType, details) {
  if (!state) return;
  const newLog = {
    id: uuid("log"),
    ts: Date.now(),
    user: "Quản trị viên",
    action: actionType,
    details: details
  };
  
  state.logs = [newLog, ...(state.logs || [])].slice(0, 100);
  save(LS.logs, state.logs);
  notify();
}

export function resetDemoData() {
  localStorage.clear();
  initStore(true);
}

export function clearAllAlerts() {
  state.alerts = [];
  save(LS.alerts, []);
  localStorage.setItem("wc_ignore_before", Date.now().toString());
  logAction("XÓA_CẢNH_BÁO", "Người dùng đã xóa toàn bộ danh sách cảnh báo.");
  notify();
}

export function trafficVideoForIndex(i) {
  if (!state || !state.cameras || !state.cameras[i]) return "";
  return state.cameras[i].demoSrc;
}

export const defaultConfig = {
  system_title: "THUVISION",
  warehouse_name: "Hệ Thống Giám Sát",
  subtitle: "Phát hiện hành vi làm việc",
  storage_total_bytes: 8 * 1024 ** 4,
  accent_color: "#0284c7",
  alert_sound: true,
  auto_refresh_sec: 5,
};

function seedCameras() {
  const zones = [
    { zone: "Khu vực 1", short: "Z1" },
    { zone: "Khu vực 2", short: "Z2" },
  ];

  const list = [];
  for (let i = 1; i <= 12; i++) {
    const z = zones[(i - 1) % zones.length];
    let currentSrc = "";
    let currentRtsp = "";
    
    if (i === 1) {
      currentSrc = "http://127.0.0.1:1984/stream.html?src=cam01&mode=webrtc";
      currentRtsp = "rtsp://admin:Doanhhackduoc3m@192.168.1.11:554/Streaming/Channels/101";
    } else if (i === 2) {
      currentSrc = "http://127.0.0.1:1984/stream.html?src=cam02&mode=webrtc";
      currentRtsp = "rtsp://admin:12345@192.168.1.64:554/Streaming/Channels/101";
    } else {
      // Dùng link video mẫu cho các cam khác để tránh màn hình đen khi test
      currentSrc = "https://www.w3schools.com/html/mov_bbb.mp4";
    }

    list.push({
      id: `CAM-${String(i).padStart(2, "0")}`, 
      name: i <= 2 ? `Camera Live ${i}` : `Camera dự phòng ${i}`,
      location: z.zone,
      zone: z.zone,
      status: "online",
      alertType: "",
      demoSrc: currentSrc, 
      rtsp: currentRtsp,
      lastSeen: Date.now() - (i * 60_000),
    });
  }
  return list;
}

function seedUsers() {
  return [
    { id: uuid("user"), name: "Quản lý", email: "admin@thuvision.vn", role: "Admin", status: "active" },
  ];
}

function seedDevices(cameras) {
  return cameras.map((c, idx) => ({
    id: uuid("dev"),
    camId: c.id,
    name: c.name,
    zone: c.zone,
    ip: idx === 0 ? "192.168.1.11" : idx === 1 ? "192.168.1.64" : "0.0.0.0",
    rtsp: c.rtsp,
    model: "IPC-2MP",
    firmware: "v1.0.1",
    status: c.status,
    lastCheck: Date.now(),
  }));
}

// --- ĐÃ FIX: HÀM TẠO LỊCH SỬ GHI HÌNH MẪU ---
function seedRecordings(cameras) { 
  const list = [];
  const types = ["continuous", "motion", "alert"];
  const cams = cameras.length > 0 ? cameras : seedCameras();
  
  cams.slice(0, 6).forEach((cam, idx) => {
    for(let j=0; j<4; j++) {
      list.push({
        id: uuid("rec"),
        camId: cam.id,
        camName: cam.name,
        zone: cam.zone,
        eventType: types[j % types.length],
        startTs: Date.now() - (j * 3600000) - (idx * 600000),
        durationSec: Math.floor(Math.random() * 500) + 60,
        sizeBytes: Math.floor(Math.random() * 100000000) + 5000000,
      });
    }
  });
  return list; 
}

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
  const logs = load(LS.logs, []);

  const baseCams = cameras && !force ? cameras : seedCameras();

  state = {
    settings: settings && !force ? settings : defaultConfig,
    cameras: baseCams,
    users: users && !force ? users : seedUsers(),
    devices: devices && !force ? devices : seedDevices(baseCams),
    recordings: recordings && !force ? recordings : seedRecordings(baseCams),
    alerts: alerts && !force ? alerts : seedAlerts(baseCams),
    logs: logs,
  };

  save(LS.settings, state.settings);
  save(LS.cameras, state.cameras);
  save(LS.users, state.users);
  save(LS.devices, state.devices);
  save(LS.recordings, state.recordings);
  save(LS.alerts, state.alerts);
  save(LS.logs, state.logs);
  localStorage.setItem(LS.version, String(DEMO_VERSION));

  syncWithAIServer();
  notify();
}

async function syncWithAIServer() {
  const alertAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

  setInterval(async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/get_status');
      const data = await response.json();
      let hasChange = false;
      let newAlertDetected = false;

      if (data.cameras) {
        state.cameras.forEach(cam => {
          const apiStatus = data.cameras[cam.id.toUpperCase()] || data.cameras[cam.id]; 
          if (apiStatus) {
            const newStatus = (apiStatus === 'alert') ? 'alerting' : 'online';
            if (cam.status !== newStatus) {
              cam.status = newStatus;
              hasChange = true;
            }
          }
        });
      } 

      if (data.history && data.history.length > 0) {
        const ignoreBefore = Number(localStorage.getItem("wc_ignore_before") || 0);

        data.history.forEach(event => {
          const isExists = state.alerts.some(a => a.time === event.time && a.camId === event.camId);
          
          if (!isExists) {
            if (Date.now() - ignoreBefore < 2000) return;

            const cam = state.cameras.find(c => c.id === event.camId);
            const isAlerting = 
              event.behavior === "Standing" || 
              event.event === "Không làm việc" || 
              (data.cameras && data.cameras[event.camId] === "alert");

            if (isAlerting) {
              const newAlert = {
                id: uuid("alt"),
                camId: event.camId,
                camName: cam?.name || "Camera " + event.camId,
                zone: cam?.zone || "Khu vực làm việc",
                type: "Cảnh báo", 
                severity: "high", 
                ts: Date.now(), // Cần thiết để formatDateTime không bị Invalid Date
                timestamp: Date.now(), 
                time: event.time || new Date().toLocaleTimeString(), 
                date: event.date || new Date().toLocaleDateString(),
                status: "new", 
                message: event.behavior || "Nhân viên rời vị trí/Đang đứng",
                note: ""
              };

              state.alerts = [newAlert, ...state.alerts].slice(0, 50);
              hasChange = true;
              newAlertDetected = true;
            }
          }
        });
      }

      if (hasChange) {
        save(LS.alerts, state.alerts);
        save(LS.cameras, state.cameras); 
        notify(); 
        
        if (newAlertDetected && state.settings.alert_sound) {
            alertAudio.play().catch(() => {});
        }
      }
    } catch (err) {}
  }, 1000); 
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
  const alert = state.cameras.filter((c) => c.status === "alert" || c.status === "alerting").length;
  const offline = state.cameras.filter((c) => c.status === "offline").length;
  const alertsOpen = state.alerts.filter((a) => a.status !== "resolved").length;
  const used = state.recordings.reduce((sum, r) => sum + (r.sizeBytes || 0), 0);
  const total = state.settings.storage_total_bytes || defaultConfig.storage_total_bytes;
  return { online, alert, offline, alertsOpen, usedBytes: used, totalBytes: total };
}