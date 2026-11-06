/** Padding of the traced box around a label, and its corner radius. */
export const PAD_X = 9;
export const PAD_Y = 5;
export const R = 6;
/** ms the string waits after the hover ends before it retreats: the dive's pull-back (0.1s delay +
 * 0.3s in globals.css) must finish first, so the line never leaves the box with the dive still in it. */
export const RETREAT_MS = 400;
/** Fallbacks for the `--string-ms` / `--string-ease` custom properties on the nav in globals.css,
 * which are the single definition of the tween (the card's glide, the cross and the dive delays use
 * them too, so they stay in step). */
const DEFAULT_MS = 600;
/** Share of the tween the trailing end waits before it starts to move. */
const LAG = 0.2;
/** Windows shorter than this (px) are hidden: a zero-length dash with round caps would draw a dot. */
const MIN = 0.5;

export type Pt = { x: number; y: number };
export type Box = { x0: number; x1: number; y0: number; y1: number };
export type Win = { a: number; b: number };
type Cubic = [Pt, Pt, Pt, Pt];

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const clamp01 = (n: number) => clamp(n, 0, 1);
const f = (n: number) => String(Math.round(n * 100) / 100);
const pt = (p: Pt) => `${f(p.x)} ${f(p.y)}`;
const curve = (c: Cubic) => `C${pt(c[1])} ${pt(c[2])} ${pt(c[3])}`;

/** CSS cubic-bezier easing as a function of progress. */
export function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0;
    let hi = 1;
    let t = x;
    for (let i = 0; i < 24; i++) {
      t = (lo + hi) / 2;
      if (((ax * t + bx) * t + cx) * t < x) lo = t;
      else hi = t;
    }
    return ((ay * t + by) * t + cy) * t;
  };
}

const defaultEase = bezier(0.55, 0, 0.25, 1);

/** Small seeded generator, so one flight's variation is fixed once and reproducible in tests. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cubicAt = ([p0, p1, p2, p3]: Cubic, t: number): Pt => {
  const m = 1 - t;
  const a = m * m * m;
  const b = 3 * m * m * t;
  const c = 3 * m * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
};

/** Length of a cubic bezier, by summing 32 chords (far under 0.1px off at nav scale). */
function cubicLength(c: Cubic) {
  let len = 0;
  let prev = c[0];
  for (let i = 1; i <= 32; i++) {
    const p = cubicAt(c, i / 32);
    len += Math.hypot(p.x - prev.x, p.y - prev.y);
    prev = p;
  }
  return len;
}

/** Tightest radius of curvature and y range of cubics, found at 40 samples each. */
function bend(cs: Cubic[]) {
  let radius = Number.POSITIVE_INFINITY;
  let lo = Number.POSITIVE_INFINITY;
  let hi = Number.NEGATIVE_INFINITY;
  for (const [p0, p1, p2, p3] of cs) {
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const m = 1 - t;
      const y = cubicAt([p0, p1, p2, p3], t).y;
      lo = Math.min(lo, y);
      hi = Math.max(hi, y);
      const dx = 3 * (m * m * (p1.x - p0.x) + 2 * m * t * (p2.x - p1.x) + t * t * (p3.x - p2.x));
      const dy = 3 * (m * m * (p1.y - p0.y) + 2 * m * t * (p2.y - p1.y) + t * t * (p3.y - p2.y));
      const ddx = 6 * (m * (p2.x - 2 * p1.x + p0.x) + t * (p3.x - 2 * p2.x + p1.x));
      const ddy = 6 * (m * (p2.y - 2 * p1.y + p0.y) + t * (p3.y - 2 * p2.y + p1.y));
      const k = Math.abs(dx * ddy - dy * ddx) / Math.hypot(dx, dy) ** 3;
      if (k > 0) radius = Math.min(radius, 1 / k);
    }
  }
  return { radius, lo, hi };
}

