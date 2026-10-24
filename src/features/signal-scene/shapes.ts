/**
 * Pure, deterministic point-cloud generators for the "Signal" hero.
 * Every generator returns Float32Array(n * 3), roughly inside a 4.4 x 3 x 2 box at the origin.
 */

type Rng = () => number;
type V3 = [number, number, number];
interface Part {
  /** relative share of the point budget */
  w: number;
  p: (r: Rng) => V3;
}

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function build(n: number, seed: number, parts: Part[]): Float32Array {
  const out = new Float32Array(n * 3);
  const r = mulberry32(seed);
  const total = parts.reduce((s, q) => s + q.w, 0);
  let i = 0;
  parts.forEach((part, k) => {
    const count = k === parts.length - 1 ? n - i : Math.round((n * part.w) / total);
    for (let c = 0; c < count && i < n; c++, i++) {
      const [x, y, z] = part.p(r);
      out[i * 3] = x;
      out[i * 3 + 1] = y;
      out[i * 3 + 2] = z;
    }
  });
  return out;
}

const line =
  (a: V3, b: V3, jitter = 0.012) =>
  (r: Rng): V3 => {
    const t = r();
    return [
      a[0] + (b[0] - a[0]) * t + (r() - 0.5) * jitter,
      a[1] + (b[1] - a[1]) * t + (r() - 0.5) * jitter,
      a[2] + (b[2] - a[2]) * t + (r() - 0.5) * jitter,
    ];
  };

/** Perimeter of an axis-aligned rect in the XY plane. */
function rectOutline(cx: number, cy: number, cz: number, w: number, h: number): Part["p"] {
  const per = 2 * (w + h);
  return (r) => {
    let d = r() * per;
    const j = (r() - 0.5) * 0.012;
    if (d < w) return [cx - w / 2 + d, cy + h / 2 + j, cz];
    d -= w;
    if (d < h) return [cx + w / 2 + j, cy + h / 2 - d, cz];
    d -= h;
    if (d < w) return [cx + w / 2 - d, cy - h / 2 + j, cz];
    d -= w;
    return [cx - w / 2 + j, cy - h / 2 + d, cz];
  };
}

const rectFill =
  (cx: number, cy: number, cz: number, w: number, h: number): Part["p"] =>
  (r) => [cx + (r() - 0.5) * w, cy + (r() - 0.5) * h, cz];

const ringXY =
  (cx: number, cy: number, cz: number, rad: number): Part["p"] =>
  (r) => {
    const a = r() * Math.PI * 2;
    return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, cz];
  };

const ringXZ =
  (cx: number, cy: number, cz: number, rad: number): Part["p"] =>
  (r) => {
    const a = r() * Math.PI * 2;
    return [cx + Math.cos(a) * rad, cy, cz + Math.sin(a) * rad];
  };

const sphereShell =
  (cx: number, cy: number, cz: number, rad: number): Part["p"] =>
  (r) => {
    const z = r() * 2 - 1;
    const a = r() * Math.PI * 2;
    const s = Math.sqrt(1 - z * z);
    return [cx + Math.cos(a) * s * rad, cy + Math.sin(a) * s * rad, cz + z * rad];
  };

function cubeEdges(cx: number, cy: number, cz: number, s: number): Part["p"] {
  const h = s / 2;
  return (r) => {
    const axis = Math.floor(r() * 3);
    const u = (r() * 2 - 1) * h;
    const a = r() < 0.5 ? -h : h;
    const b = r() < 0.5 ? -h : h;
    if (axis === 0) return [cx + u, cy + a, cz + b];
    if (axis === 1) return [cx + a, cy + u, cz + b];
    return [cx + a, cy + b, cz + u];
  };
}

// ---------------------------------------------------------------------------

/**
 * Text glyph from 2D samples (x in [-0.5, 0.5], y in height units for width 1), see glyph.ts.
 * Falls back to a plain bar if there are no samples (SSR, tests).
 */
export function glyph(samples: Float32Array, n: number, seed = 1, width = 4.2): Float32Array {
  const out = new Float32Array(n * 3);
  const r = mulberry32(seed);
  const m = samples.length / 2;
  for (let i = 0; i < n; i++) {
    let x: number;
    let y: number;
    if (m > 0) {
      const k = Math.floor(r() * m);
      x = samples[k * 2] + (r() - 0.5) * 0.002;
      y = samples[k * 2 + 1] + (r() - 0.5) * 0.002;
    } else {
      x = r() - 0.5;
      y = (r() - 0.5) * 0.1;
    }
    out[i * 3] = x * width;
    out[i * 3 + 1] = y * width;
    out[i * 3 + 2] = (r() - 0.5) * 0.16;
  }
  return out;
}

