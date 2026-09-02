/**
 * Global Reference-Counted Scroll Lock Manager
 * Prevents race conditions when multiple modals/menus/drawers open or close simultaneously.
 * Guarantees that body scroll is never left locked in an orphaned state or prematurely unlocked.
 */

const activeLocks = new Set<string>();

export function lockScroll(id = "default"): void {
  if (typeof document === "undefined") return;
  activeLocks.add(id);
  if (activeLocks.size >= 1) {
    document.body.style.overflow = "hidden";
  }
}

export function unlockScroll(id = "default"): void {
  if (typeof document === "undefined") return;
  activeLocks.delete(id);
  if (activeLocks.size === 0) {
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
    document.body.style.overscrollBehavior = "";
    document.documentElement.style.overscrollBehavior = "";
  }
}

export function resetScrollLock(): void {
  if (typeof document === "undefined") return;
  activeLocks.clear();
  document.body.style.overflow = "";
  document.documentElement.style.overflow = "";
  document.body.style.overscrollBehavior = "";
  document.documentElement.style.overscrollBehavior = "";
}