export type BoxShape = {
  /** Whole shape, starting with its `M`. */
  d: string;
  /** The same without the leading `M`, to append after a flight that ends on `start`. */
  body: string;
  /** Where the lead-in begins: the flight lands here, heading along `land`. */
  start: Pt;
  land: Pt;
  /** Arc lengths: `s` where the bottom edge starts (after the lead-in), `u` where it ends, `e` where
   * the box has closed again at the bottom-left. Rest shows [s, u], hover [s, e]. */
  s: number;
  u: number;
  e: number;
};

/**
 * One link's shape, in nav-local px: a lead-in curve from the lower left, then the rounded box traced
 * round the label (bottom edge, right side, top, left side, closing at the bottom-left, where the
 * per-link cross starts).
 */
export function boxPath({ x0, x1, y0, y1 }: Box): BoxShape {
  const start = { x: x0 - 18, y: y1 + 6 };
  const ctrl = { x: x0 - 4, y: y1 };
  const a = { x: x0 + R, y: y1 };
  // the lead-in quadratic, as the equivalent cubic so one routine measures every curve
  const lead: Cubic = [
    start,
    { x: start.x + (2 / 3) * (ctrl.x - start.x), y: start.y + (2 / 3) * (ctrl.y - start.y) },
    { x: a.x + (2 / 3) * (ctrl.x - a.x), y: a.y + (2 / 3) * (ctrl.y - a.y) },
    a,
  ];
  const w = x1 - x0 - 2 * R;
  const h = y1 - y0 - 2 * R;
  const s = cubicLength(lead);
  const body =
    `Q${ctrl.x} ${ctrl.y} ${a.x} ${a.y} H${x1 - R} A${R} ${R} 0 0 0 ${x1} ${y1 - R} V${y0 + R} ` +
    `A${R} ${R} 0 0 0 ${x1 - R} ${y0} H${x0 + R} A${R} ${R} 0 0 0 ${x0} ${y0 + R} V${y1 - R} ` +
    `A${R} ${R} 0 0 0 ${x0 + R} ${y1}`;
  const dx = ctrl.x - start.x;
  const dy = ctrl.y - start.y;
  const dl = Math.hypot(dx, dy);
  return {
    d: `M${start.x} ${start.y} ${body}`,
    body,
    start,
    land: { x: dx / dl, y: dy / dl },
    s,
    u: s + w,
    e: s + 2 * w + 2 * h + 2 * Math.PI * R,
  };
}

type Node = { p: Pt; h: Pt };

/** How far a flight may rise above the target's box top, or sag below its bottom. */
const ABOVE = 8;
const BELOW = 36;
const K = 0.5523;
/** Tightest turn a flight may take, in px of radius (the test allows 8, this leaves margin). */
const MIN_RADIUS = 9.5;

const toward = (p: Pt, h: Pt, k: number): Pt => ({ x: p.x + h.x * k, y: p.y + h.y * k });

/** G1 cubics through nodes that each carry a heading; handles are ~0.42 of the horizontal run. */
function through(nodes: Node[]): Cubic[] {
  const out: Cubic[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i];
    const b = nodes[i + 1];
    const m = 0.42 * Math.abs(b.p.x - a.p.x) + 0.12 * Math.abs(b.p.y - a.p.y);
    out.push([a.p, toward(a.p, a.h, m), toward(b.p, b.h, -m), b.p]);
  }
  return out;
}

/** A half circle of radius r from `p`, turning down: ends 2r below `p`, heading the other way. The first
 * handle follows `h` when it already points the same way, so it joins the line before it smoothly. */
function halfTurn(p: Pt, sx: number, r: number, h: Pt): Cubic[] {
  const k = K * r;
  const first = h.x * sx > 0.5 ? h : { x: sx, y: 0 };
  const mid = { x: p.x + sx * r, y: p.y + r };
  const end = { x: p.x, y: p.y + 2 * r };
  return [
    [p, toward(p, first, k), { x: mid.x, y: mid.y - k }, mid],
    [mid, { x: mid.x, y: mid.y + k }, { x: p.x + sx * k, y: end.y }, end],
  ];
}

