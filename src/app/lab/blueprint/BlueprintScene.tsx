"use client";

import { Billboard, Edges, Line, RoundedBox, Text } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { damp, damp3, dampC } from "maath/easing";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface SlabSpec {
  name: string;
  sublabel: string;
  order: number;
  explodeThreshold: number;
}

const SLABS: readonly SlabSpec[] = [
  { name: "INTERFACE", sublabel: "CLIENT APP", order: 0, explodeThreshold: 0.37 },
  { name: "API", sublabel: "GATEWAY ROUTER", order: 1, explodeThreshold: 0.41 },
  { name: "DATA", sublabel: "PERSISTENT STORE", order: 2, explodeThreshold: 0.45 },
  { name: "INFRA", sublabel: "CONTAINER CLUSTER", order: 3, explodeThreshold: 0.49 },
] as const;

// 12 container cube positions on the 4x4 INFRA slab surface
const CONTAINER_POSITIONS: readonly [number, number][] = [
  // First 3 seed cubes
  [-0.4, 0.0],
  [0.4, 0.0],
  [0.0, -0.8],
  // 9 scaling pop-in cubes
  [-1.2, 0.0],
  [1.2, 0.0],
  [-0.4, -0.8],
  [0.4, -0.8],
  [-1.2, -0.8],
  [1.2, -0.8],
  [-1.2, 0.8],
  [-0.4, 0.8],
  [0.4, 0.8],
] as const;

// Conduit rails for amber spheres (30 points along downward and upward curves)
function generateConduitPoints(direction: "down" | "up"): [number, number, number][] {
  const points: [number, number, number][] = [];
  const steps = 30;
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    if (direction === "down") {
      const y = (1 - u) * (1 - u) * 2.1 + 2 * (1 - u) * u * 0.7 + u * u * -0.7;
      const x = 0.8 + 0.45 * Math.sin(Math.PI * u);
      const z = 0.7 * Math.cos(Math.PI * u) - 0.2;
      points.push([x, y, z]);
    } else {
      const y = (1 - u) * (1 - u) * -0.7 + 2 * (1 - u) * u * 0.7 + u * u * 2.1;
      const x = -0.8 - 0.45 * Math.sin(Math.PI * u);
      const z = -0.7 * Math.cos(Math.PI * u) + 0.2;
      points.push([x, y, z]);
    }
  }
  return points;
}

const DOWN_RAIL = generateConduitPoints("down");
const UP_RAIL = generateConduitPoints("up");

interface SceneContentProps {
  progressRef: React.RefObject<number>;
}

