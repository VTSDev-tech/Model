
import { qsa } from "./utils.js";

let current = "warehouse";
let onNavigateCb = null;

export function initRouter({ onNavigate } = {}) {
  onNavigateCb = onNavigate || null;

  qsa("[data-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = btn.getAttribute("data-page");
      navigate(page);
    });
  });

  // default
  navigate("warehouse", { silent: true });
}

export function navigate(page, { silent = false, payload = null } = {}) {
  if (!page) return;
  const from = current;
  current = page;

  // hide all pages
  qsa(".page").forEach((p) => p.classList.add("hidden"));
  const target = document.getElementById(`${page}-page`);
  if (target) target.classList.remove("hidden");

  // active state in sidebar
  qsa("[data-page]").forEach((btn) => {
    btn.classList.remove("active");
    const svg = btn.querySelector("svg");
    const span = btn.querySelector("span");
    if (svg) {
      svg.classList.remove("text-sky-600");
      svg.classList.add("text-gray-500");
    }
    if (span) span.classList.remove("text-sky-700");
  });

  const activeBtn = document.querySelector(`[data-page="${page}"]`);
  if (activeBtn) {
    activeBtn.classList.add("active");
    const svg = activeBtn.querySelector("svg");
    const span = activeBtn.querySelector("span");
    if (svg) {
      svg.classList.remove("text-gray-500");
      svg.classList.add("text-sky-600");
    }
    if (span) span.classList.add("text-sky-700");
  }

  if (!silent) history.replaceState({}, "", `#${page}`);

  onNavigateCb?.({ page, from, payload });
}

export function getCurrentPage() {
  return current;
}