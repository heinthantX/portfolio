import { describe, expect, it } from "vitest";
import { courierPoints, type GuideState, shouldStartGuide, sinceLast } from "./useHeroGuide";

const ok: GuideState = {
  atTop: true,
  idleMs: 4500,
  reducedMotion: false,
  sinceLastMs: Number.POSITIVE_INFINITY,
  visible: true,
  fallback: false,
};

describe("shouldStartGuide", () => {
  it("starts on a fresh visit at the first stop", () => {
    expect(shouldStartGuide(ok)).toBe(true);
  });
  it("plays again 15s after the last start", () => {
    expect(shouldStartGuide({ ...ok, sinceLastMs: 15_000 })).toBe(true);
  });
  it.each([
    ["scrolled away", { atTop: false }],
    ["used the page under 4.5s ago", { idleMs: 4499 }],
    ["reduced motion", { reducedMotion: true }],
    ["played under 15s ago", { sinceLastMs: 14_999 }],
    ["hidden tab", { visible: false }],
    ["no WebGL", { fallback: true }],
  ])("stays off when %s", (_name, patch) => {
    expect(shouldStartGuide({ ...ok, ...patch })).toBe(false);
  });
});

describe("sinceLast", () => {
  it("is open before the first play of the session", () => {
    expect(sinceLast(0, 1000, 2000)).toBe(Number.POSITIVE_INFINITY);
  });
  it("counts from the last start", () => {
    expect(sinceLast(5000, 1000, 20_000)).toBe(15_000);
  });
  it("after a reload counts from the load, so only the session's first play comes at 4.5s", () => {
    expect(sinceLast(1000, 50_000, 54_500)).toBe(4500);
  });
});

describe("courierPoints", () => {
  const desktop = { from: { x: 640, y: 380 }, to: { x: 1250, y: 450 } };
  const mobile = { from: { x: 195, y: 560 }, to: { x: 140, y: 820 } };

  it.each([
    ["desktop (rail on the right)", desktop],
    ["mobile (rail at the bottom)", mobile],
  ])("starts at the name and lands exactly on the tick: %s", (_name, { from, to }) => {
    const pts = courierPoints(from, to, 28);
    expect(pts).toHaveLength(29);
    expect(pts[0]).toEqual(from);
    expect(pts[28]).toEqual(to);
  });

  it("bows upward off the straight line, so the flight is curved", () => {
    const { from, to } = desktop;
    const mid = courierPoints(from, to, 28)[14];
    const lineY = from.y + (to.y - from.y) * ((mid.x - from.x) / (to.x - from.x));
    expect(mid.y).toBeLessThan(lineY - 20);
  });

  it("eases: slow near both ends, fast in the middle", () => {
    const pts = courierPoints(desktop.from, desktop.to, 28);
    const step = (i: number) => Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
    expect(step(0)).toBeLessThan(step(14) / 4);
    expect(step(27)).toBeLessThan(step(14) / 4);
  });
});