/** A full circle of radius r hanging below `p`, entered and left tangentially heading `dir`. */
function ring(p: Pt, dir: number, r: number): Cubic[] {
  const k = K * r;
  const c = { x: p.x, y: p.y + r };
  const right = { x: c.x + dir * r, y: c.y };
  const bottom = { x: c.x, y: c.y + r };
  const left = { x: c.x - dir * r, y: c.y };
  return [
    [p, { x: p.x + dir * k, y: p.y }, { x: right.x, y: right.y - k }, right],
    [right, { x: right.x, y: right.y + k }, { x: bottom.x + dir * k, y: bottom.y }, bottom],
    [bottom, { x: bottom.x - dir * k, y: bottom.y }, { x: left.x, y: left.y + k }, left],
    [left, { x: left.x, y: left.y - k }, { x: p.x - dir * k, y: p.y }, p],
  ];
}

export type FlightTemplate = "arc" | "wave" | "loop";

const unit = (v: Pt): Pt => {
  const l = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / l, y: v.y / l };
};

/**
 * The travel between two links, drawn like a flight-route line: one of a few smooth templates (a wide
 * arc, an S-wave of two or three even lobes, or a wide arc with one round loop) instead of random
 * angles. A seed fixes the template, the side and the size once per flight. It leaves `lead` along
 * `tangent` and lands on the target's lead-in start heading right. A leftward trip first turns round
 * in a half circle, runs under the labels and rises into the lead-in out of a second half circle.
 * The curve stays between `ABOVE` px over the target's box top and `BELOW` px under its bottom.
 * `passed` are the boxes strictly between the lead point and the target, in travel order. A loop
 * needs three of them and only rightward trips take one. Only `M` and `C` commands.
 */
