import { describe, expect, it, vi } from "vitest";
import { capWheelDelta, interceptWheel } from "./wheel";

const data = (type: string, deltaY: number) =>
  ({
    deltaX: 0,
    deltaY,
    event: { type, cancelable: true, preventDefault: vi.fn() },
  }) as unknown as Parameters<typeof capWheelDelta>[0];

describe("capWheelDelta", () => {
  it("caps big wheel jumps to one notch, both directions", () => {
    const down = data("wheel", 900);
    const up = data("wheel", -900);
    capWheelDelta(down);
    capWheelDelta(up);
    expect(down.deltaY).toBe(120);
    expect(up.deltaY).toBe(-120);
  });
  it("leaves normal wheel and touch deltas alone", () => {
    const wheel = data("wheel", 40);
    const touch = data("touchmove", 900);
    capWheelDelta(wheel);
    capWheelDelta(touch);
    expect(wheel.deltaY).toBe(40);
    expect(touch.deltaY).toBe(900);
  });
});

describe("interceptWheel", () => {
  it("a section can take a wheel event over, then hand the wheel back", () => {
    const release = interceptWheel(() => false);
    const taken = data("wheel", 40);
    expect(capWheelDelta(taken)).toBe(false);
    expect(
      (taken.event as unknown as { preventDefault: () => void }).preventDefault,
    ).toHaveBeenCalled();
    release();
    expect(capWheelDelta(data("wheel", 40))).toBe(true);
  });
});
