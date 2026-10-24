import type { VirtualScrollData } from "lenis";

/** One wheel event moves at most ~one notch, so high-sensitivity / free-spin wheels glide instead of jumping. */
const MAX_WHEEL_DELTA = 120;

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

export function capWheelDelta(data: VirtualScrollData): boolean {
  if (data.event.type === "wheel") {
    data.deltaY = Math.max(-MAX_WHEEL_DELTA, Math.min(MAX_WHEEL_DELTA, data.deltaY));
    data.deltaX = Math.max(-MAX_WHEEL_DELTA, Math.min(MAX_WHEEL_DELTA, data.deltaX));
  }
  if (interceptor && !interceptor(data)) {
    if (data.event.cancelable) data.event.preventDefault();
    return false;
  }
  return true;
}
