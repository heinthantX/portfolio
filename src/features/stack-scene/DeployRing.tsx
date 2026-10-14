"use client";

import { useFrame } from "@react-three/fiber";
import { damp, damp3 } from "maath/easing";
import { useRef } from "react";
import type * as THREE from "three";
import type { ThemeColors, ThemeMood } from "./useThemeColors";

export interface DeployRingProps {
  progressRef: React.RefObject<number>;
  colors: ThemeColors;
  mood: ThemeMood;
  baseY: number;
}

export function DeployRing({ progressRef, colors, mood, baseY }: DeployRingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const animRef = useRef({ opacity: 0 });

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;

    const p = progressRef.current ?? 0;

    if (p >= 0.86) {
      // Pulse once upon entering DEPLOYED (0.86..1.0)
      const depT = (p - 0.86) / 0.14;
      const pulseT = Math.min(1, depT * 2);
      const ringScale = 1.0 + 0.26 * Math.sin(pulseT * Math.PI);
      const targetOpacity = Math.sin(pulseT * Math.PI) * 0.85 + 0.15;

      damp3(mesh.scale, [ringScale, ringScale, ringScale], 0.16, delta);
      damp(animRef.current, "opacity", targetOpacity, 0.16, delta);
      mesh.position.y = baseY - 0.06;
    } else {
      damp3(mesh.scale, [1, 1, 1], 0.15, delta);
      damp(animRef.current, "opacity", 0, 0.15, delta);
    }

    mat.opacity = animRef.current.opacity;
    mat.transparent = true;
    mesh.visible = animRef.current.opacity > 0.01;
  });

  return (
    <mesh
      ref={meshRef}
      position={[0, baseY - 0.06, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      visible={false}
    >
      <torusGeometry args={[2.2, 0.024, 16, 96]} />
      <meshStandardMaterial
        ref={matRef}
        color={colors.ok}
        emissive={colors.ok}
        emissiveIntensity={mood === "dark" ? 2.5 : 0}
        roughness={0.2}
        metalness={0.1}
        transparent
        opacity={0}
        depthWrite={false}
      />
    </mesh>
  );
}
