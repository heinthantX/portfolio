/**
 * The home page's shifting stream, as pure functions of layout, scroll and time. Each frame fills
 * a small spine table (rows over the viewport, per channel: offset, width, weight, alpha) that
 * the vertex shader reads, and moves a few CPU-side gold packets along the same channels.
 * Deterministic: no Math.random, no clock.
 */

/** Spine table rows over the viewport band, its channels, and its lines (channels + 2). */
export const ROWS = 128;
export const CH = 5;
export const LINES = CH + 2;
const GLOBALS = CH;
const TEXT = CH + 1;
/** Band above and below the viewport that points wrap through, in px. */
export const MARGIN = 200;
/** Speed classes of the points (per-point jitter). */
export const SPEED = [0.8, 0.93, 1.07, 1.2] as const;
export const MAX_PACKETS = 40;
/** Sprite slots: up to 6 dots and a head glow per packet, plus the end glow (glow and core). */
export const SPRITES = MAX_PACKETS * 7 + 2;
/** Sprite kinds, in the sprite buffer's 5th float. */
export const SPRITE = { gold: 0, glow: 1, flash: 2, ack: 3 } as const;

export const REGIMES = ["river", "braid", "delta", "fibre", "pool", "funnel"] as const;
export type Regime = (typeof REGIMES)[number];
const [RIVER, BRAID, DELTA, FIBRE, POOL, FUNNEL] = [0, 1, 2, 3, 4, 5];
const NR = REGIMES.length;
const SPD = [1, 0.62, 0.85, 2, 0.42, 1];
const AL = [0.62, 0.8, 0.7, 0.95, 0.72, 0.8];
const SZ = [4.5, 3.9, 4, 3.4, 5, 3.8];
const FW = [0.35, 0.35, 0.2, 0, 0];
const DST = [-1.5, -0.5, 0.5, 1.5];
const SIDE = [-0.29, 0.31, -0.34, 0.36, -0.39];
/** Regime epochs and their crossfade, in seconds. */
export const EPOCH = 36;
const XF = 8;
/** Heading walk step and arc-length unit, in px. */
const TS = 10;
const UNIT = 140;
/** Seed picked so the spine crosses the page both ways, unevenly. */
const SD = 329;

/* ---------- noise ---------- */
function hashf(i: number, seed: number) {
  let h = Math.imul(i | 0, 0x27d4eb2d) ^ Math.imul(seed | 0, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return ((h >>> 0) / 4294967295) * 2 - 1;
}
const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
/** 1D value noise in -1..1. */
export function n1(x: number, seed: number) {
  const i = Math.floor(x);
  const a = hashf(i, seed);
  return a + (hashf(i + 1, seed) - a) * fade(x - i);
}
export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const ss = (t: number) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};
const mod = (a: number, n: number) => ((a % n) + n) % n;
const pulse = (y: number, t: number, b: number, r: number) =>
  ss((y - t + r) / (2 * r)) * (1 - ss((y - b + r) / (2 * r)));

/* ---------- spine ---------- */
/** Lateral centre from noise along arc length: three incommensurate octaves over a slow domain
 * warp. Negative time rates, so features drift downstream. In viewport widths. */
export function latRaw(s: number, t: number) {
  const sw = s + 1.1 * n1(s * 0.07 + 17 - t * 0.06, 11 + SD);
  const a = n1(sw * 0.18 - t * 0.06, 1 + SD);
  const b = n1(sw * 0.41 - t * 0.09, 2 + SD);
  const c = n1(sw * 0.93 - t * 0.12, 3 + SD);
  return 0.34 * a + 0.17 * b + 0.07 * c;
}
/** Mean-reverting heading integrated down the page (a random walk that never strays far). */
function headingWalk(out: Float32Array, n: number, t: number) {
  let h = 0;
  let x = 0;
  for (let j = 0; j < n; j++) {
    h = h * 0.97 + 0.05 * n1(((j * TS) / UNIT) * 0.9 - t * 0.1, 21 + SD);
    x = (x + h) * 0.994;
    out[j] = x;
  }
}
const WALK_SCALE = (() => {
  const a = new Float32Array(900);
  headingWalk(a, 900, 0);
  let q = 0;
  for (const v of a) q += v * v;
  return 0.11 / Math.sqrt(q / 900);
})();

