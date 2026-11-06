import { describe, expect, it, vi } from "vitest";
import { interceptWheel, routeWheel } from "./wheel";

const data = (type: string, deltaY: number) =>
  ({
    deltaX: 0,
    deltaY,
    event: { type, cancelable: true, preventDefault: vi.fn() },
  }) as unknown as Parameters<typeof routeWheel>[0];

describe("routeWheel", () => {
  it("passes wheel and touch deltas through unchanged", () => {
    const big = data("wheel", 900);
    const touch = data("touchmove", -900);
    expect(routeWheel(big)).toBe(true);
    expect(routeWheel(touch)).toBe(true);
    expect(big.deltaY).toBe(900);
    expect(touch.deltaY).toBe(-900);
  });
});

describe("interceptWheel", () => {
  it("a section can take a wheel event over, then hand the wheel back", () => {
    const release = interceptWheel(() => false);
    const taken = data("wheel", 40);
    expect(routeWheel(taken)).toBe(false);
    expect(
      (taken.event as unknown as { preventDefault: () => void }).preventDefault,
    ).toHaveBeenCalled();
    release();
    expect(routeWheel(data("wheel", 40))).toBe(true);
  });
});