export function flightPath(lead: Pt, tangent: Pt, target: Box, passed: Box[], seed: number) {
  const rnd = mulberry32(seed);
  const { start: end, land } = boxPath(target);
  const dir = end.x >= lead.x ? 1 : -1;
  const pick = rnd();
  const sideRoll = rnd();
  const scale = 0.85 + 0.3 * rnd();
  const ringRoll = rnd();
  const dist = Math.abs(end.x - lead.x);
  const amp = clamp(dist * 0.18, 10, 36) * scale;
  const wish = sideRoll < 0.5 ? 1 : -1; // 1 bows below the line, -1 above
  const ceil = target.y1 + BELOW;
  let floor = target.y0 - ABOVE;

  const cubics: Cubic[] = [];
  let from: Node = { p: lead, h: unit(tangent) };
  // heading against the trip: turn round in a half circle below, then carry on the right way
  if (from.h.x * dir < -0.2) {
    const turn = halfTurn(lead, from.h.x >= 0 ? 1 : -1, 11, from.h);
    cubics.push(...turn);
    from = { p: turn[1][3], h: { x: dir, y: 0 } };
  }

  // rightward the run ends on the lead-in itself; leftward it ends at the top of a wide U under the
  // target, which rises into the lead-in
  let to: Node = { p: end, h: land };
  let finish: Cubic[] = [];
  if (dir < 0) {
    const r = 10;
    const top = { x: end.x - 36, y: end.y + 28 - 2 * r };
    const turn = halfTurn(top, -1, r, { x: -1, y: 0 });
    to = { p: top, h: { x: -1, y: 0 } };
    finish = [
      ...turn,
      ...through([
        { p: turn[1][3], h: { x: 1, y: 0 } },
        { p: end, h: land },
      ]),
    ];
    floor = end.y + 2;
  }

  const span = Math.abs(to.p.x - from.p.x);
  const lobes = clamp(Math.round(dist / 180), 1, 2) + 1;
  const canLoop = dir > 0 && passed.length >= 3 && span >= 200;
  const options: [FlightTemplate, number][] = [["arc", 45]];
  if (span / lobes >= 55) options.push(["wave", 40]);
  if (canLoop) options.push(["loop", 15]);
  const total = options.reduce((sum, [, w]) => sum + w, 0);
  let template = options[0][0];
  let acc = 0;
  for (const [name, w] of options) {
    acc += w;
    if (pick * total < acc) {
      template = name;
      break;
    }
  }

  const base = (f: number) => from.p.y + (to.p.y - from.p.y) * f;
  const run = (n: number, k: number): Cubic[] => {
    const half = span / n;
    const room = (side: number) =>
      Math.min(
        ...Array.from({ length: n }, (_, i) => {
          const y = base((i + 0.5) / n);
          return (i % 2 === 0 ? side : -side) > 0 ? ceil - y : y - floor;
        }),
      );
    // flip to the side with room rather than clip
    const side = room(wish) < 10 && room(-wish) > room(wish) ? -wish : wish;
    const size = clamp(Math.min(amp * k, room(side), half * 0.4), 0, 40);
    const nodes = [from];
    for (let i = 0; i < n; i++) {
      const f = (i + 0.5) / n;
      const x = from.p.x + (to.p.x - from.p.x) * f;
      nodes.push({
        p: { x, y: base(f) + (i % 2 === 0 ? side : -side) * size },
        h: { x: dir, y: 0 },
      });
    }
    return through([...nodes, to]);
  };
  // a hump over the labels settles down to just under them at ~55% of the way, where the circle
  // hangs; then the line runs on to the landing
  const looped = (k: number): Cubic[] => {
    const r = 10 + 3 * ringRoll;
    const midX = from.p.x + (to.p.x - from.p.x) * 0.55;
    const mid: Node = { p: { x: midX, y: to.p.y - 2 }, h: { x: dir, y: 0 } };
    const humpY = Math.max(floor, Math.min(from.p.y, to.p.y) - amp * k);
    const hump: Node = {
      p: { x: from.p.x + (midX - from.p.x) * 0.45, y: humpY },
      h: { x: dir, y: 0 },
    };
    return [...through([from, hump, mid]), ...ring(mid.p, dir, r), ...through([mid, to])];
  };

  // the ends and the box fix the headings, so a big bow can still pinch where it meets them: shrink
  // the bow until nothing turns tighter than MIN_RADIUS or leaves the band
  const make = (k: number) =>
    template === "loop" ? looped(k) : run(template === "wave" ? lobes : 1, k);
  if (span < 40) cubics.push(...through([from, to]));
  else {
    let drawn = make(1);
    for (let k = 0.85; k > 0.05; k *= 0.85) {
      const { radius, lo, hi } = bend(drawn);
      if (radius >= MIN_RADIUS && lo >= floor - 0.01 && hi <= ceil + 0.01) break;
      drawn = make(k);
    }
    cubics.push(...drawn);
  }
  cubics.push(...finish);

  const body = cubics.map(curve).join(" ");
  return {
    d: `M${pt(lead)} ${body}`,
    body,
    len: cubics.reduce((sum, c) => sum + cubicLength(c), 0),
    template,
  };
}

/**
 * The visible window at progress `t` of a tween. The leading end (b going right, a going left) uses
 * the full easing; the trailing end starts late, so the line stretches like a comet. `head` is the
 * leading end's arc length and `dir` the direction of travel along the path.
 */
export function windowAt(from: Win, to: Win, t: number, ease = defaultEase) {
  const forward = to.a + to.b >= from.a + from.b;
  const lead = ease(t);
  const lag = ease(clamp01((t - LAG) / (1 - LAG)));
  const a = from.a + (to.a - from.a) * (forward ? lag : lead);
  const b = Math.max(a, from.b + (to.b - from.b) * (forward ? lead : lag));
  return { a, b, head: forward ? b : a, dir: forward ? (1 as const) : (-1 as const) };
}

