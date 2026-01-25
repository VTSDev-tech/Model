
import { qs } from "../utils.js";

export function toast({ title, message, variant = "info", timeout = 2500 }) {
  const container = qs("#toast-container");
  if (!container) return;

  const div = document.createElement("div");
  div.className = `toast ${variant}`;
  div.innerHTML = `
    <div class="toast-title">${title || "Thông báo"}</div>
    <div class="toast-msg">${message || ""}</div>
  `;
  container.appendChild(div);

  setTimeout(() => {
    div.style.opacity = "0";
    div.style.transform = "translateY(6px)";
    div.style.transition = "all .2s ease";
    setTimeout(() => div.remove(), 220);
  }, timeout);
}