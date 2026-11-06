import { describe, expect, it } from "vitest";
import {
  courierPoints,
  GUIDE_DELAY_MS,
  GUIDE_EVERY_MS,
  type GuideState,
  guideWait,
  quietMs,
  shouldStartGuide,
} from "./useHeroGuide";

const ok: GuideState = {
  atStop: true,
  quietMs: 4500,
  played: false,
  reducedMotion: false,
  visible: true,
  fallback: false,
};

describe("guideWait", () => {
  it("is 4.5s for the first play of the session and 15s after", () => {
    expect(guideWait(false)).toBe(GUIDE_DELAY_MS);
    expect(guideWait(true)).toBe(GUIDE_EVERY_MS);
  });
});

describe("shouldStartGuide", () => {
  it("first play comes at 4500ms quiet, not before", () => {
    expect(shouldStartGuide(ok)).toBe(true);
    expect(shouldStartGuide({ ...ok, quietMs: 4499 })).toBe(false);
  });
  it("a later play comes at 15000ms quiet, not before", () => {
    expect(shouldStartGuide({ ...ok, played: true, quietMs: 15_000 })).toBe(true);
    expect(shouldStartGuide({ ...ok, played: true, quietMs: 14_999 })).toBe(false);
    expect(shouldStartGuide({ ...ok, played: true, quietMs: 4500 })).toBe(false);
  });
  it.each([
    ["not resting on a chapter", { atStop: false }],
    ["reduced motion", { reducedMotion: true }],
    ["hidden tab", { visible: false }],
    ["no WebGL", { fallback: true }],
  ])("stays off when %s", (_name, patch) => {
    expect(shouldStartGuide({ ...ok, ...patch })).toBe(false);
  });
});

describe("quietMs", () => {
  it("counts from the latest mark: an input, a settle, a start or the canvas being ready", () => {
    expect(quietMs(20_000, [1000, 2000, 3000, 500])).toBe(17_000);
  });
  it("restarts when the page settles on a chapter or the reader gives input", () => {
    const marks = { input: 1000, settledAt: 2000, last: 0, ready: 500 };
    const at = (now: number, m: typeof marks) => quietMs(now, Object.values(m));
    expect(at(6500, marks)).toBe(4500);
    expect(at(6500, { ...marks, settledAt: 5000 })).toBe(1500);
    expect(at(6500, { ...marks, input: 6000 })).toBe(500);
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
