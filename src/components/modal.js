
import { qs } from "../utils.js";

export function openModal(modalId) {
  const modal = qs(modalId);
  if (!modal) return;
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

export function closeModal(modalId) {
  const modal = qs(modalId);
  if (!modal) return;
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

export function wireModal(modalId, { onClose } = {}) {
  const modal = qs(modalId);
  if (!modal) return;

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal(modalId);
      onClose?.();
    }
    const t = e.target;
    if (t && t.dataset && t.dataset.close) {
      closeModal(modalId);
      onClose?.();
    }
  });
}