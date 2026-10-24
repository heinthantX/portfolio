import { describe, expect, it } from "vitest";
import {
  BASE_LAG,
  CAM_Z,
  CHAPTERS,
  chapterPose,
  FOV,
  flowStrength,
  type Pose,
  type Route,
  streamEnergy,
  streamLag,
  travelRoute,
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
  const bezier = (a: Pose, r: Route, b: Pose, t: number) => {
    const u = 1 - t;
    const at = (k: "x" | "y", c1: number, c2: number) =>
      u ** 3 * a[k] + 3 * u * u * t * c1 + 3 * u * t * t * c2 + t ** 3 * b[k];
    return {
      x: at("x", r.c1.x, r.c2.x),
      y: at("y", r.c1.y, r.c2.y),
      z: 3 * u * u * t * r.c1.z + 3 * u * t * t * r.c2.z,
    };
  };
  const leg = (k: number, view: { w: number; h: number; mobile: boolean }) => {
    const from = chapterPose(k, view);
    const to = chapterPose(k + 1, view);
    const r = travelRoute(k, from, to, view);
    const path = Array.from({ length: 41 }, (_, i) => bezier(from, r, to, i / 40));
    return { from, to, r, path, mid: path[20] };
  };
  const desk = { w: (H * 1440) / 900, h: H, mobile: false };
  const phone = { w: (H * 390) / 844, h: H, mobile: true };

  it("curves on every boundary rather than sliding in a straight line", () => {
    for (const view of [desk, phone])
      for (let k = 0; k < CHAPTERS - 1; k++) {
        const { from, to, mid } = leg(k, view);
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        expect(Math.hypot(mid.x - mx, mid.y - my, mid.z)).toBeGreaterThan(0.1);
      }
  });

  it("sinks the name into the wave, lifts the wave into the column and arcs home", () => {
    const fall = leg(0, desk);
    expect(fall.mid.y).toBeLessThan((fall.from.y + fall.to.y) / 2);
    expect(fall.mid.z).toBeGreaterThan(0);
    const rise = leg(1, desk);
    // rises before it sweeps right: mid-route sits above and left of the straight line's midpoint
    expect(rise.mid.y).toBeGreaterThan((rise.from.y + rise.to.y) / 2);
    expect(rise.mid.x).toBeLessThan((rise.from.x + rise.to.x) / 2);
    const home = leg(CHAPTERS - 2, desk);
    expect(home.mid.y).toBeGreaterThan((home.from.y + home.to.y) / 2);
    for (const k of [0, 1, CHAPTERS - 2]) {
      const { r } = leg(k, desk);
      expect([r.spinX, r.spinY, r.grow]).toEqual([0, 0, 0]);
    }
  });

  it("gives each layer change its own flight", () => {
    const max = (xs: number[]) => Math.max(...xs);
    const min = (xs: number[]) => Math.min(...xs);
    // interface -> api: steps toward the camera and swings out wide, a little bigger
    const swoop = leg(2, desk);
    expect(max(swoop.path.map((p) => p.z))).toBeGreaterThan(0.6);
    expect(max(swoop.path.map((p) => p.x)) - swoop.from.x).toBeGreaterThan(0.05 * desk.w);
    expect(swoop.r.grow).toBeGreaterThan(0);
    // api -> data: sinks well below and away from the camera, smaller, then rises from below
    const dive = leg(3, desk);
    const low = dive.path.reduce((a, p) => (p.y < a.y ? p : a));
    expect(dive.from.y - low.y).toBeGreaterThan(0.2 * desk.h);
    expect(low.z).toBeLessThan(-0.4);
    expect(dive.r.grow).toBeLessThan(0);
    const end = dive.path.length - 1;
    expect(dive.path[end - 2].y).toBeLessThan(dive.to.y); // arrives from below
    // data -> infra: up and out first, then curls round with a partial turn that unwinds
    const orbit = leg(4, desk);
    expect(max(orbit.path.slice(0, 20).map((p) => p.y))).toBeGreaterThan(0.12 * desk.h);
    expect(min(orbit.path.slice(20).map((p) => p.y))).toBeLessThan(-0.04 * desk.h);
    expect(Math.abs(orbit.r.spinY)).toBeGreaterThanOrEqual(0.6);
    expect(Math.abs(orbit.r.spinY)).toBeLessThanOrEqual(1);
    // none of them is the old shallow dip: each sets off in its own direction (in depth too)
    const lead = [swoop, dive, orbit].map(({ from, r }) => {
      const v = [r.c1.x - from.x, r.c1.y - from.y, r.c1.z];
      const n = Math.hypot(...v);
      return v.map((c) => c / n);
    });
    for (let i = 0; i < 3; i++)
      for (let j = i + 1; j < 3; j++) {
        const cos = lead[i].reduce((a, c, n) => a + c * lead[j][n], 0);
        expect(Math.acos(cos)).toBeGreaterThan(0.6);
      }
  });

  it.each(views)("stays inside the view and off the text column at $name", ({ w, mobile }) => {
    const view = { w, h: H, mobile };
    for (let k = 0; k < CHAPTERS - 1; k++) {
      const { r, path } = leg(k, view);
      for (const c of [r.c1, r.c2]) expect(Math.abs(c.z)).toBeLessThanOrEqual(1);
      expect(Math.abs(r.spinX)).toBeLessThanOrEqual(1);
      expect(Math.abs(r.spinY)).toBeLessThanOrEqual(1);
      expect(Math.abs(r.grow)).toBeLessThanOrEqual(0.2);
      for (const p of path) {
        expect(Math.abs(p.x)).toBeLessThanOrEqual(0.4 * w + 1e-9);
        expect(Math.abs(p.y)).toBeLessThanOrEqual(0.5 * H + 1e-9);
        // layer text sits left of centre: the travel never swings across it
        if (!mobile && k >= 1) expect(p.x).toBeGreaterThanOrEqual(-1e-9);
      }
    }
  });

  it("bends and turns less on phones, where travel is mostly vertical", () => {
    for (let k = 0; k < CHAPTERS - 1; k++) {
      const d = leg(k, desk);
      const m = leg(k, phone);
      expect(Math.abs(m.mid.z)).toBeLessThan(Math.abs(d.mid.z) + 1e-9);
      expect(Math.abs(m.r.spinY)).toBeLessThanOrEqual(Math.abs(d.r.spinY));
      for (const c of [m.r.c1, m.r.c2]) expect(Math.abs(c.x)).toBeLessThan(0.2 * phone.w);
      // phone text sits under the formation: no flight sinks far into it
      if (k >= 2 && k <= 4)
        expect(Math.min(...m.path.map((p) => p.y))).toBeGreaterThan(m.from.y - 0.12 * phone.h);
    }
  });
});
