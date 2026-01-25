/**
 * LẤY PHẦN TỬ DOM (Đã cải tiến)
 * Ngăn chặn lỗi crash ứng dụng nếu không tìm thấy Selector
 */
export function qs(sel, root = document) {
  const el = root.querySelector(sel);
  if (!el) {
    // Log cảnh báo để bạn biết ID nào đang bị thiếu trong HTML
    console.warn(`[DOM Warning] Không tìm thấy phần tử: "${sel}". Hãy kiểm tra lại file HTML.`);
    
    // Trả về một "Object giả" (Proxy) để tránh lỗi "Cannot set properties of null"
    // Giúp code main.js tiếp tục chạy mà không bị dừng đột ngột
    return {
      textContent: "",
      innerHTML: "",
      style: {},
      classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
      addEventListener: () => {},
      removeEventListener: () => {},
      setAttribute: () => {},
      getAttribute: () => null,
      click: () => {},
    };
  }
  return el;
}

export function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function uuid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function formatDateTime(ts) {
  if (!ts) return "--:--";
  const d = new Date(ts);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatDate(ts) {
  if (!ts) return "--/--/----";
  const d = new Date(ts);
  return d.toLocaleDateString("vi-VN");
}

export function formatBytes(bytes) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let b = Math.max(0, Number(bytes) || 0);
  let i = 0;
  while (b >= 1024 && i < units.length - 1) {
    b /= 1024;
    i++;
  }
  return `${b.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function downloadText(filename, content, mime = "text/plain") {
  try {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 500);
  } catch (e) {
    console.error("Lỗi khi tải file:", e);
  }
}

/**
 * PARSE JSON AN TOÀN
 * Tránh làm treo ứng dụng nếu dữ liệu trong LocalStorage bị hỏng
 */
export function safeJsonParse(s, fallback) {
  if (!s) return fallback;
  try { 
    return JSON.parse(s); 
  } catch (err) { 
    console.error("Lỗi parse dữ liệu JSON:", err);
    return fallback; 
  }
}