/** Browser window wireframe with a phone in front on its right. */
export function interfaceShape(n: number, seed = 2): Float32Array {
  const bx = -0.55;
  const by = 0.15;
  const bw = 3.0;
  const bh = 2.2;
  const top = by + bh / 2;
  const left = bx - bw / 2;
  const barY = top - 0.32;
  const px = 1.55;
  const py = -0.3;
  const pz = 0.45;
  const pw = 0.95;
  const ph = 1.85;
  const parts: Part[] = [
    { w: 14, p: rectOutline(bx, by, 0, bw, bh) },
    { w: 3, p: line([left, barY, 0], [left + bw, barY, 0]) },
    { w: 1, p: ringXY(left + 0.2, top - 0.16, 0, 0.045) },
    { w: 1, p: ringXY(left + 0.36, top - 0.16, 0, 0.045) },
    { w: 1, p: ringXY(left + 0.52, top - 0.16, 0, 0.045) },
    { w: 2.5, p: rectOutline(bx + 0.5, top - 0.16, 0, 1.5, 0.15) },
    // sidebar, hero block, cards, text lines
    { w: 4, p: rectFill(left + 0.4, by - 0.2, 0, 0.55, 1.6) },
    { w: 7, p: rectFill(bx + 0.45, by + 0.4, 0, 1.75, 0.6) },
    { w: 3, p: rectFill(bx - 0.05, by - 0.5, 0, 0.55, 0.62) },
    { w: 3, p: rectFill(bx + 0.65, by - 0.5, 0, 0.55, 0.62) },
    { w: 3, p: rectFill(bx + 1.35, by - 0.5, 0, 0.5, 0.62) },
    { w: 1.5, p: line([bx - 0.4, by - 0.95, 0], [bx + 1.5, by - 0.95, 0]) },
    // phone
    { w: 9, p: rectOutline(px, py, pz, pw, ph) },
    { w: 1.5, p: line([px - 0.18, py + ph / 2 - 0.1, pz], [px + 0.18, py + ph / 2 - 0.1, pz]) },
    { w: 3, p: rectFill(px, py + 0.55, pz, pw - 0.2, 0.5) },
    { w: 2, p: rectFill(px - 0.2, py - 0.1, pz, 0.4, 0.4) },
    { w: 2, p: rectFill(px + 0.2, py - 0.1, pz, 0.4, 0.4) },
    { w: 1.5, p: line([px - 0.35, py - 0.55, pz], [px + 0.35, py - 0.55, pz]) },
    { w: 1, p: ringXY(px, py - ph / 2 + 0.12, pz, 0.06) },
  ];
  return build(n, seed, parts);
}

const API_NODES: V3[] = [
  [-1.85, 0.9, -0.3],
  [-1.75, -0.9, 0.4],
  [-0.75, 1.2, 0.5],
  [-0.85, -1.2, -0.5],
  [0.8, 1.15, -0.4],
  [0.9, -1.2, 0.4],
  [1.85, 0.75, 0.3],
  [1.8, -0.7, -0.3],
];
const API_RING_EDGES: [number, number][] = [
  [0, 2],
  [2, 4],
  [4, 6],
  [1, 3],
  [3, 5],
  [5, 7],
];

/** Service graph: a gateway hub with satellite services. */
export function api(n: number, seed = 3): Float32Array {
  const gw: V3 = [0, 0, 0];
  const parts: Part[] = [
    { w: 9, p: sphereShell(0, 0, 0, 0.36) },
    { w: 2, p: ringXY(0, 0, 0, 0.6) },
  ];
  for (const nd of API_NODES) {
    parts.push({ w: 3.5, p: sphereShell(nd[0], nd[1], nd[2], 0.17) });
    parts.push({ w: 3, p: line(gw, nd) });
  }
  for (const [a, b] of API_RING_EDGES) parts.push({ w: 2, p: line(API_NODES[a], API_NODES[b]) });
  return build(n, seed, parts);
}

