import { profile } from "@/content/profile";

export type LayerId = "interface" | "api" | "data" | "infra";
export type PerformanceTier = "high" | "low";

export interface LayerObjectCounts {
  readonly panels?: number;
  readonly nodes?: number;
  readonly pods?: number;
}

export interface LayerSpec {
  readonly id: LayerId;
  readonly order: number;
  readonly name: string;
  readonly label: string;
  readonly yAssembled: number;
  readonly yExploded: number;
  readonly objectCounts: Record<PerformanceTier, LayerObjectCounts>;
}

/**
 * Builds label text from profile.stackLayers:
 * label + " · " + first 3 tech joined with " · "
 */
export function buildLayerLabel(id: LayerId): string {
  const layerDef = profile.stackLayers.find((layer) => layer.id === id);
  if (!layerDef) {
    return id.toUpperCase();
  }
  const topTech = layerDef.tech.slice(0, 3).join(" · ");
  return topTech ? `${layerDef.label} · ${topTech}` : layerDef.label;
}

export const STACK_LAYERS: readonly LayerSpec[] = [
  {
    id: "interface",
    order: 0,
    name: "INTERFACE",
    label: buildLayerLabel("interface"),
    yAssembled: 0.45,
    yExploded: 1.95,
    objectCounts: {
      high: { panels: 7 }, // 6 cards + 1 phone panel
      low: { panels: 7 },
    },
  },
  {
    id: "api",
    order: 1,
    name: "API",
    label: buildLayerLabel("api"),
    yAssembled: 0.15,
    yExploded: 0.65,
    objectCounts: {
      high: { nodes: 8 },
      low: { nodes: 8 },
    },
  },
  {
    id: "data",
    order: 2,
    name: "DATA",
    label: buildLayerLabel("data"),
    yAssembled: -0.15,
    yExploded: -0.65,
    objectCounts: {
      high: { nodes: 4 }, // 3 cylinders + 1 cache cube
      low: { nodes: 4 },
    },
  },
  {
    id: "infra",
    order: 3,
    name: "INFRA",
    label: buildLayerLabel("infra"),
    yAssembled: -0.45,
    yExploded: -1.95,
    objectCounts: {
      high: { pods: 24 }, // 4x3 node plates + up to 24 pods
      low: { pods: 8 },
    },
  },
] as const;

export const TIER_CONFIG = {
  high: {
    packets: 40,
    maxPods: 24,
    dpr: [1, 2] as [number, number],
    bloom: true,
  },
  low: {
    packets: 12,
    maxPods: 8,
    dpr: [1, 1.5] as [number, number],
    bloom: false,
  },
} as const;

export function getLayerSpec(id: LayerId): LayerSpec {
  const spec = STACK_LAYERS.find((layer) => layer.id === id);
  if (!spec) {
    throw new Error(`Layer spec not found for id: ${id}`);
  }
  return spec;
}
