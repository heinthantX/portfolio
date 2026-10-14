export type PhaseName = "DRAW" | "BUILD" | "EXPLODE" | "RUN" | "SCALE" | "DEPLOYED";

export interface PhaseSpec {
  readonly name: PhaseName;
  readonly from: number;
  readonly to: number;
}

export const PHASES: readonly PhaseSpec[] = [
  { name: "DRAW", from: 0, to: 0.14 },
  { name: "BUILD", from: 0.14, to: 0.32 },
  { name: "EXPLODE", from: 0.32, to: 0.5 },
  { name: "RUN", from: 0.5, to: 0.68 },
  { name: "SCALE", from: 0.68, to: 0.86 },
  { name: "DEPLOYED", from: 0.86, to: 1.0 },
] as const;

/**
 * Returns the active phase at progress p.
 */
export function phaseAt(p: number): PhaseName {
  if (p < 0.14) return "DRAW";
  if (p < 0.32) return "BUILD";
  if (p < 0.5) return "EXPLODE";
  if (p < 0.68) return "RUN";
  if (p < 0.86) return "SCALE";
  return "DEPLOYED";
}

/**
 * Normalizes progress p to a local 0..1 interval between `from` and `to`, clamped.
 */
export function local(p: number, from: number, to: number): number {
  if (to <= from) return 0;
  if (p <= from) return 0;
  if (p >= to) return 1;
  return (p - from) / (to - from);
}

/**
 * Returns the status line text per SPEC.md:
 * - DRAW (0–0.14): "drafting spec…"
 * - BUILD (0.14–0.32): "building…"
 * - EXPLODE (0.32–0.50): "4 layers · ready"
 * - RUN (0.50–0.68): "routing requests"
 * - SCALE (0.68–0.86): "scaling 3 → 12" in 1st half, "node-07 lost · rescheduling" in 2nd half
 * - DEPLOYED (0.86–1.00): "deployed ✓"
 */
export function statusText(p: number): string {
  const phase = phaseAt(p);
  switch (phase) {
    case "DRAW":
      return "drafting spec…";
    case "BUILD":
      return "building…";
    case "EXPLODE":
      return "4 layers · ready";
    case "RUN":
      return "routing requests";
    case "SCALE":
      return p >= 0.77 ? "node-07 lost · rescheduling" : "scaling 3 → 12";
    case "DEPLOYED":
      return "deployed ✓";
  }
}

/**
 * Returns active pod count for progress p up to `max` pods.
 * Strictly monotonic growth: podCount(p1, max) <= podCount(p2, max) for all p1 <= p2.
 */
export function podCount(p: number, max = 12): number {
  const clamped = Math.max(0, Math.min(1, p));
  const basePods = Math.min(3, max);
  const targetPods = Math.min(12, max);

  if (clamped < 0.14) {
    return 0;
  }
  if (clamped < 0.32) {
    const t = local(clamped, 0.14, 0.32);
    return Math.min(basePods, Math.floor(t * (basePods + 1)));
  }
  if (clamped < 0.68) {
    return basePods;
  }
  if (clamped < 0.86) {
    const t = local(clamped, 0.68, 0.86);
    const diff = targetPods - basePods;
    return Math.min(targetPods, basePods + Math.floor(t * (diff + 1)));
  }
  return targetPods;
}
