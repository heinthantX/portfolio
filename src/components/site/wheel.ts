import type { VirtualScrollData } from "lenis";

/** One wheel event moves at most ~one notch, so high-sensitivity / free-spin wheels glide instead of jumping. */
const MAX_WHEEL_DELTA = 120;

export function capWheelDelta(data: VirtualScrollData): boolean {
  if (data.event.type === "wheel") {
    data.deltaY = Math.max(-MAX_WHEEL_DELTA, Math.min(MAX_WHEEL_DELTA, data.deltaY));
    data.deltaX = Math.max(-MAX_WHEEL_DELTA, Math.min(MAX_WHEEL_DELTA, data.deltaX));
  }
  return true;
}