/** Three stacked database discs and a small cache ring. */
export function data(n: number, seed = 4): Float32Array {
  const cx = -0.3;
  const rad = 1.0;
  const hh = 0.275;
  const parts: Part[] = [];
  for (const y of [1.0, 0, -1.0]) {
    parts.push({ w: 6, p: ringXZ(cx, y + hh, 0, rad) });
    parts.push({ w: 5, p: ringXZ(cx, y - hh, 0, rad) });
    parts.push({ w: 1.5, p: ringXZ(cx, y, 0, rad) });
    parts.push({ w: 2.5, p: diskXZ(cx, y + hh, 0, rad) });
    parts.push({
      w: 2,
      p: (r) => {
        const a = r() * Math.PI * 2;
        return [cx + Math.cos(a) * rad, y + (r() * 2 - 1) * hh, Math.sin(a) * rad];
      },
    });
  }
  // cache ring orbiting beside the stack
  parts.push({ w: 6, p: ringXY(1.65, 0.45, 0.2, 0.42) });
  parts.push({ w: 3, p: ringXY(1.65, 0.45, 0.2, 0.26) });
  parts.push({ w: 1, p: sphereShell(1.65, 0.45, 0.2, 0.07) });
  return build(n, seed, parts);
}

function diskXZ(cx: number, cy: number, cz: number, rad: number): Part["p"] {
  return (r) => {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * rad;
    return [cx + Math.cos(a) * d, cy, cz + Math.sin(a) * d];
  };
}

/** 4x3 grid of node plates (flat in XZ) with pod cubes on most plates. */
export function infra(n: number, seed = 5): Float32Array {
  const pitchX = 1.1;
  const pitchZ = 0.72;
  const pw = 0.85;
  const pd = 0.52;
  const hash = mulberry32(seed * 977);
  const parts: Part[] = [];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 3; j++) {
      const x = (i - 1.5) * pitchX;
      const z = (j - 1) * pitchZ;
      parts.push({
        w: 4,
        p: (r) => {
          const per = 2 * (pw + pd);
          let d = r() * per;
          if (d < pw) return [x - pw / 2 + d, 0, z - pd / 2];
          d -= pw;
          if (d < pd) return [x + pw / 2, 0, z - pd / 2 + d];
          d -= pd;
          if (d < pw) return [x + pw / 2 - d, 0, z + pd / 2];
          d -= pw;
          return [x - pw / 2, 0, z + pd / 2 - d];
        },
      });
      parts.push({
        w: 1,
        p: (r) => [x + (r() - 0.5) * pw, 0, z + (r() - 0.5) * pd],
      });
      if (hash() < 0.78) parts.push({ w: 3, p: cubeEdges(x, 0.2, z, 0.26) });
      if (hash() < 0.25) parts.push({ w: 2, p: cubeEdges(x + 0.2, 0.15, z + 0.12, 0.16) });
    }
  }
  for (let j = 0; j < 3; j++) {
    const z = (j - 1) * pitchZ;
    parts.push({ w: 1.5, p: line([-1.65, 0, z], [1.65, 0, z]) });
  }
  return build(n, seed, parts);
}

const ll = (latDeg: number, lonDeg: number): V3 => {
  const la = (latDeg * Math.PI) / 180;
  const lo = (lonDeg * Math.PI) / 180;
  return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)];
};

const ARCS: [V3, V3][] = [
  [ll(40, -74), ll(51, 0)],
  [ll(51, 0), ll(35, 139)],
  [ll(-33, 151), ll(1, 103)],
  [ll(37, -122), ll(40, -74)],
  [ll(-23, -46), ll(51, 0)],
  [ll(1, 103), ll(35, 139)],
];