/* ---------- layout ---------- */
export interface Box {
  l: number;
  r: number;
  t: number;
  b: number;
}
export interface WaveSection {
  /** document px */
  top: number;
  bottom: number;
  /** regime indices this section may wear, and the one it starts with */
  cand: readonly number[];
  base: number;
}
export interface WaveLayout {
  vw: number;
  vh: number;
  /** where the stream begins and ends (document px), and the end's screen x */
  yStart: number;
  yEnd: number;
  endX: number;
  /** in page order; the last one is the funnel */
  sections: WaveSection[];
  /** text blocks in document px */
  text: Box[];
}

const HOME: Record<string, [Regime[], Regime]> = {
  about: [["river", "braid", "fibre"], "river"],
  "what-i-do": [["pool", "delta"], "pool"],
  experience: [["braid", "river"], "braid"],
  work: [["pool", "delta"], "pool"],
  "how-i-work": [["fibre", "braid"], "fibre"],
  stack: [["river", "braid"], "river"],
  notes: [["pool", "braid", "fibre"], "pool"],
};
const GENERIC: Regime[] = ["river", "braid", "delta", "fibre", "pool"];
const GENERIC_BASE: Regime[] = ["river", "braid", "delta", "pool", "fibre"];
const ri = (r: Regime) => REGIMES.indexOf(r);

/** Regime candidates for a section: by home id, else a cycle; the last one is always the funnel. */
export function sectionRegimes(id: string | undefined, i: number, last: boolean) {
  if (last) return { cand: [FUNNEL], base: FUNNEL };
  const home = id ? HOME[id] : undefined;
  if (home) return { cand: home[0].map(ri), base: ri(home[1]) };
  return { cand: GENERIC.map(ri), base: ri(GENERIC_BASE[i % GENERIC_BASE.length]) };
}

/* ---------- state ---------- */
interface Packet {
  y: number;
  ch: number;
  v: number;
  n: number;
  age: number;
  lane: number;
  dir: number;
  r: number;
  fl: number;
  flashAt: number;
  fade: number;
  dm: number;
  off: number;
  ack: boolean;
}

export function createWave(seed = 5150) {
  return {
    /** noise time (sped up by scrolling), wall time, low-passed scroll speed 0..1 */
    T: 0,
    tm: 0,
    vel: 0,
    lastScroll: Number.NaN,
    /** flow distance per speed class, and the shader's band offsets derived from it */
    dist: new Float64Array(SPEED.length),
    off: new Float32Array(SPEED.length),
    band: 1,
    bandTop: 0,
    step: 1,
    /** RGBA float texture data, ROWS x LINES */
    table: new Float32Array(ROWS * LINES * 4),
    /** two swirls: screen cx, cy, radius, angle */
    swirl: new Float32Array(8),
    /** sprites: screen x, y, size px, alpha, kind */
    sprites: new Float32Array(SPRITES * 5),
    spriteCount: 0,
    packets: [] as Packet[],
    pend: [] as { t: number; ch: number; y: number; v: number; n: number }[],
    pkAcc: 0,
    ackAcc: 0,
    rnd: mulberry32(seed),
    layout: null as WaveLayout | null,
    asg: new Map<number, number[]>(),
    wt: new Float32Array(0),
    walk: new Float32Array(0),
    ms: new Float32Array(0),
    mT: new Float32Array(NR * ROWS),
    sx: new Float32Array(ROWS),
    ofs: new Float32Array(CH * ROWS),
    wid: new Float32Array(ROWS),
    wgt: new Float32Array(CH * ROWS),
    spd: new Float32Array(ROWS),
  };
}
export type WaveState = ReturnType<typeof createWave>;

/** Which regime each section wears in epoch e: never its previous pick, never its neighbour's. */
export function assign(state: WaveState, e: number): number[] {
  const secs = state.layout?.sections ?? [];
  if (e <= 0) return secs.map((s) => s.base);
  const hit = state.asg.get(e);
  if (hit) return hit;
  const prev = assign(state, e - 1);
  const rnd = mulberry32(e * 7919 + 5);
  const a: number[] = [];
  secs.forEach((s, i) => {
    let c = s.cand.filter((r) => r !== prev[i] && (i === 0 || r !== a[i - 1]));
    if (!c.length) c = s.cand.filter((r) => r !== prev[i]);
    if (!c.length) c = [...s.cand];
    a.push(c[Math.floor(rnd() * c.length)]);
  });
  state.asg.set(e, a);
  return a;
}

