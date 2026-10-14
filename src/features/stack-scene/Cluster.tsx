"use client";

import { Edges, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { damp, damp3, dampC } from "maath/easing";
import { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { TIER_CONFIG } from "./layers";
import { isNodeKilled, NODE_LAYOUTS, POD_SLOT_OFFSETS, schedule } from "./scheduler";
import type { ThemeColors, ThemeMood } from "./useThemeColors";

export interface ClusterProps {
  progressRef: React.RefObject<number>;
  tier: "high" | "low";
  colors: ThemeColors;
  mood: ThemeMood;
  solidsOpacity?: number;
  solidsScaleY?: number;
}

interface NodePlateProps {
  id: number;
  x: number;
  z: number;
  isKilled: boolean;
  colors: ThemeColors;
  solidsOpacity: number;
  solidsScaleY: number;
  onToggleKill: (id: number) => void;
}

function NodePlate({
  id,
  x,
  z,
  isKilled,
  colors,
  solidsOpacity,
  solidsScaleY,
  onToggleKill,
}: NodePlateProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const targetColor = useMemo(() => new THREE.Color(), []);

  useFrame((_, delta) => {
    if (!matRef.current) return;
    if (isKilled) {
      targetColor.copy(colors.bg).lerp(colors.surface, 0.3);
    } else {
      targetColor.copy(colors.surface);
    }
    dampC(matRef.current.color, targetColor, 0.15, delta);
  });

  return (
    <group position={[x, 0.02 * solidsScaleY, z]} scale={[1, solidsScaleY, 1]}>
      <RoundedBox
        ref={meshRef}
        args={[0.56, 0.04, 0.68]}
        radius={0.012}
        smoothness={4}
        onClick={(e) => {
          e.stopPropagation();
          onToggleKill(id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches) {
            document.body.style.cursor = "pointer";
          }
        }}
        onPointerOut={() => {
          if (typeof window !== "undefined") {
            document.body.style.cursor = "auto";
          }
        }}
      >
        <meshStandardMaterial
          ref={matRef}
          color={colors.surface}
          roughness={0.4}
          metalness={0.1}
          transparent={solidsOpacity < 0.99}
          opacity={isKilled ? solidsOpacity * 0.4 : solidsOpacity}
        />
        <Edges color={isKilled ? colors.line : colors.lineStrong} threshold={15} />
      </RoundedBox>
    </group>
  );
}

export function Cluster({
  progressRef,
  tier,
  colors,
  mood,
  solidsOpacity = 1,
  solidsScaleY = 1,
}: ClusterProps) {
  const killedNodesRef = useRef<Set<number>>(new Set());
  const maxPods = TIER_CONFIG[tier].maxPods;

  const podsMeshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const podStates = useMemo(() => {
    return Array.from({ length: 24 }, () => ({
      pos: new THREE.Vector3(0, -5, 0),
      scale: 0,
      color: new THREE.Color(),
    }));
  }, []);

  const handleToggleKill = useCallback((id: number) => {
    if (typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches) {
      if (killedNodesRef.current.has(id)) {
        killedNodesRef.current.delete(id);
      } else {
        killedNodesRef.current.add(id);
      }
    }
  }, []);

  useEffect(() => {
    if (!podsMeshRef.current) return;
    const initialColor = mood === "dark" ? colors.accent : colors.accentStrong;
    for (let i = 0; i < maxPods; i++) {
      podsMeshRef.current.setColorAt(i, initialColor);
    }
    if (podsMeshRef.current.instanceColor) {
      podsMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, [maxPods, mood, colors]);

  useFrame((_, delta) => {
    const mesh = podsMeshRef.current;
    if (!mesh) return;

    const progress = progressRef.current ?? 0;
    const targets = schedule(progress, maxPods, killedNodesRef.current);

    const isDeployed = progress >= 0.86;
    const baseColor = isDeployed
      ? colors.ok
      : mood === "dark"
        ? colors.accent
        : colors.accentStrong;

    for (let i = 0; i < maxPods; i++) {
      const target = targets[i];
      const state = podStates[i];

      const nodeLayout = NODE_LAYOUTS[target.node];
      const slotOffset = POD_SLOT_OFFSETS[target.slot];

      const targetX = nodeLayout.x + slotOffset[0];
      const targetY = (0.02 + slotOffset[1]) * solidsScaleY;
      const targetZ = nodeLayout.z + slotOffset[2];

      const targetScale = target.scale * solidsScaleY;

      damp3(state.pos, [targetX, targetY, targetZ], 0.14, delta);
      damp(state, "scale", targetScale, 0.14, delta);
      dampC(state.color, baseColor, 0.2, delta);

      dummy.position.copy(state.pos);
      const effectiveScale = Math.max(0.0001, state.scale);
      dummy.scale.set(effectiveScale, effectiveScale, effectiveScale);
      dummy.updateMatrix();

      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, state.color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group>
      {NODE_LAYOUTS.map((layout) => {
        const p = progressRef.current ?? 0;
        const killed = isNodeKilled(layout.id, p, killedNodesRef.current);
        return (
          <NodePlate
            key={`node-plate-${layout.id}`}
            id={layout.id}
            x={layout.x}
            z={layout.z}
            isKilled={killed}
            colors={colors}
            solidsOpacity={solidsOpacity}
            solidsScaleY={solidsScaleY}
            onToggleKill={handleToggleKill}
          />
        );
      })}

      <instancedMesh ref={podsMeshRef} args={[undefined, undefined, maxPods]} frustumCulled={false}>
        <boxGeometry args={[0.18, 0.16, 0.18]} />
        <meshStandardMaterial
          roughness={mood === "dark" ? 0.3 : 0.8}
          metalness={mood === "dark" ? 0.2 : 0}
          transparent={solidsOpacity < 0.99}
          opacity={solidsOpacity}
        />
      </instancedMesh>
    </group>
  );
}
