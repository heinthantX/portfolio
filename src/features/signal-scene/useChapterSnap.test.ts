import { afterEach, describe, expect, it, vi } from "vitest";
import { nextStop, playSeconds, settleStop, wheelMode } from "./useChapterSnap";

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
  it("a slow scroll that stopped mid-chapter finishes it in the direction it was going", () => {
    // went past chapter 1 and stopped short of chapter 2: forward to 2, not back to the nearer 1
    expect(settleStop(stops, 1050, 0, opts)).toBe(1400);
    expect(settleStop(stops, 1350, 1800, opts)).toBe(1000);
  });
  it("a fling carries on to the next chapter in its direction, never back", () => {
    expect(settleStop(stops, 1350, 0, { ...opts, fling: true })).toBe(1400);
    expect(settleStop(stops, 1420, 0, { ...opts, fling: true })).toBe(1800);
    expect(settleStop(stops, 1100, 1800, { ...opts, fling: true })).toBe(1000);
  });
});

describe("wheelMode", () => {
  const g = { speed: 0, travelled: 0, elapsed: 0, swipes: 0 };
  it("follows a slow wheel or a single notch", () => {
    expect(wheelMode({ ...g, speed: 400, travelled: 40, elapsed: 100 })).toBe("follow");
    expect(wheelMode({ ...g, speed: 1000, travelled: 100 })).toBe("follow");
  });
  it("plays one chapter for a normal swipe, however hard", () => {
    expect(wheelMode({ ...g, speed: 2400, travelled: 300, elapsed: 60, swipes: 1 })).toBe("step");
    expect(wheelMode({ ...g, speed: 6000, travelled: 1500, elapsed: 250, swipes: 1 })).toBe("step");
  });
  it("scrolls freely only for a hard fling or a burst of swipes", () => {
    expect(wheelMode({ ...g, speed: 12000, travelled: 2600, elapsed: 220, swipes: 1 })).toBe(
      "free",
    );
    expect(wheelMode({ ...g, speed: 2400, travelled: 300, elapsed: 60, swipes: 3 })).toBe("free");
    // the same distance spread over a long gesture is not a fling
    expect(wheelMode({ ...g, speed: 2400, travelled: 2600, elapsed: 900, swipes: 1 })).toBe("step");
  });
});

describe("playSeconds", () => {
  it("plays a full chapter at one pace and remainders at the same pace", () => {
    expect(playSeconds(400, 400)).toBeCloseTo(2);
    expect(playSeconds(-300, 400)).toBeCloseTo(1.5);
    expect(playSeconds(1200, 400)).toBeCloseTo(2);
    expect(playSeconds(10, 400)).toBeCloseTo(1);
  });

  describe("pace from env", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
      vi.resetModules();
    });
    const load = async (step: string, min: string) => {
      vi.stubEnv("NEXT_PUBLIC_CHAPTER_STEP_S", step);
      vi.stubEnv("NEXT_PUBLIC_CHAPTER_MIN_S", min);
      vi.resetModules();
      return (await import("./useChapterSnap")).playSeconds;
    };
    it("reads the step and minimum seconds", async () => {
      const play = await load("3", "1.5");
      expect(play(400, 400)).toBeCloseTo(3);
      expect(play(10, 400)).toBeCloseTo(1.5);
    });
    it("falls back to 2s / 1s on bad values and never lets the minimum pass the step", async () => {
      expect((await load("abc", "-1"))(400, 400)).toBeCloseTo(2);
      expect((await load("abc", "-1"))(10, 400)).toBeCloseTo(1);
      expect((await load("1", "5"))(10, 400)).toBeCloseTo(1);
    });
  });
});