function setLayout(st: WaveState, L: WaveLayout) {
  st.layout = L;
  st.asg.clear();
  st.wt = new Float32Array(L.sections.length * NR);
  st.ms = new Float32Array(L.sections.length * ROWS);
  st.packets.length = 0;
  st.pend.length = 0;
}

/** Row lookups (document y) into the per-row tables. */
function rowAt(st: WaveState, y: number) {
  return clamp((y - st.bandTop) / st.step, 0, ROWS - 1.0001);
}
function lerpRow(a: Float32Array, base: number, f: number) {
  const j = Math.floor(f);
  const t = f - j;
  return a[base + j] + (a[base + j + 1] - a[base + j]) * t;
}
const tex = (line: number, row: number) => (line * ROWS + row) * 4;

/** Text thinning at a screen point: 1 clear .. ~0.2 on top of text. */
function densAt(st: WaveState, x: number, f: number) {
  const j = Math.round(f);
  const i = tex(TEXT, j);
  const cover = st.table[i + 2];
  if (cover <= 0) return 1;
  const dx = Math.max(st.table[i] - x, 0, x - st.table[i + 1]);
  return 1 + (0.2 + 0.8 * ss(dx / 40) - 1) * cover;
}

export interface StepOptions {
  /** run packets (off under reduced motion) */
  packets: boolean;
  /** how much of the scene is flow (0 hero .. 1 flow); packets fade with it */
  flow: number;
}

