
export function qs(sel, root = document) {
  return root.querySelector(sel);
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
  const blob = new Blob([content], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 500);
}
export function safeJsonParse(s, fallback) {
  try { return JSON.parse(s); } catch { return fallback; }
}