export type Want = { hover: string | null; rest: string | null };

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const NS = "http://www.w3.org/2000/svg";

/** The svg nodes the driver writes to. `lines` are the string path and its front copies (halo and
 * accent) that show over the label text; the head and feathers ride the front svg. */
export type StringNodes = {
  svg: SVGSVGElement;
  front: SVGSVGElement;
  lines: SVGPathElement[];
  mask: SVGMaskElement;
  head: SVGGElement;
  tail: SVGGElement;
};

/**
 * Drives the nav's single string: it owns the svg nodes and writes the path and dash values straight
 * to them (no React state per frame). The path is always "what is visible now, sampled" + a
 * flight + the target link's box, so a retarget (even mid-air) just starts from the lead point. With
 * nothing visible the line grows out of the target's own lead-in; with no target it unwinds.
 */
export class StringDriver {
  private shapes: Record<string, BoxShape> = {};
  private boxes: Record<string, Box> = {};
  private order: string[] = [];
  private built = false;
  private key = "";
  private geometry = "";
  /** Link the current path ends on, and where that link's shape starts inside the path. */
  private onHref: string | null = null;
  private off = 0;
  private total = 0;
  private cur: Win = { a: 0, b: 0 };
  private want: Want = { hover: null, rest: null };
  private raf = 0;
  private timer = 0;
  private easeKey = "";
  private easeFn = defaultEase;

  constructor(private n: StringNodes) {}

  /** New geometry: old lengths mean nothing, so snap to the target without a tween. */
  rebuild(hrefs: string[], boxes: Box[], size: { w: number; h: number }, want: Want) {
    const key = hrefs.join("|");
    const geometry = JSON.stringify(boxes);
    if (this.built && key === this.key && geometry === this.geometry) return;
    this.stop();
    this.built = true;
    this.key = key;
    this.geometry = geometry;
    this.order = hrefs;
    this.boxes = Object.fromEntries(hrefs.map((href, i) => [href, boxes[i]]));
    this.shapes = Object.fromEntries(hrefs.map((href, i) => [href, boxPath(boxes[i])]));
    this.want = want;
    for (const el of [this.n.svg, this.n.front]) {
      el.setAttribute("width", String(size.w));
      el.setAttribute("height", String(size.h));
    }
    // front copy shows only over each label's right half, so the thread goes behind the first half
    // of a word and in front of the second
    const m = this.n.mask;
    m.setAttribute("x", "-200");
    m.setAttribute("y", "-100");
    m.setAttribute("width", String(size.w + 400));
    m.setAttribute("height", String(size.h + 200));
    m.replaceChildren(
      ...boxes.map((b) => {
        const left = b.x0 + PAD_X;
        const right = b.x1 - PAD_X;
        const rect = document.createElementNS(NS, "rect");
        rect.setAttribute("x", String((left + right) / 2));
        rect.setAttribute("y", String(b.y0 + PAD_Y));
        rect.setAttribute("width", String((right - left) / 2));
        rect.setAttribute("height", String(b.y1 - b.y0 - 2 * PAD_Y));
        rect.setAttribute("fill", "white");
        return rect;
      }),
    );
    this.cur = { a: 0, b: 0 };
    this.onHref = null;
    this.off = 0;
    const to = this.target();
    if (!to) {
      this.total = 0;
      return this.paint({ a: 0, b: 0 });
    }
    this.plain(to.href);
    this.paint({ a: to.a, b: to.b });
  }

  aim(want: Want) {
    const prev = this.want;
    if (prev.hover === want.hover && prev.rest === want.rest) return;
    this.want = want;
    window.clearTimeout(this.timer);
    if (!this.built) return;
    if (want.hover === null && prev.hover !== null && !reduced()) {
      this.timer = window.setTimeout(() => this.go(), RETREAT_MS);
    } else this.go();
  }

  destroy() {
    this.stop();
  }

