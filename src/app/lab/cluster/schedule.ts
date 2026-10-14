export type PhaseName = "BOOT" | "SCHEDULE" | "TRAFFIC" | "AUTOSCALE" | "FAILURE" | "ROLLOUT";

export type PodLayer = "ui" | "api" | "cache" | "db";

export interface PodConfig {
  id: number;
  layer: PodLayer;
  defaultNode: number;
  defaultSlot: number;
}

export interface PodSchedule {
  id: number;
  layer: PodLayer;
  targetPos: [number, number, number];
  targetScale: number;
  targetColor: string;
  active: boolean;
  nodeId: number;
  slotId: number;
}

export interface NodeSchedule {
  id: number;
  col: number;
  row: number;
  center: [number, number, number];
  targetY: number;
  targetDim: number; // 0 = normal, 1 = dim/killed
  isKilled: boolean;
}

export interface TrafficPacket {
  id: number;
  pos: [number, number, number];
  scale: number;
}

export interface ClusterSchedule {
  phase: PhaseName;
  phaseProgress: number;
  globalProgress: number;
  nodes: NodeSchedule[];
  pods: PodSchedule[];
  trafficPackets: TrafficPacket[];
  trafficActive: boolean;
  rolloutRingScale: number;
  rolloutRingOpacity: number;
  rolloutComplete: boolean;
  activePodsCount: number;
  onlineNodesCount: number;
  statusMessage: string;
}

// Grid layout constants
export const COLS = 4;
export const ROWS = 3;
export const TOTAL_NODES = COLS * ROWS; // 12
export const SPACING_X = 2.1;
export const SPACING_Z = 2.1;
export const MAX_PODS = 36;
export const SCRIPTED_FAIL_NODE = 5;

// Color palette
export const COLOR_BG = "#0B0D10";
export const COLOR_SURFACE = "#12161B";
export const COLOR_SURFACE_DIM = "#0B0E12";
export const COLOR_EDGE = "#3A4350";
export const COLOR_EDGE_DIM = "#1C222B";
export const COLOR_TEXT = "#E6EAF0";
export const COLOR_MUTED = "#8B95A3";
export const COLOR_AMBER = "#E8A33D";
export const COLOR_GREEN = "#4CC38A";

// Layer tag colors (muted greys)
export const LAYER_COLORS: Record<PodLayer, string> = {
  ui: "#8B95A3", // muted steel
  api: "#6E7681", // slate
  cache: "#5A626E", // cool grey
  db: "#454C56", // deep graphite
};

// Slot offsets on each 1.6 x 0.12 x 1.6 plate
// Top surface of plate is y = 0.06. Pod cube height is 0.28, half-height is 0.14 -> pod center y = 0.20
export const SLOT_OFFSETS: [number, number, number][] = [
  [-0.42, 0.2, -0.42], // Slot 0
  [0.42, 0.2, -0.42], // Slot 1
  [-0.42, 0.2, 0.42], // Slot 2
  [0.42, 0.2, 0.42], // Slot 3
];

// Node base positions
export const NODE_POSITIONS: [number, number, number][] = Array.from(
  { length: TOTAL_NODES },
  (_, id) => {
    const col = id % COLS;
    const row = Math.floor(id / COLS);
    const x = (col - 1.5) * SPACING_X;
    const z = (row - 1.0) * SPACING_Z;
    return [x, 0, z];
  },
);

// Pod definitions (18 initial + autoscaled pods, 18 reserve)
export const POD_CONFIGS: PodConfig[] = [
  // 6 initial pods (SCHEDULE 0.15 - 0.35)
  { id: 0, layer: "ui", defaultNode: 0, defaultSlot: 0 },
  { id: 1, layer: "ui", defaultNode: 4, defaultSlot: 0 },
  { id: 2, layer: "api", defaultNode: 1, defaultSlot: 0 },
  { id: 3, layer: "api", defaultNode: 5, defaultSlot: 0 },
  { id: 4, layer: "cache", defaultNode: 2, defaultSlot: 0 },
  { id: 5, layer: "db", defaultNode: 10, defaultSlot: 0 },

  // 12 autoscaled pods (AUTOSCALE 0.55 - 0.72 -> total 18 pods)
  { id: 6, layer: "ui", defaultNode: 0, defaultSlot: 1 },
  { id: 7, layer: "ui", defaultNode: 4, defaultSlot: 1 },
  { id: 8, layer: "ui", defaultNode: 8, defaultSlot: 0 },
  { id: 9, layer: "api", defaultNode: 1, defaultSlot: 1 },
  { id: 10, layer: "api", defaultNode: 5, defaultSlot: 1 },
  { id: 11, layer: "api", defaultNode: 9, defaultSlot: 0 },
  { id: 12, layer: "cache", defaultNode: 2, defaultSlot: 1 },
  { id: 13, layer: "cache", defaultNode: 6, defaultSlot: 0 },
  { id: 14, layer: "cache", defaultNode: 6, defaultSlot: 1 },
  { id: 15, layer: "db", defaultNode: 7, defaultSlot: 0 },
  { id: 16, layer: "db", defaultNode: 11, defaultSlot: 0 },
  { id: 17, layer: "db", defaultNode: 11, defaultSlot: 1 },

  // 18 reserve slots
  ...Array.from({ length: 18 }, (_, i) => ({
    id: 18 + i,
    layer: (["ui", "api", "cache", "db"] as const)[i % 4],
    defaultNode: (i + 3) % TOTAL_NODES,
    defaultSlot: 2 + (i % 2),
  })),
];

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