/** Advance the wave by dt seconds at this scroll position and refill every table. */
export function stepWave(st: WaveState, L: WaveLayout, scroll: number, dt: number, o: StepOptions) {
  if (st.layout !== L) setLayout(st, L);
  const W = L.vw;
  const H = L.vh;
  if (Number.isNaN(st.lastScroll)) st.lastScroll = scroll;
  const v = dt > 0 ? Math.abs(scroll - st.lastScroll) / dt : 0;
  st.lastScroll = scroll;
  st.vel += (clamp(v / 1800, 0, 1) - st.vel) * (1 - Math.exp(-dt * 3));
  st.T += dt * (1 + 2 * st.vel);
  st.tm += dt;
  const T = st.T;
  const band = H + 2 * MARGIN;
  st.band = band;
  st.bandTop = scroll - MARGIN;
  st.step = band / (ROWS - 1);

  // regimes per section, crossfaded between epochs
  const secs = L.sections;
  const NS = secs.length;
  const e = Math.floor(st.tm / EPOCH);
  const f = ss((st.tm - e * EPOCH - (EPOCH - XF)) / XF);
  const a0 = assign(st, e);
  const a1 = assign(st, e + 1);
  st.wt.fill(0);
  for (let s = 0; s < NS; s++) {
    st.wt[s * NR + a0[s]] += 1 - f;
    st.wt[s * NR + a1[s]] += f;
  }
  const cen = secs.map((s, i) => (i === NS - 1 ? L.yEnd - 250 : (s.top + s.bottom) / 2));

  // heading walk from the top of the document down to the band's bottom
  const nWalk = Math.max(2, Math.ceil((st.bandTop + band) / TS) + 2);
  if (st.walk.length < nWalk) st.walk = new Float32Array(nWalk + 256);
  headingWalk(st.walk, nWalk, T);

  // ramps scale down on short pages so the stream still wanders
  const span = Math.max(1, L.yEnd - L.yStart);
  const k = clamp(span / 2600, 0.3, 1);
  const envAt = (y: number) =>
    ss((y - L.yStart) / (800 * k)) * (1 - ss((y - (L.yEnd - 1100 * k)) / (950 * k)));
  const neckAt = (y: number) => 0.05 + 0.95 * ss((y - L.yStart) / (650 * k));
  const endAt = (y: number) => 0.05 + 0.95 * (1 - ss((y - (L.yEnd - 900 * k)) / (850 * k)));
  const amp = 1 + 0.25 * st.vel;
  const text = L.text.filter((b) => b.b > st.bandTop - 40 && b.t < st.bandTop + band + 40);
  const tb = st.table;

  let ii = 0;
  for (let j = 0; j < ROWS; j++) {
    const y = st.bandTop + j * st.step;
    const s = y / UNIT;
    // section membership: hold the ends, blend across each gap with a noise-jittered smoothstep
    for (let q = 0; q < NS; q++) st.ms[q * ROWS + j] = 0;
    if (NS === 1 || y <= cen[0]) st.ms[j] = 1;
    else if (y >= cen[NS - 1]) st.ms[(NS - 1) * ROWS + j] = 1;
    else {
      while (ii < NS - 2 && y >= cen[ii + 1]) ii++;
      const d = cen[ii + 1] - cen[ii];
      const bw = Math.max(1, Math.min(0.6 * H, d));
      const mid = (cen[ii] + cen[ii + 1]) / 2 + 0.12 * H * n1(T * 0.05 + ii * 3.7, 120 + ii);
      const m = ss((y - mid) / bw + 0.5);
      st.ms[ii * ROWS + j] = 1 - m;
      st.ms[(ii + 1) * ROWS + j] = m;
    }
    let fr = 0;
    for (let q = 0; q < NS; q++) {
      const w = st.ms[q * ROWS + j];
      if (w > 0) fr += w * pulse(y, secs[q].top + 120, secs[q].bottom - 40, 260);
    }
    const m: number[] = [];
    for (let r = 0; r < NR; r++) {
      let acc = 0;
      for (let q = 0; q < NS; q++) acc += st.ms[q * ROWS + j] * st.wt[q * NR + r];
      m.push(acc);
      st.mT[r * ROWS + j] = acc;
    }

    // spine: noise + heading walk, soft-clamped, centred while a braid frames the content,
    // pulled toward the endpoint near the end
    const wj = clamp(Math.floor(y / TS), 0, nWalk - 1);
    const raw = (latRaw(s, T) + st.walk[wj] * WALK_SCALE) * amp;
    const lat = 0.6 * Math.tanh(raw / 0.6);
    const env = envAt(y);
    const frame = fr * env;
    const sx =
      lat * (1 - frame * m[BRAID]) * env * W +
      (L.endX - W / 2) * ss((y - (L.yEnd - 900 * k)) / (850 * k));
    st.sx[j] = sx;

    const nk = neckAt(y) * endAt(y);
    const wn = 0.5 + 0.5 * n1(s * 0.12 + T * 0.04 + 5, 31);
    const taper = clamp((L.yEnd - y) / 1000, 0, 1);
    const base = W * (0.035 + 0.03 * wn) * nk;
    const wid =
      m[RIVER] * Math.max(10, W * (0.042 + 0.03 * wn) * nk) +
      m[BRAID] * 1.4 +
      m[DELTA] * (7 + 0.006 * W) +
      m[FIBRE] * 2.2 +
      m[POOL] * W * 0.085 * nk +
      m[FUNNEL] * (2.5 + 0.012 * W * taper);
    let spd = 0;
    let al = 0;
    let sz = 0;
    for (let r = 0; r < NR; r++) {
      spd += m[r] * SPD[r];
      al += m[r] * AL[r];
      sz += m[r] * SZ[r];
    }
    st.wid[j] = wid;
    st.spd[j] = spd;
    const gate =
      ss((y - L.yStart) / 160) *
      (1 - ss((y - L.yEnd) / 60)) *
      (1 + ss((y - (L.yEnd - 320)) / 320) * (1 - 0.9 * m[FUNNEL]));
    // the funnel's tip thins out so the converging points never blow out
    const conc = 1 - m[FUNNEL] * 0.8 * (1 - clamp((wid - 2.5) / 15, 0, 1));

    for (let c = 0; c < CH; c++) {
      let off = 0;
      if (m[BRAID] > 0.002) {
        let ob =
          base *
          (0.75 * n1(s * (0.34 + 0.08 * c) - T * 0.1 + c * 13.7, 40 + c) +
            0.55 * n1(s * (0.81 + 0.11 * c) - T * 0.12 + c * 5.1, 60 + c));
        ob =
          ob * (1 - frame) + (SIDE[c] + 0.03 * n1(s * 0.3 + c * 9 - T * 0.08, 70 + c)) * W * frame;
        off += m[BRAID] * ob;
      }
      if (m[DELTA] > 0.002 && c < 4)
        off += m[DELTA] * nk * W * (DST[c] * 0.062 + 0.012 * n1(s * 0.5 - T * 0.1 + c * 7, 80 + c));
      if (m[FIBRE] > 0.002) off += m[FIBRE] * 2 * n1(s * 0.8 - T * 0.1 + c * 3, 90 + c);
      if (m[FUNNEL] > 0.002) off += m[FUNNEL] * (c - 2) * W * 0.05 * taper;
      const ofs = clamp(sx + off, -0.6 * W, 0.6 * W);
      const wg =
        m[RIVER] +
        m[BRAID] * 0.3 +
        (c < 4 ? m[DELTA] * 0.55 : 0) +
        m[FIBRE] * FW[c] +
        m[POOL] * 0.75 +
        m[FUNNEL] * 0.85;
      st.ofs[c * ROWS + j] = ofs;
      st.wgt[c * ROWS + j] = wg;
      const i = tex(c, j);
      tb[i] = ofs;
      tb[i + 1] = wid;
      tb[i + 2] = wg;
      tb[i + 3] = al * gate * conc;
    }
    const g = tex(GLOBALS, j);
    tb[g] = clamp(m[RIVER] + 0.8 * m[POOL], 0, 1);
    tb[g + 1] = sz;
    tb[g + 2] = 0;
    tb[g + 3] = 0;

    // text on this row: the union of its blocks' x ranges, and how squarely the row is on them
    let tl = Number.POSITIVE_INFINITY;
    let tr = Number.NEGATIVE_INFINITY;
    let cover = 0;
    for (const b of text) {
      const dy = Math.max(b.t - y, 0, y - b.b);
      if (dy >= 40) continue;
      cover = Math.max(cover, 1 - ss(dy / 40));
      tl = Math.min(tl, b.l);
      tr = Math.max(tr, b.r);
    }
    const t = tex(TEXT, j);
    tb[t] = cover > 0 ? tl : 0;
    tb[t + 1] = cover > 0 ? tr : 0;
    tb[t + 2] = cover;
    tb[t + 3] = 0;
  }

  // pool sections swirl about their centre (at most two on screen)
  st.swirl.fill(0);
  const SR = Math.max(150, 0.24 * W);
  const swA = 2 + n1(T * 0.15, 77);
  let nsw = 0;
  for (let q = 0; q < NS && nsw < 2; q++) {
    const pw = st.wt[q * NR + POOL];
    if (pw <= 0.01 || cen[q] < st.bandTop - SR || cen[q] > st.bandTop + band + SR) continue;
    st.swirl.set(
      [W / 2 + lerpRow(st.sx, 0, rowAt(st, cen[q])), cen[q] - scroll, SR, pw * swA],
      nsw * 4,
    );
    for (let j = 0; j < ROWS; j++) tb[tex(GLOBALS, j) + 2 + nsw] = st.ms[q * ROWS + j];
    nsw++;
  }

  // points: doc-anchored, wrapping through the band; speed from the regime mid-screen
  const flow = 50 * (1 + 0.9 * st.vel) * lerpRow(st.spd, 0, rowAt(st, scroll + H / 2));
  for (let c = 0; c < SPEED.length; c++) {
    st.dist[c] = mod(st.dist[c] + dt * flow * SPEED[c], band);
    st.off[c] = mod(st.dist[c] - scroll + MARGIN, band);
  }

  if (o.packets) stepPackets(st, L, scroll, dt);
  else {
    st.packets.length = 0;
    st.pend.length = 0;
  }
  drawSprites(st, L, scroll, o.flow);
}