  private stop() {
    window.clearTimeout(this.timer);
    cancelAnimationFrame(this.raf);
    this.n.head.style.opacity = "0";
    this.n.tail.style.opacity = "0";
  }

  /** The link the string should be on and the window of its shape to show. */
  private target(): { href: string; a: number; b: number } | null {
    const { hover, rest } = this.want;
    const hovered = hover ? this.shapes[hover] : undefined;
    if (hover && hovered) return { href: hover, a: hovered.s, b: hovered.e };
    const current = rest ? this.shapes[rest] : undefined;
    if (rest && current) return { href: rest, a: current.s, b: current.u };
    return null;
  }

  private setPath(d: string) {
    for (const line of this.n.lines) line.setAttribute("d", d);
  }

  /** The path is just this link's shape (no flight in front of it). */
  private plain(href: string) {
    const shape = this.shapes[href];
    this.onHref = href;
    this.off = 0;
    this.setPath(shape.d);
    this.total = shape.e;
  }

  /** Duration and easing from the nav's CSS custom properties, shared with the card's glide. */
  private timing() {
    const style = getComputedStyle(this.n.svg.parentElement ?? this.n.svg);
    // the browser may hand back "600ms" as ".6s", so read the unit
    const time = style.getPropertyValue("--string-ms").trim();
    const ms = Number.parseFloat(time) * (time.endsWith("ms") ? 1 : 1000);
    const curve = style.getPropertyValue("--string-ease").trim();
    if (curve !== this.easeKey) {
      const n = curve.match(/-?\d*\.?\d+/g)?.map(Number);
      this.easeKey = curve;
      this.easeFn = n?.length === 4 ? bezier(n[0], n[1], n[2], n[3]) : defaultEase;
    }
    return { ms: Number.isFinite(ms) ? ms : DEFAULT_MS, ease: this.easeFn };
  }

  private go() {
    cancelAnimationFrame(this.raf);
    const to = this.target();
    const shown = this.cur.b - this.cur.a >= MIN;
    const { ms, ease } = this.timing();
    const jump = reduced() || ms <= 0;
    this.n.head.style.opacity = "0";
    this.n.tail.style.opacity = "0";
    if (!to) {
      // nothing to rest on: the trailing end catches up with the leading end
      if (!shown) return this.paint({ a: 0, b: 0 });
      const end = { a: this.cur.b, b: this.cur.b };
      return jump ? this.paint(end) : this.tween({ ...this.cur }, end, ms, ease, false);
    }
    const shape = this.shapes[to.href];
    if (jump) {
      this.plain(to.href);
      return this.paint({ a: to.a, b: to.b });
    }
    if (!shown) {
      // a hidden line grows out of the target's own lead-in
      this.plain(to.href);
      return this.tween({ a: shape.s, b: shape.s }, { a: to.a, b: to.b }, ms, ease, true);
    }
    if (this.onHref === to.href) {
      // same link (underline <-> box, or still on the way to it): just move the window
      const goal = { a: this.off + to.a, b: this.off + to.b };
      return this.tween({ ...this.cur }, goal, ms, ease, goal.b - this.cur.b > 1);
    }
    // another link: sample what is visible, fly from its lead point, land on the new shape
    const lead = this.pointAt(this.cur.b);
    const ahead = this.pointAt(this.cur.b + 1);
    const back = this.pointAt(this.cur.b - 1);
    const tx = ahead.x - back.x || 1;
    const ty = ahead.y - back.y;
    const tl = Math.hypot(tx, ty) || 1;
    // labels strictly between the lead point and the target (the settled origin is not one of them),
    // in travel order
    const goal = this.boxes[to.href];
    const cx = (b: Box) => (b.x0 + b.x1) / 2;
    const dir = shape.start.x >= lead.x ? 1 : -1;
    const passed = this.order
      .filter((h) => h !== to.href && !(this.off === 0 && h === this.onHref))
      .map((h) => this.boxes[h])
      .filter((b) => (cx(b) - lead.x) * dir > 0 && (cx(goal) - cx(b)) * dir > 0)
      .sort((p, q) => (cx(p) - cx(q)) * dir);
    // chosen once per flight, never per frame
    const seed = Math.floor(Math.random() * 2 ** 32);
    const poly = this.sample(this.cur.a, this.cur.b);
    const fly = flightPath(lead, { x: tx / tl, y: ty / tl }, goal, passed, seed);
    this.setPath(`${poly.d} ${fly.body} ${shape.body}`);
    this.onHref = to.href;
    this.off = poly.len + fly.len;
    this.total = this.off + shape.e;
    this.paint({ a: 0, b: poly.len });
    this.tween(this.cur, { a: this.off + to.a, b: this.off + to.b }, ms, ease, true);
  }

