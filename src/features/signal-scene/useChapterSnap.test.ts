import { afterEach, describe, expect, it, vi } from "vitest";
import { nextStop, playSeconds, settleStop, wheelMode } from "./useChapterSnap";

const stops = [0, 600, 1000, 1400, 1800];
const opts = { nudge: 36 };

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
});

describe("wheelMode", () => {
  // threshold = chapterPx / (HERO_GAIN * STEP_S) = 485 / 1.15 ~ 422 px/s at the default 1s
  const chapterPx = 485;
  it("scrubs a wheel slower than one chapter per STEP_S", () => {
    expect(wheelMode({ speed: 0, chapterPx })).toBe("follow");
    expect(wheelMode({ speed: 410, chapterPx })).toBe("follow");
  });
  it("plays the next chapter for anything faster, however hard", () => {
    expect(wheelMode({ speed: 430, chapterPx })).toBe("step");
    expect(wheelMode({ speed: 12000, chapterPx })).toBe("step");
  });
  it("scales the threshold with the chapter height", () => {
    expect(wheelMode({ speed: 600, chapterPx: 485 })).toBe("step");
    expect(wheelMode({ speed: 600, chapterPx: 900 })).toBe("follow");
    expect(wheelMode({ speed: 600, chapterPx: 250 })).toBe("step");
  });
});

describe("playSeconds", () => {
  it("plays a full chapter at one pace and remainders at the same pace", () => {
    expect(playSeconds(400, 400)).toBeCloseTo(1);
    expect(playSeconds(-300, 400)).toBeCloseTo(0.75);
    expect(playSeconds(1200, 400)).toBeCloseTo(1);
    expect(playSeconds(10, 400)).toBeCloseTo(0.4);
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
    it("falls back to 1s / 0.4s on bad values and never lets the minimum pass the step", async () => {
      expect((await load("abc", "-1"))(400, 400)).toBeCloseTo(1);
      expect((await load("abc", "-1"))(10, 400)).toBeCloseTo(0.4);
      expect((await load("2", "5"))(10, 400)).toBeCloseTo(2);
    });
  });
});