/**
 * Pure scheduling function calculating target positions, scales, and colors.
 * Called in useFrame using current scroll progress and active killed nodes.
 */
export function schedule(
  progress: number,
  killedNodes: Set<number> = new Set(),
  time = 0,
): ClusterSchedule {
  const p = clamp(progress, 0, 1);

  // Determine current phase
  let phase: PhaseName = "BOOT";
  let phaseProgress = 0;
  if (p < 0.15) {
    phase = "BOOT";
    phaseProgress = clamp(p / 0.15, 0, 1);
  } else if (p < 0.35) {
    phase = "SCHEDULE";
    phaseProgress = clamp((p - 0.15) / 0.2, 0, 1);
  } else if (p < 0.55) {
    phase = "TRAFFIC";
    phaseProgress = clamp((p - 0.35) / 0.2, 0, 1);
  } else if (p < 0.72) {
    phase = "AUTOSCALE";
    phaseProgress = clamp((p - 0.55) / 0.17, 0, 1);
  } else if (p < 0.88) {
    phase = "FAILURE";
    phaseProgress = clamp((p - 0.72) / 0.16, 0, 1);
  } else {
    phase = "ROLLOUT";
    phaseProgress = clamp((p - 0.88) / 0.12, 0, 1);
  }

  // Scripted failure active during FAILURE and ROLLOUT phases (unless manually toggled)
  const isScriptedFailureActive = p >= 0.72;
  const effectiveKilledNodes = new Set<number>(killedNodes);
  if (isScriptedFailureActive) {
    effectiveKilledNodes.add(SCRIPTED_FAIL_NODE);
  }

  // Compute node targets
  const nodeSchedules: NodeSchedule[] = NODE_POSITIONS.map((center, id) => {
    const col = id % COLS;
    const row = Math.floor(id / COLS);
    const isKilled = effectiveKilledNodes.has(id);

    let targetY = 0;
    if (p < 0.15) {
      // BOOT: nodes rise one by one
      const nodeStart = (id / TOTAL_NODES) * 0.1;
      const nodeEnd = nodeStart + 0.04;
      const riseProgress = clamp((p - nodeStart) / (nodeEnd - nodeStart), 0, 1);
      targetY = lerp(-3.0, 0, easeOutCubic(riseProgress));
    }

    let targetDim = 0;
    if (isKilled) {
      if (id === SCRIPTED_FAIL_NODE && p >= 0.72 && p < 0.78) {
        targetDim = clamp((p - 0.72) / 0.05, 0, 1);
      } else {
        targetDim = 1.0;
      }
    }

    return {
      id,
      col,
      row,
      center,
      targetY,
      targetDim,
      isKilled,
    };
  });

  // Calculate available slots on healthy nodes for rescheduling
  const occupiedSlots = new Set<string>(); // "nodeId:slotId"

  // 1. Initial reservation of default slots for active pods on healthy nodes
  const maxActivePodCount = p < 0.15 ? 0 : p < 0.55 ? 6 : 18;

  // Track which pods need alternate placement
  const podPlacements: {
    podId: number;
    nodeId: number;
    slotId: number;
    isRescheduled: boolean;
  }[] = [];

  for (let i = 0; i < maxActivePodCount; i++) {
    const cfg = POD_CONFIGS[i];
    const isDefaultNodeKilled = effectiveKilledNodes.has(cfg.defaultNode);

    if (!isDefaultNodeKilled) {
      occupiedSlots.add(`${cfg.defaultNode}:${cfg.defaultSlot}`);
      podPlacements.push({
        podId: cfg.id,
        nodeId: cfg.defaultNode,
        slotId: cfg.defaultSlot,
        isRescheduled: false,
      });
    }
  }

  // 2. Reschedule pods whose default node is killed
  for (let i = 0; i < maxActivePodCount; i++) {
    const cfg = POD_CONFIGS[i];
    const isDefaultNodeKilled = effectiveKilledNodes.has(cfg.defaultNode);

    if (isDefaultNodeKilled) {
      // Find the best healthy node with an available slot
      let assignedNode = -1;
      let assignedSlot = -1;

      // Prefer nodes on same row or adjacent col
      const candidateNodes = [8, 9, 2, 6, 7, 10, 11, 1, 0, 4, 3].filter(
        (nid) => !effectiveKilledNodes.has(nid),
      );

      for (const nid of candidateNodes) {
        for (let s = 0; s < 4; s++) {
          const key = `${nid}:${s}`;
          if (!occupiedSlots.has(key)) {
            assignedNode = nid;
            assignedSlot = s;
            occupiedSlots.add(key);
            break;
          }
        }
        if (assignedNode !== -1) break;
      }

      if (assignedNode === -1) {
        assignedNode = 0;
        assignedSlot = 0;
      }

      podPlacements.push({
        podId: cfg.id,
        nodeId: assignedNode,
        slotId: assignedSlot,
        isRescheduled: true,
      });
    }
  }

  // Build map of placements for quick lookup
  const placementMap = new Map<number, (typeof podPlacements)[0]>();
  for (const pl of podPlacements) {
    placementMap.set(pl.podId, pl);
  }

  // Compute pod targets
  const podSchedules: PodSchedule[] = [];
  let activePodsRunning = 0;

  for (let i = 0; i < MAX_PODS; i++) {
    const cfg = POD_CONFIGS[i];
    const placement = placementMap.get(cfg.id);

    let targetScale = 0;
    let active = false;
    let targetColor = LAYER_COLORS[cfg.layer];
    let currentNodeId = cfg.defaultNode;
    let currentSlotId = cfg.defaultSlot;

    if (i < 6) {
      // Initial 6 pods
      if (p < 0.15) {
        targetScale = 0;
      } else if (p < 0.35) {
        // SCHEDULE: pop onto nodes
        const podStart = 0.15 + (i / 6) * 0.15;
        const podEnd = podStart + 0.04;
        const popProgress = clamp((p - podStart) / (podEnd - podStart), 0, 1);
        targetScale = easeOutBack(popProgress);
      } else {
        targetScale = 1;
      }
    } else if (i < 18) {
      // Autoscaled pods (6 to 17)
      if (p < 0.55) {
        targetScale = 0;
      } else if (p < 0.72) {
        // AUTOSCALE: pods pop in sequentially
        const podStart = 0.55 + ((i - 6) / 12) * 0.13;
        const podEnd = podStart + 0.035;
        const popProgress = clamp((p - podStart) / (podEnd - podStart), 0, 1);
        targetScale = easeOutBack(popProgress);
      } else {
        targetScale = 1;
      }
    } else {
      // Reserve pods remain unallocated
      targetScale = 0;
    }

    if (placement) {
      if (placement.isRescheduled) {
        // Pod was evicted from a killed node!
        if (p >= 0.72 && p < 0.78) {
          // Shrink out from the failed node
          currentNodeId = cfg.defaultNode;
          currentSlotId = cfg.defaultSlot;
          const shrinkT = clamp((p - 0.72) / 0.05, 0, 1);
          targetScale = (1 - shrinkT) * (targetScale > 0 ? 1 : 0);
        } else if (p >= 0.78 && p < 0.85) {
          // Reappear on the new healthy node
          currentNodeId = placement.nodeId;
          currentSlotId = placement.slotId;
          const growT = clamp((p - 0.78) / 0.06, 0, 1);
          targetScale = easeOutBack(growT);
        } else {
          // Settled on rescheduled node
          currentNodeId = placement.nodeId;
          currentSlotId = placement.slotId;
        }
      } else {
        currentNodeId = placement.nodeId;
        currentSlotId = placement.slotId;
      }
    }

    // TRAFFIC phase (0.35 - 0.55): active amber pulses
    if (p >= 0.35 && p < 0.55 && targetScale > 0.5) {
      const trafficProgress = (p - 0.35) / 0.2;
      const nodeCol = currentNodeId % COLS;
      // Pulse moves through columns: col 0 (UI) -> col 1 (API) -> col 2 (Cache) -> col 3 (DB)
      const pulseCenter = (trafficProgress * 4 + time * 1.5) % 4;
      const dist = Math.abs(nodeCol - pulseCenter);
      if (dist < 0.7) {
        active = true;
        targetColor = COLOR_AMBER;
      }
    }

    // ROLLOUT phase (0.88 - 1.0): wave sweeping left to right
    if (p >= 0.88 && targetScale > 0) {
      const nodeCol = currentNodeId % COLS;
      const waveStart = 0.88 + nodeCol * 0.02;
      const waveMid = waveStart + 0.015;
      const waveEnd = waveMid + 0.015;

      if (p >= waveStart && p < waveMid) {
        // Scale down (evicting old version)
        const dip = (p - waveStart) / (waveMid - waveStart);
        targetScale = lerp(1, 0.15, dip);
      } else if (p >= waveMid && p < waveEnd) {
        // Scale back up (booting new version)
        const rise = (p - waveMid) / (waveEnd - waveMid);
        targetScale = lerp(0.15, 1, easeOutBack(rise));
      } else if (p >= waveEnd) {
        targetScale = 1;
      }

      // Rollout complete state: green deployed state
      if (p >= 0.96) {
        targetColor = COLOR_GREEN;
      }
    }

    // Compute slot world position
    const nodeCenter = NODE_POSITIONS[currentNodeId] || [0, 0, 0];
    const nodeY = nodeSchedules[currentNodeId]?.targetY ?? 0;
    const slotOffset = SLOT_OFFSETS[currentSlotId] || [0, 0.2, 0];
    const targetPos: [number, number, number] = [
      nodeCenter[0] + slotOffset[0],
      nodeY + slotOffset[1],
      nodeCenter[2] + slotOffset[2],
    ];

    if (targetScale > 0.1) {
      activePodsRunning++;
    }

    podSchedules.push({
      id: cfg.id,
      layer: cfg.layer,
      targetPos,
      targetScale,
      targetColor,
      active,
      nodeId: currentNodeId,
      slotId: currentSlotId,
    });
  }

  // TRAFFIC Packets (24 instanced spheres)
  const trafficPackets: TrafficPacket[] = [];
  const trafficActive = p >= 0.35 && p < 0.55;

  for (let i = 0; i < 24; i++) {
    const lane = i % ROWS; // 0, 1, 2
    const offset = i / 24;
    const laneZ = (lane - 1.0) * SPACING_Z;

    if (trafficActive) {
      const t = ((p - 0.35) * 6 + time * 1.2 + offset) % 1.0;
      const px = lerp(-6.0, 3.8, t);
      // Small hop between node hops
      const py = 0.2 + Math.sin(t * Math.PI * 4) * 0.08;
      const pz = laneZ + Math.sin(t * Math.PI * 2) * 0.05;
      const scale = Math.sin(t * Math.PI) > 0.1 ? 1 : 0;

      trafficPackets.push({
        id: i,
        pos: [px, py, pz],
        scale,
      });
    } else {
      trafficPackets.push({
        id: i,
        pos: [-6.0, 0.2, laneZ],
        scale: 0,
      });
    }
  }

  // ROLLOUT Ring & complete state
  const rolloutComplete = p >= 0.96;
  let rolloutRingScale = 0;
  let rolloutRingOpacity = 0;
  if (p >= 0.94) {
    const ringT = clamp((p - 0.94) / 0.04, 0, 1);
    rolloutRingScale = easeOutBack(ringT);
    rolloutRingOpacity = ringT;
  }

  // Counts and status message
  const onlineNodesCount = nodeSchedules.filter((n) => !n.isKilled && n.targetY > -0.5).length;

  let statusMessage = "hardware boot sequence";
  if (phase === "BOOT") {
    statusMessage = "hardware boot sequence";
  } else if (phase === "SCHEDULE") {
    statusMessage = "scheduling initial workloads (6 pods)";
  } else if (phase === "TRAFFIC") {
    statusMessage = "routing ingress traffic (amber packets)";
  } else if (phase === "AUTOSCALE") {
    statusMessage = "autoscaling workloads: 6 -> 18 pods";
  } else if (phase === "FAILURE") {
    statusMessage = isScriptedFailureActive
      ? "node-05 failed -> evicting & rescheduling"
      : "node evicted -> self-healing active";
  } else if (phase === "ROLLOUT") {
    statusMessage = rolloutComplete
      ? "rollout complete ✓"
      : "rolling update: sweeping cluster (v1 -> v2)";
  }

  return {
    phase,
    phaseProgress,
    globalProgress: p,
    nodes: nodeSchedules,
    pods: podSchedules,
    trafficPackets,
    trafficActive,
    rolloutRingScale,
    rolloutRingOpacity,
    rolloutComplete,
    activePodsCount: activePodsRunning,
    onlineNodesCount,
    statusMessage,
  };
}
