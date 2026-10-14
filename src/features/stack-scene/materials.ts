import { dampC } from "maath/easing";
import * as THREE from "three";
import type { ThemeMood } from "./useThemeColors";

export interface MoodMaterialParams {
  readonly roughness: number;
  readonly clearcoat: number;
  readonly metalness: number;
  readonly bloom: boolean;
  readonly edgeOpacity: number;
}

export const MOOD_MATERIALS: Record<ThemeMood, MoodMaterialParams> = {
  dark: {
    roughness: 0.35,
    clearcoat: 0.6,
    metalness: 0.2,
    bloom: true,
    edgeOpacity: 1.0,
  },
  light: {
    roughness: 0.9,
    clearcoat: 0.0,
    metalness: 0.0,
    bloom: false,
    edgeOpacity: 0.7,
  },
} as const;

/**
 * Eases a THREE.Color towards a target color using maath dampC over ~0.45 seconds.
 */
export function easeColor(
  current: THREE.Color,
  target: THREE.Color,
  delta: number,
  smoothTime = 0.45,
): void {
  dampC(current, target, smoothTime, delta);
}

/**
 * Eases a material's color toward a target color each frame.
 */
export function easeMaterialColor(
  material: THREE.Material | null | undefined,
  target: THREE.Color,
  delta: number,
  smoothTime = 0.45,
): void {
  if (material && "color" in material && material.color instanceof THREE.Color) {
    dampC(material.color, target, smoothTime, delta);
  }
}