  private tween(from: Win, to: Win, ms: number, ease: typeof defaultEase, flying: boolean) {
    const t0 = performance.now();
    const step = (now: number) => {
      const t = clamp01((now - t0) / ms);
      const w = windowAt(from, to, t, ease);
      this.paint(w);
      if (t < 1) {
        if (flying) this.travel(w, t);
        this.raf = requestAnimationFrame(step);
        return;
      }
      this.n.head.style.opacity = "0";
      this.n.tail.style.opacity = "0";
      this.settle();
    };
    this.raf = requestAnimationFrame(step);
  }

  /** Landed: swap the sampled-plus-flight path for the plain shape, same window, no visible jump. */
  private settle() {
    if (!this.onHref || this.off === 0 || this.cur.b - this.cur.a < MIN) return;
    const off = this.off;
    const w = { a: this.cur.a - off, b: this.cur.b - off };
    this.plain(this.onHref);
    this.paint(w);
  }

  private paint(w: Win) {
    this.cur = w;
    const len = w.b - w.a;
    for (const line of this.n.lines) {
      const s = line.style;
      s.strokeDasharray = `${len} ${this.total + 1}`;
      s.strokeDashoffset = String(-w.a);
      s.opacity = len >= MIN ? "1" : "0";
    }
  }

  private pointAt(len: number): Pt {
    const p = this.n.lines[0].getPointAtLength(clamp(len, 0, this.total));
    return { x: p.x, y: p.y };
  }

  /** The visible stretch of the current path as a polyline (the only straight-line commands in the
   * flight), a point about every 3px so curves stay round. */
  private sample(a: number, b: number) {
    const n = Math.max(24, Math.ceil((b - a) / 3));
    let d = "";
    let len = 0;
    let prev: Pt | null = null;
    for (let i = 0; i <= n; i++) {
      const p = this.pointAt(a + ((b - a) * i) / n);
      d += `${i ? "L" : "M"}${pt(p)} `;
      if (prev) len += Math.hypot(p.x - prev.x, p.y - prev.y);
      prev = p;
    }
    return { d: d.trim(), len };
  }

  /** The head rides the leading end and the feathers the trailing end, both pointing along the path,
   * fading over the last quarter. */
  private travel(w: ReturnType<typeof windowAt>, t: number) {
    const opacity = String(t < 0.75 ? 1 : (1 - t) / 0.25);
    const pose = (g: SVGGElement, at: number, step: number) => {
      const p = this.pointAt(at);
      const q = this.pointAt(at - step);
      const deg = (Math.atan2(p.y - q.y, p.x - q.x) * 180) / Math.PI;
      g.setAttribute("transform", `translate(${f(p.x)} ${f(p.y)}) rotate(${f(deg)})`);
      g.style.opacity = opacity;
    };
    if (w.b - w.a < MIN) {
      this.n.head.style.opacity = "0";
      this.n.tail.style.opacity = "0";
      return;
    }
    pose(this.n.head, w.b, 1);
    pose(this.n.tail, w.a + 1, 1);
  }
}
