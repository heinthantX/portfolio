/**
 * A tiny spiking network: nodes fire on their own now and then, a firing node sends a pulse down
 * every link, and a pulse that arrives may fire the next node, so activity cascades like
 * lightning through a nervous system. Pure and seeded; the caller steps it once per frame.
 */
export interface Pulse {
  edge: number;
  /** travels from edge[0] to edge[1] when 1, the other way when -1 */
  dir: 1 | -1;
  /** 0..1 along the link */
  t: number;
}

export interface FiringOptions {
  /** seconds a pulse takes to cross a link */
  travel?: number;
  /** spontaneous firings per node per second */
  rate?: number;
  /** chance an arriving pulse fires the next node */
  carry?: number;
  /** seconds a node stays quiet after firing */
  refractory?: number;
}

export function createFiring(
  nodes: number,
  edges: readonly (readonly [number, number])[],
  rng: () => number,
  { travel = 0.45, rate = 0.07, carry = 0.62, refractory = 1.4 }: FiringOptions = {},
) {
  const flash = new Float32Array(nodes);
  const rest = new Float32Array(nodes);
  const pulses: Pulse[] = [];
  const touching = Array.from({ length: nodes }, () => [] as number[]);
  edges.forEach(([a, b], k) => {
    touching[a].push(k);
    touching[b].push(k);
  });

  const fire = (i: number, from = -1) => {
    flash[i] = 1;
    rest[i] = refractory;
    for (const k of touching[i]) {
      if (k === from) continue;
      pulses.push({ edge: k, dir: edges[k][0] === i ? 1 : -1, t: 0 });
    }
  };

  /** Advance by dt seconds; `boost(i)` adds extra firings per second (e.g. near the cursor). */
  const step = (dt: number, boost?: (i: number) => number) => {
    const fade = Math.exp(-dt * 4.5);
    for (let i = 0; i < nodes; i++) {
      flash[i] *= fade;
      rest[i] = Math.max(0, rest[i] - dt);
      if (rest[i] === 0 && rng() < (rate + (boost?.(i) ?? 0)) * dt) fire(i);
    }
    for (let p = pulses.length - 1; p >= 0; p--) {
      const pl = pulses[p];
      pl.t += dt / travel;
      if (pl.t < 1) continue;
      pulses.splice(p, 1);
      const to = pl.dir === 1 ? edges[pl.edge][1] : edges[pl.edge][0];
      if (rest[to] === 0 && rng() < carry) fire(to, pl.edge);
      else flash[to] = Math.max(flash[to], 0.45);
    }
  };

  return { flash, pulses, step, fire };
}

/** Links from each point to its `k` nearest others (2D), each link listed once. */
export function nearestLinks(pts: readonly (readonly number[])[], k = 2, maxDist = Infinity) {
  const seen = new Set<string>();
  const out: [number, number][] = [];
  pts.forEach((a, i) => {
    pts
      .map((b, j) => [j, Math.hypot(a[0] - b[0], a[1] - b[1])] as const)
      .filter(([j, d]) => j !== i && d <= maxDist)
      .sort((p, q) => p[1] - q[1])
      .slice(0, k)
      .forEach(([j]) => {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (seen.has(key)) return;
        seen.add(key);
        out.push(i < j ? [i, j] : [j, i]);
      });
  });
  return out;
}