/* ---------- packets ---------- */
function pickCh(st: WaveState, y: number) {
  const f = rowAt(st, y);
  let tot = 0;
  const w = [0, 0, 0, 0, 0];
  for (let c = 0; c < CH; c++) {
    w[c] = Math.max(0, lerpRow(st.wgt, c * ROWS, f));
    tot += w[c];
  }
  if (tot < 0.001) return 2;
  let q = st.rnd() * tot;
  for (let c = 0; c < CH; c++) {
    q -= w[c];
    if (q <= 0) return c;
  }
  return CH - 1;
}

function mkPacket(st: WaveState, y: number, ch: number, o: Partial<Packet>): Packet {
  const r = st.rnd;
  const f = rowAt(st, y);
  const p: Packet = {
    y,
    ch,
    v: 150 + 90 * r(),
    n: 3 + Math.floor(r() * 4),
    age: 0,
    lane: r() * 2 - 1,
    dir: 1,
    r: r(),
    fl: -1,
    flashAt: r() < 0.1 ? 1 + r() * 1.6 : -1,
    fade: 0.25,
    dm: lerpRow(st.mT, DELTA * ROWS, f),
    off: 0,
    ack: false,
    ...o,
  };
  p.off = lerpRow(st.ofs, p.ch * ROWS, f) + p.lane * lerpRow(st.wid, 0, f) * 0.5;
  return p;
}

