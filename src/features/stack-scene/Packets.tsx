"use client";

import { useFrame } from "@react-three/fiber";
import { damp } from "maath/easing";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { TIER_CONFIG } from "./layers";
import type { ThemeColors, ThemeMood } from "./useThemeColors";

export interface PacketsProps {
  progressRef: React.RefObject<number>;
  tier: "high" | "low";
  colors: ThemeColors;
  mood: ThemeMood;
  slabYOffsets: readonly number[];
}

export function Packets({ progressRef, tier, colors, mood, slabYOffsets }: PacketsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const animScaleRef = useRef({ scale: 0 });

  const packetCount = TIER_CONFIG[tier].packets;

  // Reusable CatmullRom curves updated each frame to match dynamic exploded slab positions
  const downCurve = useMemo(() => new THREE.CatmullRomCurve3(), []);
  const upCurve = useMemo(() => new THREE.CatmullRomCurve3(), []);
  const targetPoint = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const p = progressRef.current ?? 0;

    // Visible only in RUN (0.50..0.68) plus burst in SCALE (0.68..0.86)
    const isInPacketWindow = p >= 0.48 && p <= 0.86;
    const targetScale = isInPacketWindow ? 1.0 : 0.0;
    damp(animScaleRef.current, "scale", targetScale, 0.15, delta);
    const scale = animScaleRef.current.scale;

    if (scale <= 0.001) {
      for (let i = 0; i < packetCount; i++) {
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      return;
    }

    const yInterface = slabYOffsets[0] ?? 1.95;
    const yApi = slabYOffsets[1] ?? 0.65;
    const yData = slabYOffsets[2] ?? -0.65;

    // Configure downward curve (Interface -> API -> Data)
    downCurve.points = [
      new THREE.Vector3(0.7, yInterface + 0.1, 0.5),
      new THREE.Vector3(0.9, (yInterface + yApi) / 2, 0.2),
      new THREE.Vector3(0.3, yApi + 0.1, -0.2),
      new THREE.Vector3(-0.3, (yApi + yData) / 2, 0.3),
      new THREE.Vector3(0.0, yData + 0.1, 0.4),
    ];
    downCurve.updateArcLengths();

    // Configure upward curve (Data -> API -> Interface)
    upCurve.points = [
      new THREE.Vector3(-0.5, yData + 0.1, -0.4),
      new THREE.Vector3(-0.8, (yData + yApi) / 2, -0.1),
      new THREE.Vector3(-0.4, yApi + 0.1, 0.3),
      new THREE.Vector3(0.2, (yApi + yInterface) / 2, -0.4),
      new THREE.Vector3(-0.6, yInterface + 0.1, -0.5),
    ];
    upCurve.updateArcLengths();

    const elapsed = state.clock.getElapsedTime();
    // Burst speed multiplier during SCALE
    const isBurst = p >= 0.68 && p <= 0.86;
    const speed = isBurst ? 0.9 : 0.45;
    const scrubOffset = (p - 0.5) * 3.5;

    const halfCount = Math.floor(packetCount / 2);

    for (let i = 0; i < packetCount; i++) {
      if (i < halfCount) {
        // Downward travel
        const offset = i / halfCount;
        const t = (((elapsed * speed + scrubOffset + offset) % 1.0) + 1.0) % 1.0;
        downCurve.getPointAt(t, targetPoint);
      } else {
        // Upward travel
        const offset = (i - halfCount) / (packetCount - halfCount);
        const t = (((elapsed * speed + scrubOffset + offset) % 1.0) + 1.0) % 1.0;
        upCurve.getPointAt(t, targetPoint);
      }

      dummy.position.copy(targetPoint);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, packetCount]} frustumCulled={false}>
      <sphereGeometry args={[0.055, 16, 16]} />
      {mood === "dark" ? (
        <meshStandardMaterial
          color={colors.accent}
          emissive={colors.accent}
          emissiveIntensity={3.0}
          roughness={0.2}
          metalness={0.2}
        />
      ) : (
        <meshBasicMaterial color={colors.accentStrong} />
      )}
    </instancedMesh>
  );
}