/** Globe (sparse fibonacci sphere) with great-circle deploy arcs and endpoint markers. */
export function shipped(n: number, seed = 6): Float32Array {
  const R = 0.82;
  const parts: Part[] = [
    {
      w: 14,
      p: (r) => {
        // uniform-ish sphere; stratified by a random fibonacci slot
        const k = Math.floor(r() * 2400);
        const y = 1 - (2 * (k + 0.5)) / 2400;
        const rr = Math.sqrt(1 - y * y);
        const phi = k * 2.399963229728653;
        return [Math.cos(phi) * rr * R, y * R, Math.sin(phi) * rr * R];
      },
    },
  ];
  for (const [a, b] of ARCS) {
    const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
    const om = Math.acos(dot);
    const so = Math.sin(om) || 1;
    parts.push({
      w: 0.9,
      p: (r) => {
        const t = r();
        const s0 = Math.sin((1 - t) * om) / so;
        const s1 = Math.sin(t * om) / so;
        const lift = R * (1.02 + 0.3 * Math.sin(Math.PI * t));
        return [
          (a[0] * s0 + b[0] * s1) * lift,
          (a[1] * s0 + b[1] * s1) * lift,
          (a[2] * s0 + b[2] * s1) * lift,
        ];
      },
    });
    for (const e of [a, b]) {
      parts.push({
        w: 0.2,
        p: sphereShell(e[0] * R * 1.02, e[1] * R * 1.02, e[2] * R * 1.02, 0.05),
      });
    }
  }
  return build(n, seed, parts);
}

/** Wave grid: columns per row, and half-widths of the far (v = 0) and near (v = 1) rows. */
const WAVE_RATIO = 3.4;
const WAVE_FAR = 3.1;
const WAVE_NEAR = 2.1;
const waveSize = (n: number) => {
  const cols = Math.round(Math.sqrt(n * WAVE_RATIO));
  return { cols, rows: Math.max(2, Math.ceil(n / cols)) };
};
// rows pack tighter toward the horizon; the far rows are widest so perspective still fills the view
const waveZ = (v: number) => -1 + 2 * v ** 1.35;
const waveV = (z: number) => Math.max(0, (z + 1) / 2) ** (1 / 1.35);
const waveHalfW = (v: number) => WAVE_FAR + (WAVE_NEAR - WAVE_FAR) * v;

/**
 * A dotted landscape: a grid on the XZ plane (z -1 far .. 1 near) with a gentle rolling height,
 * wide enough to run past both edges of the view. The pose tilts it so the far rows sit toward a
 * horizon; the shader adds the live swell.
 */
export function wave(n: number, seed = 7): Float32Array {
  const out = new Float32Array(n * 3);
  const r = mulberry32(seed);
  const { cols, rows } = waveSize(n);
  for (let i = 0; i < n; i++) {
    const u = (i % cols) / (cols - 1);
    const v = Math.floor(i / cols) / (rows - 1);
    const z = waveZ(v);
    const x = (u * 2 - 1) * waveHalfW(v) + (r() - 0.5) * 0.01;
    const y = 0.09 * Math.sin(x * 1.3 + z * 0.8) + 0.06 * Math.sin(z * 3.1 - x * 0.5);
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
  }
  return out;
}

/** Grid column and row of each point of a `wave` field, recovered from its position (any order). */
export function waveCells(field: Float32Array) {
  const n = field.length / 3;
  const { cols, rows } = waveSize(n);
  const col = new Int32Array(n);
  const row = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    const rw = Math.round(waveV(field[i * 3 + 2]) * (rows - 1));
    const u = (field[i * 3] / waveHalfW(rw / (rows - 1)) + 1) / 2;
    row[i] = rw;
    col[i] = Math.round(u * (cols - 1));
  }
  return { col, row, cols, rows };
}

/**
 * The network over the wave: paths of links that wander from the horizon toward the viewer, so
 * current always flows forward. `pairs` holds point indices (two per link); `node` holds, per
 * point, [on a path 0|1, depth 0 far..1 near, the path's pulse phase]; `phase` is per link.
 */
export function waveNet(field: Float32Array, paths = 34, seed = 11) {
  const n = field.length / 3;
  const { col, row, cols, rows } = waveCells(field);
  const at = new Int32Array(cols * rows).fill(-1);
  for (let i = 0; i < n; i++) at[row[i] * cols + col[i]] = i;
  const r = mulberry32(seed);
  const pairs: number[] = [];
  const phase: number[] = [];
  const node = new Float32Array(n * 3);
  const mark = (i: number, ph: number) => node.set([1, row[i] / (rows - 1), ph], i * 3);
  for (let k = 0; k < paths; k++) {
    let c = Math.floor((0.04 + r() * 0.92) * cols);
    let rw = Math.floor(r() * rows * 0.45);
    const ph = r();
    let prev = at[rw * cols + c];
    if (prev < 0) continue;
    mark(prev, ph);
    while (rw < rows - 1) {
      rw = Math.min(rows - 1, rw + 3 + Math.floor(r() * Math.max(2, rows * 0.12)));
      c = Math.min(cols - 1, Math.max(0, c + Math.round((r() - 0.5) * cols * 0.09)));
      const next = at[rw * cols + c];
      if (next < 0) continue;
      pairs.push(prev, next);
      phase.push(ph);
      mark(next, ph);
      prev = next;
    }
  }
  return { pairs: Uint32Array.from(pairs), phase: Float32Array.from(phase), node };
}

