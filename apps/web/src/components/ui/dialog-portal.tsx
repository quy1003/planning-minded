"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

function subscribe() {
  return () => {};
}

/** true trên client — cần để portal không SSR crash. */
function useIsClient() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

/**
 * Render overlay lên `document.body` — tránh bị map/sticky trapping z-index
 * (MapLibre attribution đè modal nếu dialog nằm trong sidebar).
 */
export function DialogPortal({ children }: { children: ReactNode }) {
  const ready = useIsClient();
  if (!ready) return null;
  return createPortal(children, document.body);
}

/** z-index cao hơn map controls / sticky sidebar. Luôn căn giữa (kể cả mobile). */
export const DIALOG_OVERLAY_CLASS =
  "fixed inset-0 z-[200] flex items-center justify-center p-4";