function stepPackets(st: WaveState, L: WaveLayout, scroll: number, dt: number) {
  const PK = st.packets;
  const top = st.bandTop;
  const bot = top + st.band;
  const lo = Math.max(top, L.yStart);
  const hi = Math.min(bot, L.yEnd - 40);
  for (let i = st.pend.length - 1; i >= 0; i--) {
    const e = st.pend[i];
    if (st.tm < e.t) continue;
    st.pend.splice(i, 1);
    const y = clamp(e.y, L.yStart + 10, L.yEnd - 45);
    if (y > top && y < bot)
      PK.push(mkPacket(st, y, e.ch, { v: e.v, n: e.n, flashAt: -1, fade: 0.3 }));
  }
  if (hi > lo) {
    let inBand = 0;
    let acks = 0;
    for (const p of PK) {
      if (p.ack) acks++;
      else if (p.y >= scroll && p.y <= scroll + L.vh) inBand++;
    }
    st.pkAcc += dt * 1.9 * (1 + 3 * st.vel);
    while (st.pkAcc >= 1) {
      st.pkAcc -= 1;
      if (PK.length >= MAX_PACKETS) continue;
      const y = clamp(top + st.rnd() * 60, L.yStart, L.yEnd - 45);
      PK.push(mkPacket(st, y, pickCh(st, y), {}));
      inBand++;
    }
    if (inBand < 6 && PK.length < MAX_PACKETS) {
      const y = lo + st.rnd() * (hi - lo);
      PK.push(mkPacket(st, y, pickCh(st, y), { fade: 0.6 }));
    }
    st.ackAcc += dt * 0.12 * (1 + 2 * st.vel);
    while (st.ackAcc >= 1) {
      st.ackAcc -= 1;
      if (acks >= 3 || PK.length >= MAX_PACKETS) continue;
      const y = lo + (hi - lo) * (0.55 + 0.45 * st.rnd());
      PK.push(
        mkPacket(st, y, pickCh(st, y), {
          ack: true,
          dir: -1,
          v: 110,
          n: 2,
          flashAt: -1,
          fade: 0.5,
        }),
      );
      acks++;
    }
  }
  for (let i = PK.length - 1; i >= 0; i--) {
    const p = PK[i];
    p.age += dt;
    const f0 = rowAt(st, p.y);
    p.y += p.dir * p.v * (p.ack ? 1 : 0.75 + 0.25 * lerpRow(st.spd, 0, f0)) * dt;
    if (p.flashAt > 0 && p.fl < 0 && p.age >= p.flashAt) {
      // dropped: flash, fade, and the same packet is resent from upstream
      p.fl = 0;
      st.pend.push({ t: st.tm + 0.55, ch: p.ch, y: p.y - 100, v: p.v * 1.1, n: p.n });
    }
    if (p.fl >= 0) {
      p.fl += dt;
      if (p.fl >= 0.65) {
        PK.splice(i, 1);
        continue;
      }
    }
    const out = p.dir > 0 ? p.y > L.yEnd + 30 || p.y > bot : p.y < L.yStart - 10 || p.y < top;
    if (out) {
      PK.splice(i, 1);
      continue;
    }
    const f = rowAt(st, p.y);
    const wgc = lerpRow(st.wgt, p.ch * ROWS, f);
    const dm = lerpRow(st.mT, DELTA * ROWS, f);
    // split: its channel thins out, or a delta opens
    if (wgc < 0.12 || (p.dm < 0.4 && dm >= 0.4)) p.ch = pickCh(st, p.y);
    p.dm = dm;
    const tgt = lerpRow(st.ofs, p.ch * ROWS, f) + p.lane * lerpRow(st.wid, 0, f) * 0.5;
    p.off += (tgt - p.off) * (1 - Math.exp(-7 * dt));
  }
}

