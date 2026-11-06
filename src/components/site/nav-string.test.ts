import { describe, expect, it } from "vitest";
import { type Box, boxPath, flightPath, mulberry32, type Pt, windowAt } from "./nav-string";

const row = (x0: number, x1: number): Box => ({ x0, x1, y0: 20, y1: 50 });
const boxes = [
  row(0, 60),
  row(100, 180),
  row(220, 290),
  row(330, 420),
  row(460, 520),
  row(560, 640),
  row(680, 740),
];
const numbers = (d: string) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
const right: Pt = { x: 1, y: 0 };

/** Every cubic of an `M x y C ... C ...` flight, as control points. */
const cubics = (d: string): Pt[][] => {
  const n = numbers(d);
  const out: Pt[][] = [];
  let p: Pt = { x: n[0], y: n[1] };
  for (let i = 2; i + 5 < n.length; i += 6) {
    out.push([
      p,
      { x: n[i], y: n[i + 1] },
      { x: n[i + 2], y: n[i + 3] },
      { x: n[i + 4], y: n[i + 5] },
    ]);
    p = { x: n[i + 4], y: n[i + 5] };
  }
  return out;
};
const at = ([p0, p1, p2, p3]: Pt[], t: number): Pt => {
  const m = 1 - t;
  return {
    x: m ** 3 * p0.x + 3 * m * m * t * p1.x + 3 * m * t * t * p2.x + t ** 3 * p3.x,
    y: m ** 3 * p0.y + 3 * m * m * t * p1.y + 3 * m * t * t * p2.y + t ** 3 * p3.y,
  };
};
/** The flight as points 1px apart along its length. */
const sample = (d: string): Pt[] => {
  const dense = cubics(d).flatMap((c) => Array.from({ length: 800 }, (_, i) => at(c, i / 800)));
  const out = [dense[0]];
  let run = 0;
  for (let i = 1; i < dense.length; i++) {
    run += Math.hypot(dense[i].x - dense[i - 1].x, dense[i].y - dense[i - 1].y);
    if (run >= 1) {
      out.push(dense[i]);
      run = 0;
    }
  }
  return out;
};
const heading = (a: Pt, b: Pt) => Math.atan2(b.y - a.y, b.x - a.x);
/** Radius of the circle through three points. */
const radius = (a: Pt, b: Pt, c: Pt) => {
  const area2 = Math.abs((b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y));
  return area2 < 1e-9
    ? Number.POSITIVE_INFINITY
    : (Math.hypot(b.x - a.x, b.y - a.y) *
        Math.hypot(c.x - b.x, c.y - b.y) *
        Math.hypot(c.x - a.x, c.y - a.y)) /
        (2 * area2);
};

/** A trip between two boxes, as the driver sets it up: from the end of a rest underline heading right. */
const trip = (from: number, to: number, seed: number, y = 50) => {
  const dir = to > from ? 1 : -1;
  const passed: Box[] = [];
  for (let i = from + dir; i !== to; i += dir) passed.push(boxes[i]);
  const lead: Pt = { x: boxes[from].x1 - 6, y };
  return { lead, passed, target: boxes[to], fly: flightPath(lead, right, boxes[to], passed, seed) };
};
type Trip = ReturnType<typeof trip>;
const trips = (fn: (t: Trip, label: string) => void, y = 50) => {
  for (let from = 0; from < boxes.length; from++) {
    for (let to = 0; to < boxes.length; to++) {
      if (from === to) continue;
      for (let seed = 1; seed <= 40; seed++) {
        const t = trip(from, to, seed, y);
        fn(t, `${from}->${to} seed ${seed} ${t.fly.template}`);
      }
    }
  }
};

describe("boxPath", () => {
  const b = boxPath(row(100, 180));
  it("orders its marks s < u < e", () => {
    expect(b.s).toBeGreaterThan(0);
    expect(b.s).toBeLessThan(b.u);
    expect(b.u).toBeLessThan(b.e);
  });
  it("makes the underline exactly the bottom edge", () => {
    expect(b.u - b.s).toBeCloseTo(80 - 12);
  });
  it("starts at the lead-in point flights land on", () => {
    expect(b.start).toEqual({ x: 82, y: 56 });
    expect(b.land.x).toBeGreaterThan(0);
  });
});

