import { podCount } from "./phases";

export const COLS = 4;
export const ROWS = 3;
export const TOTAL_NODES = COLS * ROWS; // 12
export const SLOTS_PER_NODE = 4;
export const TOTAL_SLOTS = TOTAL_NODES * SLOTS_PER_NODE; // 48
export const SCRIPTED_FAIL_NODE = 7;

export interface PodTarget {
  id: number;
  node: number;
  slot: number;
  scale: number;
  active: boolean;
}

export interface NodePlateLayout {
  id: number;
  col: number;
  row: number;
  x: number;
  z: number;
}

/**
 * 4x3 node plate centers on a 3.2 x 3.2 slab
 */
export const NODE_LAYOUTS: readonly NodePlateLayout[] = Array.from(
  { length: TOTAL_NODES },
  (_, id) => {
    const col = id % COLS;
    const row = Math.floor(id / COLS);
    const x = (col - 1.5) * 0.68;
    const z = (row - 1.0) * 0.82;
    return { id, col, row, x, z };
  },
);

/**
 * 4 pod slots per node plate (2x2 layout relative to plate center)
 */
export const POD_SLOT_OFFSETS: readonly [number, number, number][] = [
  [-0.14, 0.08, -0.14],
  [0.14, 0.08, -0.14],
  [-0.14, 0.08, 0.14],
  [0.14, 0.08, 0.14],
] as const;

/**
 * Checks whether a given node is killed at progress p, taking into account
 * scripted failure (node 7 fails in second half of SCALE 0.77..0.86)
 * and interactive killed set.
 */
export function isNodeKilled(
  nodeId: number,
  progress: number,
  killed: Set<number> = new Set(),
): boolean {
  if (killed.has(nodeId)) {
    return true;
  }
  if (nodeId === SCRIPTED_FAIL_NODE && progress >= 0.77 && progress < 0.86) {
    return true;
  }
  return false;
}

/**
 * Pure scheduling function calculating per-pod targets { node, slot, scale, active }.
 * Guarantees:
 * - Active pod count strictly matches `podCount(progress, maxPods)`.
 * - No active pod is ever placed on a killed node.
 * - Handles rollout wave sweeping columns late in SCALE (0.81..0.86).
 */
export function schedule(
  progress: number,
  maxPods: number,
  killed: Set<number> = new Set(),
): PodTarget[] {
  const p = Math.max(0, Math.min(1, progress));
  const activeCount = podCount(p, maxPods);

  // Compute effective killed nodes
  const effectiveKilled = new Set<number>(killed);
  if (p >= 0.77 && p < 0.86) {
    effectiveKilled.add(SCRIPTED_FAIL_NODE);
  }

  // Pre-calculate healthy nodes
  const healthyNodes: number[] = [];
  for (let i = 0; i < TOTAL_NODES; i++) {
    if (!effectiveKilled.has(i)) {
      healthyNodes.push(i);
    }
  }

  // Fallback: if all nodes were killed, pick node 0 to avoid crash
  if (healthyNodes.length === 0) {
    healthyNodes.push(0);
  }

  // Track occupied slots: key "node:slot"
  const occupied = new Set<string>();

  // Pass 1: Assign default healthy placements
  interface PlannedPlacement {
    node: number;
    slot: number;
    rescheduled: boolean;
  }

  const placements: (PlannedPlacement | null)[] = Array.from({ length: maxPods }, () => null);

  for (let i = 0; i < activeCount; i++) {
    const defaultNode = i % TOTAL_NODES;
    const defaultSlot = Math.floor(i / TOTAL_NODES) % SLOTS_PER_NODE;

    if (!effectiveKilled.has(defaultNode)) {
      const key = `${defaultNode}:${defaultSlot}`;
      if (!occupied.has(key)) {
        occupied.add(key);
        placements[i] = {
          node: defaultNode,
          slot: defaultSlot,
          rescheduled: false,
        };
      }
    }
  }

  // Pass 2: Reschedule pods whose default node is killed or slot was taken
  for (let i = 0; i < activeCount; i++) {
    if (placements[i] !== null) continue;

    let assignedNode = healthyNodes[0];
    let assignedSlot = 0;
    let found = false;

    // Search for any available slot on a healthy node
    for (const node of healthyNodes) {
      for (let s = 0; s < SLOTS_PER_NODE; s++) {
        const key = `${node}:${s}`;
        if (!occupied.has(key)) {
          occupied.add(key);
          assignedNode = node;
          assignedSlot = s;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    placements[i] = {
      node: assignedNode,
      slot: assignedSlot,
      rescheduled: true,
    };
  }

  // Build target list for all maxPods
  const targets: PodTarget[] = [];

  for (let i = 0; i < maxPods; i++) {
    const isActive = i < activeCount;
    const placement = placements[i];

    const node = placement ? placement.node : i % TOTAL_NODES;
    const slot = placement ? placement.slot : Math.floor(i / TOTAL_NODES) % SLOTS_PER_NODE;

    let scale = isActive ? 1.0 : 0.0;

    // Rollout wave late in SCALE (0.81..0.86) sweeping left to right across columns
    if (isActive && p >= 0.81 && p < 0.86) {
      const col = node % COLS;
      const waveStart = 0.81 + col * 0.012;
      const waveMid = waveStart + 0.007;
      const waveEnd = waveMid + 0.007;

      if (p >= waveStart && p < waveEnd) {
        if (p < waveMid) {
          scale = 1.0 - 0.75 * ((p - waveStart) / (waveMid - waveStart));
        } else {
          scale = 0.25 + 0.75 * ((p - waveMid) / (waveEnd - waveMid));
        }
      }
    }

    targets.push({
      id: i,
      node,
      slot,
      scale,
      active: isActive,
    });
  }

  return targets;
}
