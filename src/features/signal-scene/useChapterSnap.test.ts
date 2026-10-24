import { describe, expect, it } from "vitest";
import { nextStop, settleStop } from "./useChapterSnap";

const stops = [0, 600, 1000, 1400, 1800];
const opts = { nudge: 36, fling: false };

describe("nextStop", () => {
  it("steps one chapter in the scroll direction", () => {
    expect(nextStop(stops, 0, 1)).toBe(600);
    expect(nextStop(stops, 600, 1)).toBe(1000);
    expect(nextStop(stops, 600, -1)).toBe(0);
    expect(nextStop(stops, 800, -1)).toBe(600);
  });
  it("has nothing past either end, so the page scrolls on", () => {
    expect(nextStop(stops, 1800, 1)).toBeUndefined();
    expect(nextStop(stops, 0, -1)).toBeUndefined();
  });
});

describe("settleStop", () => {
  it("leaves resting or out-of-hero positions alone", () => {
    expect(settleStop(stops, 1000, 600, opts)).toBeUndefined();
    expect(settleStop(stops, 2200, 1800, opts)).toBeUndefined();
  });
  it("a small nudge completes one step; a tiny one springs back", () => {
    expect(settleStop(stops, 1080, 1000, opts)).toBe(1400);
    expect(settleStop(stops, 1020, 1000, opts)).toBe(1000);
    expect(settleStop(stops, 930, 1000, opts)).toBe(600);
  });
  it("a fling settles on the nearest chapter", () => {
    expect(settleStop(stops, 1350, 0, { ...opts, fling: true })).toBe(1400);
    expect(settleStop(stops, 1080, 1000, { ...opts, fling: true })).toBe(1000);
  });
});
