"use client";

import { useSyncExternalStore, ViewTransition } from "react";

const subscribe = (fn: () => void) => {
  document.addEventListener("visibilitychange", fn);
  return () => document.removeEventListener("visibilitychange", fn);
};

/**
 * Route changes slide the page sheet (D19). A hidden tab cannot run a view transition (the browser
 * aborts it with "InvalidStateError: Document hidden", e.g. on a background Fast Refresh), so the
 * boundary opts out while the tab is hidden.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const visible = useSyncExternalStore(
    subscribe,
    () => document.visibilityState === "visible",
    () => true,
  );
  return <ViewTransition default={visible ? "page" : "none"}>{children}</ViewTransition>;
}
