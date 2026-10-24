import { describe, expect, it } from "vitest";
import {
  BASE_LAG,
  CAM_Z,
  CHAPTERS,
  chapterPose,
  FOV,
  flowStrength,
  type Pose,
  routeControl,
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

describe("route between chapters", () => {
  const bezier = (a: Pose, c: { x: number; y: number }, b: Pose, t: number) => ({
    x: (1 - t) ** 2 * a.x + 2 * t * (1 - t) * c.x + t * t * b.x,
    y: (1 - t) ** 2 * a.y + 2 * t * (1 - t) * c.y + t * t * b.y,
  });
  const leg = (k: number, view: { w: number; h: number; mobile: boolean }) => {
    const from = chapterPose(k, view);
    const to = chapterPose(k + 1, view);
    return { from, to, c: routeControl(k, from, to, view) };
  };
  const desk = { w: (H * 1440) / 900, h: H, mobile: false };
  const phone = { w: (H * 390) / 844, h: H, mobile: true };

  it("curves on every boundary rather than sliding in a straight line", () => {
    for (const view of [desk, phone])
      for (let k = 0; k < CHAPTERS - 1; k++) {
        const { from, to, c } = leg(k, view);
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        expect(Math.hypot(c.x - mx, c.y - my, c.z)).toBeGreaterThan(0.1);
      }
  });

  it("sinks the name into the wave and lifts the wave into the column", () => {
    const fall = leg(0, desk);
    expect(fall.c.y).toBeLessThan((fall.from.y + fall.to.y) / 2);
    expect(fall.c.z).toBeGreaterThan(0);
    const rise = leg(1, desk);
    // rises before it sweeps right: the control point sits above and left of the midpoint
    expect(rise.c.y).toBeGreaterThan((rise.from.y + rise.to.y) / 2);
    expect(rise.c.x).toBeLessThan((rise.from.x + rise.to.x) / 2);
    const home = leg(CHAPTERS - 2, desk);
    expect(home.c.y).toBeGreaterThan((home.from.y + home.to.y) / 2);
  });

  it("dips between layers that share a side", () => {
    for (let k = 2; k < 5; k++) {
      const { from, to, c } = leg(k, desk);
      expect(c.y).toBeLessThan(Math.min(from.y, to.y));
    }
  });

  it.each(views)("stays inside the view and off the text column at $name", ({ w, mobile }) => {
    const view = { w, h: H, mobile };
    for (let k = 0; k < CHAPTERS - 1; k++) {
      const { from, to, c } = leg(k, view);
      expect(Math.abs(c.z)).toBeLessThanOrEqual(1);
      for (let t = 0; t <= 1.0001; t += 0.05) {
        const p = bezier(from, c, to, t);
        expect(Math.abs(p.x)).toBeLessThanOrEqual(0.4 * w + 1e-9);
        expect(Math.abs(p.y)).toBeLessThanOrEqual(0.5 * H + 1e-9);
        // layer text sits left of centre: the travel never swings across it
        if (!mobile && k >= 1) expect(p.x).toBeGreaterThanOrEqual(-1e-9);
      }
    }
  });

  it("bends less on phones, where travel is mostly vertical", () => {
    for (let k = 0; k < CHAPTERS - 1; k++) {
      const d = leg(k, desk);
      const m = leg(k, phone);
      expect(Math.abs(m.c.z)).toBeLessThan(Math.abs(d.c.z));
      expect(Math.abs(m.c.x)).toBeLessThan(0.2 * phone.w);
    }
  });
});
