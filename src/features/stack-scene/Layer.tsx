"use client";

import { Edges, Instance, Instances, Line, RoundedBox, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { damp, dampC } from "maath/easing";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Cluster } from "./Cluster";
import type { LayerSpec } from "./layers";
import { MOOD_MATERIALS } from "./materials";
import { local } from "./phases";
import type { ThemeColors, ThemeMood } from "./useThemeColors";

export interface LayerProps {
  spec: LayerSpec;
  progressRef: React.RefObject<number>;
  tier: "high" | "low";
  colors: ThemeColors;
  mood: ThemeMood;
  yOffset: number;
  isMissing?: boolean;
}

// 8 API octahedron node coordinates on the 3.2 x 3.2 slab
const API_NODES: readonly [number, number][] = [
  [-1.0, -0.9],
  [-0.3, -1.0],
  [0.5, -0.8],
  [1.1, -0.4],
  [0.8, 0.4],
  [0.2, 0.9],
  [-0.6, 0.8],
  [-1.1, 0.1],
] as const;

// Connected route lines between API nodes
const API_ROUTE_SEGMENTS: readonly [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 0],
  [1, 6],
  [2, 5],
] as const;

export function Layer({
  spec,
  progressRef,
  tier,
  colors,
  mood,
  yOffset,
  isMissing = false,
}: LayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const slabMeshRef = useRef<THREE.Mesh>(null);
  const slabMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const labelGroupRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Smoothed animation values
  const animState = useRef({
    scaleY: 0.001,
    opacity: 0,
    labelOpacity: 0,
    edgeOpacity: 1,
  });

  // Calculate API route line points
  const apiRouteLines = useMemo(() => {
    return API_ROUTE_SEGMENTS.map(([fromIdx, toIdx]) => {
      const from = API_NODES[fromIdx];
      const to = API_NODES[toIdx];
      return [
        [from[0], 0.08, from[1]],
        [to[0], 0.08, to[1]],
      ] as [[number, number, number], [number, number, number]];
    });
  }, []);

  useFrame((_state, delta) => {
    const p = progressRef.current ?? 0;

    // Damp Y position of layer group
    if (groupRef.current) {
      damp(groupRef.current.position, "y", yOffset, 0.2, delta);
    }

    if (isMissing) {
      return;
    }

    // Phase 1: DRAW (0..0.14) -> Phase 2: BUILD (0.14..0.32)
    // In DRAW: outline only, scaleY ~ 0.001, opacity ~ 0
    // In BUILD: solids extrude top to bottom
    const layerStart = 0.14 + (spec.order / 4) * 0.12;
    const layerEnd = layerStart + 0.08;
    const extrudeT = local(p, layerStart, layerEnd);

    const targetScaleY = p < 0.14 ? 0.001 : THREE.MathUtils.lerp(0.001, 1.0, extrudeT);
    const targetSolidOpacity = p < 0.14 ? 0 : THREE.MathUtils.lerp(0, 1.0, extrudeT);

    // Labels fade in during EXPLODE (0.32..0.50) top to bottom
    const labelStart = 0.32 + (spec.order / 4) * 0.14;
    const isLabelRevealed = p >= labelStart;
    const targetLabelOpacity = isHovered ? 1.0 : isLabelRevealed ? 1.0 : 0.0;

    damp(animState.current, "scaleY", targetScaleY, 0.16, delta);
    damp(animState.current, "opacity", targetSolidOpacity, 0.16, delta);
    damp(animState.current, "labelOpacity", targetLabelOpacity, 0.16, delta);

    if (slabMeshRef.current) {
      slabMeshRef.current.scale.y = animState.current.scaleY;
    }

    if (slabMatRef.current) {
      slabMatRef.current.opacity = animState.current.opacity;
      slabMatRef.current.transparent = animState.current.opacity < 0.999;
      dampC(slabMatRef.current.color, colors.surface, 0.2, delta);
    }

    if (labelGroupRef.current) {
      const lOpacity = animState.current.labelOpacity;
      labelGroupRef.current.visible = lOpacity > 0.01;
    }
  });

  // Handle pointer interactions
  const handlePointerOver = () => {
    if (typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches) {
      setIsHovered(true);
    }
  };

  const handlePointerOut = () => {
    if (typeof window !== "undefined") {
      setIsHovered(false);
    }
  };

  // Missing layer in 404 variant: dashed outline
  if (isMissing) {
    const half = 1.6;
    return (
      <group ref={groupRef} position={[0, yOffset, 0]}>
        <Line
          points={[
            [-half, 0, -half],
            [half, 0, -half],
            [half, 0, half],
            [-half, 0, half],
            [-half, 0, -half],
          ]}
          color={colors.lineStrong}
          dashed
          dashScale={8}
          dashSize={0.2}
          gapSize={0.12}
          lineWidth={1.5}
        />
        {/* Label and leader for 404 missing layer */}
        <group position={[1.6, 0, 0]}>
          <Line
            points={[
              [0.05, 0, 0],
              [0.6, 0, 0],
            ]}
            color={colors.muted}
            lineWidth={1}
            dashed
            dashScale={10}
            dashSize={0.1}
            gapSize={0.08}
          />
          <Text
            position={[0.7, 0, 0]}
            fontSize={0.13}
            color={colors.accent}
            anchorX="left"
            anchorY="middle"
            letterSpacing={0.04}
          >
            {`${spec.name} · [MISSING]`}
          </Text>
        </group>
      </group>
    );
  }

  const moodParams = MOOD_MATERIALS[mood];

  return (
    <group ref={groupRef} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
      {/* Base Solid Slab: 3.2 x 0.12 x 3.2 */}
      <RoundedBox ref={slabMeshRef} args={[3.2, 0.12, 3.2]} radius={0.04} smoothness={4}>
        <meshPhysicalMaterial
          ref={slabMatRef}
          color={colors.surface}
          roughness={moodParams.roughness}
          clearcoat={moodParams.clearcoat}
          metalness={moodParams.metalness}
          transparent
          opacity={0}
        />
        <Edges
          threshold={15}
          color={isHovered ? colors.accent : mood === "light" ? colors.text : colors.lineStrong}
          lineWidth={1}
        />
      </RoundedBox>

      {/* Layer Label with Leader Line extending to the right */}
      <group ref={labelGroupRef} position={[1.6, 0, 0]}>
        <Line
          points={[
            [0.05, 0, 0],
            [0.65, 0, 0],
          ]}
          color={isHovered ? colors.accent : colors.muted}
          lineWidth={1}
        />
        {/* Tiny origin dot */}
        <mesh position={[0.05, 0, 0]}>
          <sphereGeometry args={[0.024, 8, 8]} />
          <meshBasicMaterial color={isHovered ? colors.accent : colors.muted} />
        </mesh>
        <Text
          position={[0.75, 0, 0]}
          fontSize={0.13}
          color={isHovered ? colors.accentStrong : colors.text}
          anchorX="left"
          anchorY="middle"
          letterSpacing={0.04}
        >
          {spec.label}
        </Text>
      </group>

      {/* Objects on INTERFACE: 6 card panels in grid + 1 phone panel via Instances */}
      {spec.id === "interface" && (
        <group position={[0, 0.06, 0]}>
          <Instances limit={10} range={7}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color={colors.lineStrong}
              roughness={0.4}
              metalness={0.1}
              transparent
              opacity={animState.current.opacity}
            />
            {/* 6 card panels in a 2x3 grid */}
            <Instance
              position={[-0.8, 0.015, -0.75]}
              scale={[0.65, 0.02 * animState.current.scaleY, 0.45]}
            />
            <Instance
              position={[-0.8, 0.015, 0]}
              scale={[0.65, 0.02 * animState.current.scaleY, 0.45]}
            />
            <Instance
              position={[-0.8, 0.015, 0.75]}
              scale={[0.65, 0.02 * animState.current.scaleY, 0.45]}
            />
            <Instance
              position={[0.0, 0.015, -0.75]}
              scale={[0.65, 0.02 * animState.current.scaleY, 0.45]}
            />
            <Instance
              position={[0.0, 0.015, 0]}
              scale={[0.65, 0.02 * animState.current.scaleY, 0.45]}
            />
            <Instance
              position={[0.0, 0.015, 0.75]}
              scale={[0.65, 0.02 * animState.current.scaleY, 0.45]}
            />
            {/* 1 phone-shaped panel */}
            <Instance
              position={[0.85, 0.02, 0]}
              scale={[0.48, 0.03 * animState.current.scaleY, 0.95]}
            />
          </Instances>
        </group>
      )}

      {/* Objects on API: 8 octahedron route nodes + thin route lines */}
      {spec.id === "api" && (
        <group position={[0, 0.06, 0]}>
          {/* Route network lines */}
          {apiRouteLines.map((pts, i) => (
            <Line
              key={`api-line-${API_ROUTE_SEGMENTS[i][0]}-${API_ROUTE_SEGMENTS[i][1]}`}
              points={pts}
              color={colors.lineStrong}
              lineWidth={1}
              transparent
              opacity={animState.current.opacity * 0.7}
            />
          ))}

          {/* 8 Octahedron nodes */}
          {API_NODES.map((pos) => (
            <mesh
              key={`api-node-${pos[0]}-${pos[1]}`}
              position={[pos[0], 0.12 * animState.current.scaleY, pos[1]]}
              scale={[animState.current.scaleY, animState.current.scaleY, animState.current.scaleY]}
            >
              <octahedronGeometry args={[0.13, 0]} />
              <meshStandardMaterial
                color={colors.lineStrong}
                emissive={colors.accent}
                emissiveIntensity={0.2}
                roughness={0.3}
                metalness={0.3}
                transparent
                opacity={animState.current.opacity}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* Objects on DATA: 3 cylinders (primary + 2 replicas) + 1 cache cube */}
      {spec.id === "data" && (
        <group position={[0, 0.06, 0]}>
          {/* Connecting line between primary and replicas */}
          <Line
            points={[
              [-0.8, 0.05, -0.4],
              [0.0, 0.05, 0.5],
              [0.8, 0.05, -0.4],
            ]}
            color={colors.lineStrong}
            lineWidth={1}
            transparent
            opacity={animState.current.opacity * 0.7}
          />

          {/* Primary database cylinder */}
          <mesh
            position={[0, 0.18 * animState.current.scaleY, 0.5]}
            scale={[1, animState.current.scaleY, 1]}
          >
            <cylinderGeometry args={[0.26, 0.26, 0.32, 24]} />
            <meshStandardMaterial
              color={colors.lineStrong}
              roughness={0.3}
              metalness={0.4}
              transparent
              opacity={animState.current.opacity}
            />
          </mesh>

          {/* Replica 1 cylinder */}
          <mesh
            position={[-0.8, 0.14 * animState.current.scaleY, -0.4]}
            scale={[1, animState.current.scaleY, 1]}
          >
            <cylinderGeometry args={[0.21, 0.21, 0.26, 24]} />
            <meshStandardMaterial
              color={colors.lineStrong}
              roughness={0.3}
              metalness={0.3}
              transparent
              opacity={animState.current.opacity}
            />
          </mesh>

          {/* Replica 2 cylinder */}
          <mesh
            position={[0.8, 0.14 * animState.current.scaleY, -0.4]}
            scale={[1, animState.current.scaleY, 1]}
          >
            <cylinderGeometry args={[0.21, 0.21, 0.26, 24]} />
            <meshStandardMaterial
              color={colors.lineStrong}
              roughness={0.3}
              metalness={0.3}
              transparent
              opacity={animState.current.opacity}
            />
          </mesh>

          {/* Cache cube */}
          <mesh
            position={[-0.1, 0.12 * animState.current.scaleY, -0.7]}
            scale={[1, animState.current.scaleY, 1]}
          >
            <boxGeometry args={[0.24, 0.24, 0.24]} />
            <meshStandardMaterial
              color={colors.lineStrong}
              emissive={colors.accent}
              emissiveIntensity={0.2}
              roughness={0.3}
              metalness={0.2}
              transparent
              opacity={animState.current.opacity}
            />
          </mesh>
        </group>
      )}

      {/* Objects on INFRA: renders Cluster component */}
      {spec.id === "infra" && (
        <group position={[0, 0.06, 0]}>
          <Cluster
            progressRef={progressRef}
            tier={tier}
            colors={colors}
            mood={mood}
            solidsOpacity={animState.current.opacity}
            solidsScaleY={animState.current.scaleY}
          />
        </group>
      )}
    </group>
  );
}