describe("flightPath", () => {
  it("is smooth curves: only M and C commands", () => {
    trips((t) => expect(t.fly.d).not.toMatch(/[HVZALQhvzalq]/));
  });

  it("has no tight turns: radius of curvature >= 8px, heading change <= 20 degrees per 2px", () => {
    trips((t, label) => {
      const pts = sample(t.fly.d);
      for (let i = 2; i + 2 < pts.length; i++) {
        const turn = Math.abs(heading(pts[i], pts[i + 2]) - heading(pts[i - 2], pts[i]));
        const deg = (Math.min(turn, 2 * Math.PI - turn) * 180) / Math.PI;
        const where = `${label} at ${pts[i].x.toFixed(0)},${pts[i].y.toFixed(0)}`;
        // chords of 2px sag a little under the true radius, so allow half a pixel
        expect(radius(pts[i - 2], pts[i], pts[i + 2]), where).toBeGreaterThanOrEqual(7.5);
        expect(deg, where).toBeLessThanOrEqual(20);
      }
    });
  });

  it("stays between 8px over the target's box top and 36px under its bottom", () => {
    for (const y of [50, 56]) {
      trips((t, label) => {
        for (const p of sample(t.fly.d)) {
          expect(p.y, label).toBeGreaterThanOrEqual(20 - 8 - 0.01);
          expect(p.y, label).toBeLessThanOrEqual(50 + 36 + 0.01);
        }
      }, y);
    }
  });

  it("only loops with three or more passed labels, rightward, and uses every template", () => {
    const seen = new Set<string>();
    trips((t, label) => {
      seen.add(t.fly.template);
      if (t.fly.template === "loop") {
        expect(t.passed.length, label).toBeGreaterThanOrEqual(3);
        expect(t.target.x0, label).toBeGreaterThan(t.lead.x);
      }
    });
    expect([...seen].sort()).toEqual(["arc", "loop", "wave"]);
  });

  it("is reproducible from its seed and changes with it", () => {
    expect(trip(0, 5, 7).fly.d).toBe(trip(0, 5, 7).fly.d);
    const many = Array.from({ length: 12 }, (_, s) => trip(0, 5, s + 1).fly.d);
    expect(new Set(many).size).toBeGreaterThan(4);
  });

  it("starts at the lead point and ends at the target's lead-in start heading right", () => {
    trips((t, label) => {
      const c = cubics(t.fly.d);
      expect(c[0][0], label).toEqual(t.lead);
      const last = c.at(-1) as Pt[];
      expect(last[3], label).toEqual(boxPath(t.target).start);
      expect(last[3].x - last[2].x, label).toBeGreaterThan(0);
    });
  });

  it("leaves along the tangent it was given", () => {
    trips((t, label) => {
      const first = cubics(t.fly.d)[0];
      expect(first[1].x, label).toBeGreaterThan(first[0].x);
      expect(first[1].y, label).toBeCloseTo(first[0].y, 1);
    });
  });

  it("joins its cubics without a kink", () => {
    trips((t, label) => {
      const c = cubics(t.fly.d);
      for (let i = 1; i < c.length; i++) {
        const a = heading(c[i - 1][2], c[i - 1][3]);
        const b = heading(c[i][0], c[i][1]);
        expect(Math.abs(Math.sin(b - a)), label).toBeLessThan(0.02);
      }
    });
  });

  it("turns round smoothly when the line it leaves is heading against the trip", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const lead: Pt = { x: 120, y: 40 };
      const fly = flightPath(lead, { x: -1, y: 0 }, boxes[4], [boxes[2], boxes[3]], seed);
      const pts = sample(fly.d);
      expect(pts[3].x).toBeLessThan(lead.x);
      for (let i = 2; i + 2 < pts.length; i++) {
        expect(radius(pts[i - 2], pts[i], pts[i + 2]), `seed ${seed}`).toBeGreaterThanOrEqual(7.5);
      }
    }
  });

  it("reports the length of its path", () => {
    const { fly } = trip(0, 4, 3);
    const dense = cubics(fly.d).flatMap((c) =>
      Array.from({ length: 2001 }, (_, i) => at(c, i / 2000)),
    );
    let len = 0;
    for (let i = 1; i < dense.length; i++) {
      // the seam between two cubics repeats a point, which adds nothing
      len += Math.hypot(dense[i].x - dense[i - 1].x, dense[i].y - dense[i - 1].y);
    }
    expect(fly.len).toBeCloseTo(len, 0);
  });
});

describe("mulberry32", () => {
  it("repeats for a seed", () => {
    const a = mulberry32(5);
    const b = mulberry32(5);
    expect([a(), a()]).toEqual([b(), b()]);
  });
});

describe("windowAt", () => {
  const from = { a: 10, b: 40 };
  const to = { a: 100, b: 160 };

  it("starts at the old window and ends exactly on the new one", () => {
    expect(windowAt(from, to, 0)).toMatchObject(from);
    expect(windowAt(from, to, 1)).toMatchObject(to);
  });

  it("stretches forward: the head leads and the tail lags, never inverted", () => {
    const w = windowAt(from, to, 0.4);
    expect(w.dir).toBe(1);
    expect(w.head).toBe(w.b);
    expect(w.b - w.a).toBeGreaterThan(to.b - to.a);
    expect(w.a).toBeLessThanOrEqual(w.b);
  });

  it("leads with the left end when travelling back", () => {
    const w = windowAt(to, from, 0.4);
    expect(w.dir).toBe(-1);
    expect(w.head).toBe(w.a);
    expect(w.a).toBeLessThanOrEqual(w.b);
  });
});