function SceneContent({ progressRef }: SceneContentProps) {
  const mainGroupRef = useRef<THREE.Group>(null);
  const idleAngleRef = useRef(0);
  const gapAnimRef = useRef({ val: 0.28 });
  const solidsAnimRef = useRef({ scaleY: 0.001, opacity: 0 });
  const dimAnimRef = useRef({ opacity: 1 });
  const railAnimRef = useRef({ opacity: 0 });
  const packetsAnimRef = useRef({ scale: 0 });

  // Reusable vectors for performance
  const tempDummy = useMemo(() => new THREE.Object3D(), []);
  const tempLookAt = useMemo(() => new THREE.Vector3(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  // Per-slab references
  const slabGroupsRef = useRef<(THREE.Group | null)[]>([]);
  const slabMeshesRef = useRef<(THREE.Mesh | null)[]>([]);
  const slabMaterialsRef = useRef<(THREE.MeshPhysicalMaterial | null)[]>([]);
  const slabEdgesRef = useRef<(THREE.Mesh | null)[]>([]);
  const labelGroupsRef = useRef<(THREE.Group | null)[]>([]);
  const labelAnimRef = useRef([{ val: 0 }, { val: 0 }, { val: 0 }, { val: 0 }]);

  // Instanced meshes references
  const packetsMeshRef = useRef<THREE.InstancedMesh>(null);
  const containersMeshRef = useRef<THREE.InstancedMesh>(null);
  const containerCubeScalesRef = useRef<{ s: number }[]>(
    Array.from({ length: 12 }, () => ({ s: 0 })),
  );

  // Deployed pulsing ring reference
  const greenRingRef = useRef<THREE.Mesh>(null);
  const ringMaterialRef = useRef<THREE.MeshStandardMaterial>(null);

  // Dimension lines group
  const dimGroupRef = useRef<THREE.Group>(null);

  // Conduits lines group
  const conduitLinesRef = useRef<THREE.Group>(null);

  // Faint dot grid points buffer
  const dotGridPositions = useMemo(() => {
    const coords: number[] = [];
    const span = 6.5;
    const step = 0.5;
    for (let x = -span; x <= span; x += step) {
      for (let z = -span; z <= span; z += step) {
        coords.push(x, 0, z);
      }
    }
    return new Float32Array(coords);
  }, []);

  useFrame((state, delta) => {
    const progress = progressRef.current ?? 0;

    // -----------------------------------------------------------
    // Camera easing: top-front (ortho-like) -> 3/4 perspective
    // 0 - 0.15: Top-front camera [0, 11, 3.8]
    // 0.15 - 0.35: Eases to 3/4 perspective [6.2, 5.2, 6.8]
    // -----------------------------------------------------------
    const camT = THREE.MathUtils.clamp((progress - 0.15) / 0.2, 0, 1);
    const camEase = THREE.MathUtils.smoothstep(camT, 0, 1);
    const targetCamX = THREE.MathUtils.lerp(0, 6.2, camEase);
    const targetCamY = THREE.MathUtils.lerp(11, 5.2, camEase);
    const targetCamZ = THREE.MathUtils.lerp(3.8, 6.8, camEase);

    damp3(state.camera.position, [targetCamX, targetCamY, targetCamZ], 0.22, delta);
    const targetLookX = THREE.MathUtils.lerp(0, 0.35, camEase);
    tempLookAt.set(targetLookX, 0, 0);
    state.camera.lookAt(tempLookAt);

    // -----------------------------------------------------------
    // Slow idle rotation of the group (~0.05 rad/s)
    // Seamlessly aligns to 0 in DRAWING phase (progress <= 0.15)
    // -----------------------------------------------------------
    if (mainGroupRef.current) {
      if (progress > 0.15) {
        idleAngleRef.current += 0.05 * delta;
        damp(mainGroupRef.current.rotation, "y", idleAngleRef.current, 0.25, delta);
      } else {
        damp(mainGroupRef.current.rotation, "y", 0, 0.25, delta);
      }
    }

    // -----------------------------------------------------------
    // Phase 1: DRAWING -> Phase 2: EXTRUDE (0.15 - 0.35)
    // Solids scale.y from 0 to 1, opacity from 0 to 1
    // Edges stay visible; dimension lines dissolve
    // -----------------------------------------------------------
    const extrudeT = THREE.MathUtils.clamp((progress - 0.15) / 0.2, 0, 1);
    const targetScaleY = progress <= 0.15 ? 0.001 : THREE.MathUtils.lerp(0.001, 1.0, extrudeT);
    const targetSolidOpacity = progress <= 0.15 ? 0 : THREE.MathUtils.lerp(0, 1.0, extrudeT);
    const targetDimOpacity = progress <= 0.15 ? 1 : THREE.MathUtils.lerp(1, 0, extrudeT * 2);

    damp(solidsAnimRef.current, "scaleY", targetScaleY, 0.16, delta);
    damp(solidsAnimRef.current, "opacity", targetSolidOpacity, 0.16, delta);
    damp(dimAnimRef.current, "opacity", targetDimOpacity, 0.16, delta);

    if (dimGroupRef.current) {
      dimGroupRef.current.visible = dimAnimRef.current.opacity > 0.005;
      const s = THREE.MathUtils.clamp(dimAnimRef.current.opacity, 0.001, 1);
      dimGroupRef.current.scale.set(1, s, 1);
    }

    // Hairline edge color: #8B95A3 in DRAWING, eases to #3A4350 in EXTRUDE and beyond
    const targetEdgeHex = progress < 0.18 ? "#8B95A3" : "#3A4350";
    tempColor.set(targetEdgeHex);

    // -----------------------------------------------------------
    // Phase 3: EXPLODE (0.35 - 0.55) & Phase 6: DEPLOYED (0.9 - 1.0)
    // Slabs separate vertically to gap ~1.4 units;
    // in DEPLOYED slabs close together (gap -> 0.48)
    // -----------------------------------------------------------
    let targetGap = 0.28;
    if (progress >= 0.35 && progress < 0.55) {
      const explodeT = (progress - 0.35) / 0.2;
      targetGap = THREE.MathUtils.lerp(0.28, 1.4, THREE.MathUtils.smoothstep(explodeT, 0, 1));
    } else if (progress >= 0.55 && progress < 0.9) {
      targetGap = 1.4;
    } else if (progress >= 0.9) {
      const depT = (progress - 0.9) / 0.1;
      targetGap = THREE.MathUtils.lerp(1.4, 0.48, THREE.MathUtils.smoothstep(depT, 0, 1));
    }

    damp(gapAnimRef.current, "val", targetGap, 0.2, delta);
    const curGap = gapAnimRef.current.val;

    // Slab Y offsets from top to bottom
    const slabYOffsets = [curGap * 1.5, curGap * 0.5, -curGap * 0.5, -curGap * 1.5];

    for (let i = 0; i < 4; i++) {
      const slabGroup = slabGroupsRef.current[i];
      if (slabGroup) {
        damp(slabGroup.position, "y", slabYOffsets[i], 0.2, delta);
      }

      const slabMesh = slabMeshesRef.current[i];
      if (slabMesh) {
        slabMesh.scale.y = solidsAnimRef.current.scaleY;
      }

      const slabMat = slabMaterialsRef.current[i];
      if (slabMat) {
        slabMat.opacity = solidsAnimRef.current.opacity;
        slabMat.transparent = solidsAnimRef.current.opacity < 0.999;
      }

      const edgesMesh = slabEdgesRef.current[i];
      if (edgesMesh) {
        const mat = edgesMesh.material;
        if (mat && "color" in mat && mat.color instanceof THREE.Color) {
          dampC(mat.color, tempColor, 0.2, delta);
        }
      }

      // Labels and leader lines: fade in in order during EXPLODE
      const labelGroup = labelGroupsRef.current[i];
      if (labelGroup) {
        const threshold = SLABS[i].explodeThreshold;
        const isLabelActive = progress >= threshold && progress < 0.9;
        const targetLabelVal = isLabelActive ? 1 : 0;
        damp(labelAnimRef.current[i], "val", targetLabelVal, 0.15, delta);
        const lVal = labelAnimRef.current[i].val;
        labelGroup.scale.set(lVal, lVal, lVal);
        labelGroup.visible = lVal > 0.01;
      }
    }

    // -----------------------------------------------------------
    // Phase 4: RUN (0.55 - 0.75)
    // 24 amber spheres traveling along curves from INTERFACE to DATA and back
    // Positions derived from time + progress
    // -----------------------------------------------------------
    const inRunPhase = progress >= 0.53 && progress <= 0.77;
    const targetPacketsScale = inRunPhase ? 1.0 : 0.0;
    damp(packetsAnimRef.current, "scale", targetPacketsScale, 0.15, delta);
    const pScale = packetsAnimRef.current.scale;

    const targetRailOpacity = inRunPhase ? 0.65 : 0.0;
    damp(railAnimRef.current, "opacity", targetRailOpacity, 0.18, delta);
    if (conduitLinesRef.current) {
      conduitLinesRef.current.visible = railAnimRef.current.opacity > 0.01;
    }

    if (packetsMeshRef.current) {
      const topY = slabYOffsets[0];
      const midY = slabYOffsets[1];
      const botY = slabYOffsets[2];
      const elapsed = state.clock.getElapsedTime();
      const scrubOffset = (progress - 0.55) * 4.5;

      for (let k = 0; k < 24; k++) {
        if (pScale > 0.001) {
          if (k < 12) {
            // Downward conduit (INTERFACE -> API -> DATA)
            const rawT = (elapsed * 0.4 + scrubOffset + k / 12) % 1;
            const u = ((rawT % 1) + 1) % 1;
            const y = (1 - u) * (1 - u) * topY + 2 * (1 - u) * u * midY + u * u * botY;
            const x = 0.8 + 0.45 * Math.sin(Math.PI * u);
            const z = 0.7 * Math.cos(Math.PI * u) - 0.2;

            tempDummy.position.set(x, y, z);
            tempDummy.scale.setScalar(pScale);
            tempDummy.updateMatrix();
            packetsMeshRef.current.setMatrixAt(k, tempDummy.matrix);
          } else {
            // Upward conduit (DATA -> API -> INTERFACE)
            const rawT = (elapsed * 0.4 + scrubOffset + (k - 12) / 12) % 1;
            const u = ((rawT % 1) + 1) % 1;
            const y = (1 - u) * (1 - u) * botY + 2 * (1 - u) * u * midY + u * u * topY;
            const x = -0.8 - 0.45 * Math.sin(Math.PI * u);
            const z = -0.7 * Math.cos(Math.PI * u) + 0.2;

            tempDummy.position.set(x, y, z);
            tempDummy.scale.setScalar(pScale);
            tempDummy.updateMatrix();
            packetsMeshRef.current.setMatrixAt(k, tempDummy.matrix);
          }
        } else {
          tempDummy.scale.set(0, 0, 0);
          tempDummy.updateMatrix();
          packetsMeshRef.current.setMatrixAt(k, tempDummy.matrix);
        }
      }
      packetsMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // -----------------------------------------------------------
    // Phase 5: SCALE (0.75 - 0.9)
    // INFRA slab carries container cubes (instanced); count 3 -> 12
    // with staggered pop-in
    // -----------------------------------------------------------
    if (containersMeshRef.current) {
      const infraY = slabYOffsets[3];
      for (let k = 0; k < 12; k++) {
        let targetCScale = 0;
        if (progress >= 0.73) {
          if (k < 3) {
            targetCScale = 1.0;
          } else {
            const threshold = 0.75 + (k - 2) * (0.13 / 9);
            targetCScale = progress >= threshold ? 1.0 : 0.0;
          }
        }
        damp(containerCubeScalesRef.current[k], "s", targetCScale, 0.12, delta);
        const s = containerCubeScalesRef.current[k].s;

        if (s > 0.001) {
          const posX = CONTAINER_POSITIONS[k][0];
          const posZ = CONTAINER_POSITIONS[k][1];
          const posY = infraY + 0.125 + (s * 0.22) / 2;
          tempDummy.position.set(posX, posY, posZ);
          tempDummy.scale.set(s * 0.32, s * 0.22, s * 0.32);
          tempDummy.updateMatrix();
          containersMeshRef.current.setMatrixAt(k, tempDummy.matrix);
        } else {
          tempDummy.scale.set(0, 0, 0);
          tempDummy.updateMatrix();
          containersMeshRef.current.setMatrixAt(k, tempDummy.matrix);
        }
      }
      containersMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // -----------------------------------------------------------
    // Phase 6: DEPLOYED (0.9 - 1.0)
    // Thin green ring (#4CC38A) pulses once around the base
    // -----------------------------------------------------------
    if (greenRingRef.current && ringMaterialRef.current) {
      if (progress >= 0.9) {
        const depT = (progress - 0.9) / 0.1;
        const ringPulseScale = 1.0 + 0.28 * Math.sin(Math.min(1, depT) * Math.PI);
        const ringPulseOpacity = Math.sin(depT * Math.PI) * 0.85 + 0.3;

        damp3(
          greenRingRef.current.scale,
          [ringPulseScale, ringPulseScale, ringPulseScale],
          0.16,
          delta,
        );
        damp(ringMaterialRef.current, "opacity", ringPulseOpacity, 0.16, delta);
        greenRingRef.current.position.y = slabYOffsets[3] - 0.14;
      } else {
        damp(ringMaterialRef.current, "opacity", 0, 0.15, delta);
        damp3(greenRingRef.current.scale, [1, 1, 1], 0.15, delta);
      }
    }
  });

  return (
    <group ref={mainGroupRef}>
      {/* Faint dot grid plane */}
      <points position={[0, -0.65, 0]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dotGridPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.035} color="#3A4350" transparent opacity={0.4} sizeAttenuation />
      </points>

      {/* DRAWING phase CAD dimension lines and markings */}
      <group ref={dimGroupRef} position={[0, 0, 0]}>
        {/* Width Dimension Line (along X axis at Z = -2.4) */}
        <Line
          points={[
            [-2.0, 0, -2.4],
            [2.0, 0, -2.4],
          ]}
          color="#8B95A3"
          lineWidth={1}
        />
        <Line
          points={[
            [-2.0, 0, -2.3],
            [-2.0, 0, -2.5],
          ]}
          color="#8B95A3"
          lineWidth={1}
        />
        <Line
          points={[
            [2.0, 0, -2.3],
            [2.0, 0, -2.5],
          ]}
          color="#8B95A3"
          lineWidth={1}
        />
        <Text
          position={[0, 0, -2.65]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.16}
          color="#8B95A3"
          anchorX="center"
          anchorY="middle"
        >
          4.00 m
        </Text>

        {/* Depth Dimension Line (along Z axis at X = 2.4) */}
        <Line
          points={[
            [2.4, 0, -2.0],
            [2.4, 0, 2.0],
          ]}
          color="#8B95A3"
          lineWidth={1}
        />
        <Line
          points={[
            [2.3, 0, -2.0],
            [2.5, 0, -2.0],
          ]}
          color="#8B95A3"
          lineWidth={1}
        />
        <Line
          points={[
            [2.3, 0, 2.0],
            [2.5, 0, 2.0],
          ]}
          color="#8B95A3"
          lineWidth={1}
        />
        <Text
          position={[2.65, 0, 0]}
          rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
          fontSize={0.16}
          color="#8B95A3"
          anchorX="center"
          anchorY="middle"
        >
          4.00 m
        </Text>

        {/* Height Dimension Line (along Y axis at corner [-2.4, y, 2.4]) */}
        <Line
          points={[
            [-2.4, -0.125, 2.4],
            [-2.4, 0.125, 2.4],
          ]}
          color="#8B95A3"
          lineWidth={1}
        />
        <Line
          points={[
            [-2.3, -0.125, 2.4],
            [-2.5, -0.125, 2.4],
          ]}
          color="#8B95A3"
          lineWidth={1}
        />
        <Line
          points={[
            [-2.3, 0.125, 2.4],
            [-2.5, 0.125, 2.4],
          ]}
          color="#8B95A3"
          lineWidth={1}
        />
        <Text
          position={[-2.7, 0, 2.4]}
          rotation={[0, 0, 0]}
          fontSize={0.14}
          color="#8B95A3"
          anchorX="right"
          anchorY="middle"
        >
          0.25 m
        </Text>

        {/* Blueprint title block */}
        <Text
          position={[-2.0, 0, -2.65]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.13}
          color="#8B95A3"
          anchorX="left"
          anchorY="middle"
        >
          {"SPEC // STACK_CORE_V1"}
        </Text>
      </group>

      {/* The 4 Slabs */}
      {SLABS.map((slab, i) => (
        <group
          key={slab.name}
          ref={(el) => {
            slabGroupsRef.current[i] = el;
          }}
        >
          {/* Solid slab mesh with hairline edges */}
          <RoundedBox
            ref={(el) => {
              slabMeshesRef.current[i] = el;
            }}
            args={[4, 0.25, 4]}
            radius={0.05}
            smoothness={4}
          >
            <meshPhysicalMaterial
              ref={(el) => {
                slabMaterialsRef.current[i] = el;
              }}
              color="#12161B"
              roughness={0.35}
              clearcoat={0.6}
              transparent
              opacity={0}
            />
            <Edges
              ref={(el) => {
                slabEdgesRef.current[i] = el;
              }}
              threshold={15}
              color="#8B95A3"
              lineWidth={1}
            />
          </RoundedBox>

          {/* Label and leader line to the right of each slab */}
          <group
            ref={(el) => {
              labelGroupsRef.current[i] = el;
            }}
            position={[2.0, 0, 0]}
          >
            {/* Thin leader line extending to label */}
            <Line
              points={[
                [0.05, 0, 0],
                [0.75, 0, 0],
              ]}
              color="#8B95A3"
              lineWidth={1}
            />
            {/* Origin anchor tick */}
            <mesh position={[0.05, 0, 0]}>
              <sphereGeometry args={[0.028, 8, 8]} />
              <meshBasicMaterial color="#8B95A3" />
            </mesh>
            {/* Text label billboarding toward camera */}
            <Billboard position={[0.85, 0, 0]}>
              <Text
                fontSize={0.18}
                color="#E6EAF0"
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.05}
              >
                {slab.name}
              </Text>
              <Text
                fontSize={0.085}
                color="#8B95A3"
                anchorX="left"
                anchorY="top"
                position={[0, -0.14, 0]}
                letterSpacing={0.04}
              >
                {slab.sublabel}
              </Text>
            </Billboard>
          </group>
        </group>
      ))}

      {/* Conduit hairline rails for RUN phase */}
      <group ref={conduitLinesRef}>
        <Line points={DOWN_RAIL} color="#3A4350" lineWidth={1} transparent opacity={0.6} />
        <Line points={UP_RAIL} color="#3A4350" lineWidth={1} transparent opacity={0.6} />
      </group>

      {/* RUN Phase: 24 amber spheres (InstancedMesh, emissive #E8A33D) */}
      <instancedMesh ref={packetsMeshRef} args={[undefined, undefined, 24]}>
        <sphereGeometry args={[0.065, 16, 16]} />
        <meshStandardMaterial
          color="#E8A33D"
          emissive="#E8A33D"
          emissiveIntensity={2.5}
          roughness={0.25}
          metalness={0.2}
        />
      </instancedMesh>

      {/* SCALE Phase: 12 container cubes on INFRA slab (InstancedMesh) */}
      <instancedMesh ref={containersMeshRef} args={[undefined, undefined, 12]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhysicalMaterial
          color="#1A2028"
          roughness={0.35}
          metalness={0.5}
          clearcoat={0.4}
          clearcoatRoughness={0.2}
        />
      </instancedMesh>

      {/* DEPLOYED Phase: Thin green ring (#4CC38A) pulsing around base */}
      <mesh ref={greenRingRef} position={[0, -0.65, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.5, 0.025, 16, 96]} />
        <meshStandardMaterial
          ref={ringMaterialRef}
          color="#4CC38A"
          emissive="#4CC38A"
          emissiveIntensity={2.2}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export function BlueprintScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollProgressRef = useRef<number>(0);
  const overlayDotRef = useRef<HTMLSpanElement>(null);
  const overlayTextRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Update HUD overlay via direct DOM manipulation (never React state)
    const updateOverlay = (progress: number) => {
      const pct = Math.round(progress * 100);
      let label = `DRAWING ${pct}%`;
      let dotBg = "#8B95A3";

      if (progress < 0.15) {
        label = `DRAWING ${pct}%`;
        dotBg = "#8B95A3";
      } else if (progress < 0.35) {
        label = `EXTRUDE ${pct}%`;
        dotBg = "#8B95A3";
      } else if (progress < 0.55) {
        label = `EXPLODE ${pct}%`;
        dotBg = "#8B95A3";
      } else if (progress < 0.75) {
        label = `RUN ${pct}%`;
        dotBg = "#E8A33D"; // amber packets active
      } else if (progress < 0.9) {
        label = `SCALE ${pct}%`;
        dotBg = "#8B95A3";
      } else {
        label = `DEPLOYED ${pct}% — deployed ✓`;
        dotBg = "#4CC38A"; // ok green
      }

      if (overlayTextRef.current) {
        overlayTextRef.current.textContent = label;
      }
      if (overlayDotRef.current) {
        overlayDotRef.current.style.backgroundColor = dotBg;
      }
    };

    // Smooth scroll with Lenis + ScrollTrigger synchronization
    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
    });

    const onLenisScroll = () => {
      ScrollTrigger.update();
    };
    lenis.on("scroll", onLenisScroll);

    const onTickerRaf = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(onTickerRaf);
    gsap.ticker.lagSmoothing(0);

    const trigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        scrollProgressRef.current = self.progress;
        updateOverlay(self.progress);
      },
    });

    updateOverlay(0);

    return () => {
      trigger.kill();
      gsap.ticker.remove(onTickerRaf);
      lenis.off("scroll", onLenisScroll);
      lenis.destroy();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative h-[500vh] bg-[#0B0D10]">
      {/* Sticky full-viewport canvas */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <Canvas
          camera={{ position: [0, 11, 3.8], fov: 36 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false }}
        >
          <color attach="background" args={["#0B0D10"]} />
          <ambientLight intensity={0.65} />
          <directionalLight position={[8, 14, 6]} intensity={1.6} color="#E6EAF0" />
          <directionalLight position={[-8, 6, -6]} intensity={0.5} color="#3A4350" />
          <directionalLight position={[0, -6, 0]} intensity={0.2} color="#232A33" />

          <SceneContent progressRef={scrollProgressRef} />
        </Canvas>

        {/* Fixed mono HUD overlay (bottom-left) */}
        <div className="pointer-events-none fixed bottom-6 left-6 z-50 flex items-center gap-2.5 rounded border border-[#232A33] bg-[#0B0D10]/85 px-3.5 py-2 font-mono text-xs tracking-wider text-[#E6EAF0] shadow-2xl backdrop-blur-md select-none">
          <span
            ref={overlayDotRef}
            className="inline-block h-2 w-2 rounded-full bg-[#8B95A3] transition-colors duration-200"
          />
          <span ref={overlayTextRef}>DRAWING 0%</span>
        </div>
      </div>
    </div>
  );
}