/**
 * A sparse "neural" graph over any shape: spread-out points (neurons), each wired to its nearest
 * neighbours. A node's depth is its hop count from its cluster's first neuron, packed into
 * 0..`span`, so a pulse fired there cascades through the cluster and then rests until the next
 * one. Output matches waveNet.
 */
export function neuralNet(shape: Float32Array, neurons = 110, links = 2, seed = 5, span = 0.4) {
  const n = shape.length / 3;
  const r = mulberry32(seed);
  const d2 = (i: number, j: number) =>
    (shape[i * 3] - shape[j * 3]) ** 2 +
    (shape[i * 3 + 1] - shape[j * 3 + 1]) ** 2 +
    (shape[i * 3 + 2] - shape[j * 3 + 2]) ** 2;
  const pick: number[] = [];
  for (let t = 0; pick.length < neurons && t < neurons * 8; t++) {
    const i = Math.floor(r() * n);
    if (pick.every((j) => d2(i, j) > 0.03)) pick.push(i);
  }
  const adj = pick.map(() => new Set<number>());
  pick.forEach((i, a) => {
    pick
      .map((j, b) => [b, d2(i, j)] as const)
      .filter(([b, d]) => b !== a && d < 0.8)
      .sort((x, y) => x[1] - y[1])
      .slice(0, links)
      .forEach(([b]) => {
        adj[a].add(b);
        adj[b].add(a);
      });
  });
  const pairs: number[] = [];
  const phase: number[] = [];
  const node = new Float32Array(n * 3);
  const hops = new Int32Array(pick.length).fill(-1);
  for (let s0 = 0; s0 < pick.length; s0++) {
    if (hops[s0] >= 0 || adj[s0].size === 0) continue;
    const ph = r();
    const cluster = [s0];
    hops[s0] = 0;
    for (let q = 0; q < cluster.length; q++) {
      for (const b of adj[cluster[q]]) {
        if (hops[b] >= 0) continue;
        hops[b] = hops[cluster[q]] + 1;
        cluster.push(b);
      }
    }
    const far = Math.max(1, ...cluster.map((a) => hops[a]));
    for (const a of cluster) {
      node.set([1, (hops[a] / far) * span, ph], pick[a] * 3);
      // each link once, from the nearer end, so current runs outward
      for (const b of adj[a]) {
        if (hops[b] > hops[a] || (hops[b] === hops[a] && b > a)) {
          pairs.push(pick[a], pick[b]);
          phase.push(ph);
        }
      }
    }
  }
  return { pairs: Uint32Array.from(pairs), phase: Float32Array.from(phase), node };
}

/**
 * Reorders `target` so the k-th point from the left in `ref` pairs with the k-th from the left in
 * `target`. Morphs between the two then travel mostly vertically instead of criss-crossing.
 */
export function matchByX(ref: Float32Array, target: Float32Array): Float32Array {
  const n = Math.min(ref.length, target.length) / 3;
  const byX = (a: Float32Array) =>
    Array.from({ length: n }, (_, i) => i).sort((i, j) => a[i * 3] - a[j * 3]);
  const ri = byX(ref);
  const ti = byX(target);
  const out = new Float32Array(target.length);
  for (let k = 0; k < n; k++) {
    out.set(target.subarray(ti[k] * 3, ti[k] * 3 + 3), ri[k] * 3);
  }
  return out;
}

/** The ordered shapes used by the hero (see CHAPTER_IDS). `nameSamples` come from glyph.ts. */
export function heroShapes(n: number, nameSamples: Float32Array): Float32Array[] {
  const name = glyph(nameSamples, n, 1, 4.2);
  // the name falls straight down into the field, which then rises into the interface
  const field = matchByX(name, wave(n));
  return [name, field, matchByX(field, interfaceShape(n)), api(n), data(n), infra(n), shipped(n)];
}
