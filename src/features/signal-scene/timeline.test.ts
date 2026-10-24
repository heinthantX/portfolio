import { describe, expect, it } from "vitest";
import {
  BASE_LAG,
  CAM_Z,
  chapterPose,
  FOV,
  flowStrength,
  streamEnergy,
  streamLag,
  WAVE_CHAPTER,
} from "./timeline";

const H = 2 * CAM_Z * Math.tan((FOV * Math.PI) / 360);
const views = [
  { name: "desktop 1440x900", w: (H * 1440) / 900, mobile: false },
  { name: "laptop 1280x720", w: (H * 1280) / 720, mobile: false },
  { name: "laptop 1512x862", w: (H * 1512) / 862, mobile: false },
  { name: "laptop 1470x832", w: (H * 1470) / 832, mobile: false },
  { name: "laptop 1366x768", w: (H * 1366) / 768, mobile: false },
  { name: "laptop 1280x680", w: (H * 1280) / 680, mobile: false },
  { name: "desktop 1920x969", w: (H * 1920) / 969, mobile: false },
  { name: "ultrawide 2560x1080", w: (H * 2560) / 1080, mobile: false },
  { name: "tablet 820x1180", w: (H * 820) / 1180, mobile: false },
  { name: "mobile 390x844", w: (H * 390) / 844, mobile: true },
  { name: "mobile 360x740", w: (H * 360) / 740, mobile: true },
];

describe("chapterPose: wave", () => {
  it.each(views)("reaches the bottom of the view at $name", ({ w, mobile }) => {
    const p = chapterPose(WAVE_CHAPTER, { w, h: H, mobile });
    const nearY = p.y - p.scale * Math.sin(p.rotX);
    const nearDepth = CAM_Z - p.scale * Math.cos(p.rotX);
    expect(-nearY / nearDepth).toBeGreaterThanOrEqual(Math.tan((FOV * Math.PI) / 360));
  });
});

describe("stream", () => {
  it("runs strongest on the intro -> wave boundary and milder elsewhere", () => {
    expect(flowStrength(0)).toBe(1);
    expect(flowStrength(0.6)).toBe(1);
    for (let k = 1; k < 6; k++) {
      expect(flowStrength(k)).toBeGreaterThanOrEqual(0.35);
      expect(flowStrength(k)).toBeLessThanOrEqual(0.5);
    }
    expect(flowStrength(-1)).toBe(1);
    expect(flowStrength(99)).toBe(flowStrength(5));
  });

  it("eases energy toward scroll speed, clamped, frame-rate independent", () => {
    const run = (fps: number, seconds: number, speed: number) => {
      let e = 0;
      for (let i = 0; i < fps * seconds; i++) e = streamEnergy(e, speed / fps, 1 / fps);
      return e;
    };
    expect(run(60, 0.3, 1)).toBeCloseTo(run(144, 0.3, 1), 2);
    expect(run(60, 3, 100)).toBeLessThanOrEqual(1);
    expect(run(60, 3, 100)).toBeGreaterThan(0.99);
    expect(run(60, 0.05, 100)).toBeLessThan(0.5); // no pop on one fast frame
  });

  it("settles back toward calm when the scroll stops and ignores bad frames", () => {
    let e = 1;
    for (let i = 0; i < 180; i++) e = streamEnergy(e, 0, 1 / 60);
    expect(e).toBeLessThan(0.01);
    expect(streamEnergy(0.4, 1, 0)).toBe(0.4);
    expect(streamEnergy(0.4, Number.NaN, 1 / 60)).toBe(0.4);
  });

  it("keeps today's stagger at rest and spreads it with energy", () => {
    expect(streamLag(1, 0)).toBe(BASE_LAG);
    expect(streamLag(0.42, 1)).toBeGreaterThan(BASE_LAG);
    expect(streamLag(1, 1)).toBeGreaterThan(streamLag(0.42, 1));
    expect(streamLag(5, 5)).toBe(streamLag(1, 1));
  });
});
