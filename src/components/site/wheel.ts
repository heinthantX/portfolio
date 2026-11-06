import type { VirtualScrollData } from "lenis";

/** Returns false to take the event over: Lenis skips it and the page does not scroll natively. */
type Interceptor = (data: VirtualScrollData) => boolean;
let interceptor: Interceptor | null = null;

/** One section at a time may steer the wheel (the hero's chapter snap). Returns the release. */
export function interceptWheel(fn: Interceptor) {
  interceptor = fn;
  return () => {
    if (interceptor === fn) interceptor = null;
  };
}

/** Lenis' virtualScroll hook: lets the active interceptor (if any) take the event over. */
export function routeWheel(data: VirtualScrollData): boolean {
  if (interceptor && !interceptor(data)) {
    if (data.event.cancelable) data.event.preventDefault();
    return false;
  }
  return true;
}