function drawSprites(st: WaveState, L: WaveLayout, scroll: number, flow: number) {
  const out = st.sprites;
  const W = L.vw;
  let n = 0;
  const put = (x: number, y: number, size: number, a: number, kind: number, r: number) => {
    const sy = y - scroll;
    if (n >= SPRITES || a < 0.01 || sy < -30 || sy > L.vh + 30) return;
    // text thins packets too, with a floor so they never vanish
    const d = densAt(st, x, rowAt(st, y));
    const v = d < 0.999 ? ss((d - r * 0.85) / 0.15 + 0.5) : 1;
    out.set([x, sy, size, Math.min(1, a * (0.45 + 0.55 * v) * flow), kind], n * 5);
    n++;
  };
  if (flow > 0.01) {
    for (const p of st.packets) {
      const fi = ss(p.age / p.fade);
      const fo = p.fl > 0.35 ? 1 - (p.fl - 0.35) / 0.3 : 1;
      const flash = p.fl >= 0 && p.fl <= 0.35;
      const base = fi * fo;
      const sm = flash ? 1.7 : 1;
      const head = lerpRow(st.ofs, p.ch * ROWS, rowAt(st, p.y));
      for (let d = 0; d < p.n; d++) {
        const yd = p.y - p.dir * d * 5.2;
        if (yd < L.yStart - 10 || yd > L.yEnd + 30) continue;
        const x = W / 2 + p.off + lerpRow(st.ofs, p.ch * ROWS, rowAt(st, yd)) - head;
        const g = ss((yd - L.yStart) / 100);
        if (p.ack) {
          put(x, yd, 3.2, 0.35 * base * g * (1 - 0.25 * d), SPRITE.ack, p.r);
          continue;
        }
        if (d === 0) put(x, yd, 18 * sm, 0.3 * base * g, SPRITE.glow, p.r);
        put(
          x,
          yd,
          (d === 0 ? 5.6 : 4.4) * sm,
          0.95 * (1 - 0.16 * d) * base * g,
          flash ? SPRITE.flash : SPRITE.gold,
          p.r,
        );
      }
    }
    // the stream lands in a small gold glow
    const breath = 1 + 0.06 * Math.sin(st.tm * 1.7);
    put(L.endX, L.yEnd, 40 * breath, 0.42, SPRITE.glow, 0);
    put(L.endX, L.yEnd, 6.5, 0.9, SPRITE.gold, 0);
  }
  st.spriteCount = n;
}

/* ---------- per-point attributes ---------- */
/**
 * Per-point flow attributes, 4 floats each: channel 0..4, lateral u (gaussian, clamped to
 * +-2.8), phase 0..1 (stratified per channel so the stream has no gaps), and speed class plus a
 * random fraction (class + r*0.999).
 */
export function flowAttributes(count: number, seed = 977) {
  const rnd = mulberry32(seed);
  const out = new Float32Array(count * 4);
  const per = Math.ceil(count / CH);
  for (let i = 0; i < count; i++) {
    const g = Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());
    out[i * 4] = i % CH;
    out[i * 4 + 1] = clamp(g, -2.8, 2.8);
    out[i * 4 + 2] = (Math.floor(i / CH) + 0.3 * rnd()) / per;
    out[i * 4 + 3] = Math.floor(rnd() * SPEED.length) + rnd() * 0.999;
  }
  return out;
}

/** Table accessors, for tests and the packets. */
export const table = {
  at: (st: WaveState, line: number, row: number) =>
    st.table.subarray(tex(line, row), tex(line, row) + 4),
  channel: (c: number) => c,
  globals: GLOBALS,
  text: TEXT,
};
