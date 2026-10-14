"use client";

import { Edges, Line, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { damp, damp3, dampC } from "maath/easing";
import { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  COLOR_AMBER,
  COLOR_BG,
  COLOR_EDGE,
  COLOR_GREEN,
  COLOR_SURFACE,
  COLOR_SURFACE_DIM,
  MAX_PODS,
  NODE_POSITIONS,
  schedule,
  TOTAL_NODES,
} from "./schedule";

// Generate points for the thin green rollout ring surrounding the cluster
function createRoundedRectPoints(
  width: number,
  depth: number,
  radius: number,
  segments = 16,
): [number, number, number][] {
  const points: [number, number, number][] = [];
  const w = width / 2 - radius;
  const d = depth / 2 - radius;

  // 4 rounded corners in XZ plane at y = 0.05
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * (Math.PI / 2);
    points.push([w + Math.sin(angle) * radius, 0.05, d + Math.cos(angle) * radius]);
  }
  for (let i = 0; i <= segments; i++) {
    const angle = Math.PI / 2 + (i / segments) * (Math.PI / 2);
    points.push([w + Math.sin(angle) * radius, 0.05, -d + Math.cos(angle) * radius]);
  }
  for (let i = 0; i <= segments; i++) {
    const angle = Math.PI + (i / segments) * (Math.PI / 2);
    points.push([-w + Math.sin(angle) * radius, 0.05, -d + Math.cos(angle) * radius]);
  }
  for (let i = 0; i <= segments; i++) {
    const angle = (3 * Math.PI) / 2 + (i / segments) * (Math.PI / 2);
    points.push([-w + Math.sin(angle) * radius, 0.05, d + Math.cos(angle) * radius]);
  }
  // Close loop
  points.push(points[0]);
  return points;
}

const NODE_ITEMS = NODE_POSITIONS.map((pos, id) => ({
  id,
  nodeKey: `cluster-node-${id}`,
  pos,
}));

// Ensure the orthographic camera maintains isometric orientation
function CameraRig() {
  const { camera } = useThree();

  useEffect(() => {
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return null;
}

// Individual Node Plate
interface NodePlateProps {
  id: number;
  center: [number, number, number];
  onToggle: (id: number) => void;
  progressRef: React.MutableRefObject<number>;
  killedNodesRef: React.MutableRefObject<Set<number>>;
}

function NodePlate({ id, center, onToggle, progressRef, killedNodesRef }: NodePlateProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const targetPos = useMemo(() => new THREE.Vector3(...center), [center]);

  useFrame((state, delta) => {
    if (!meshRef.current || !matRef.current) return;

    const currentSchedule = schedule(
      progressRef.current,
      killedNodesRef.current,
      state.clock.elapsedTime,
    );
    const nodeTarget = currentSchedule.nodes[id];

    // Ease vertical rise during BOOT
    damp(meshRef.current.position, "y", nodeTarget.targetY, 0.15, delta);

    // Ease dim state when node is killed/failed
    const targetColor = nodeTarget.targetDim > 0.5 ? COLOR_SURFACE_DIM : COLOR_SURFACE;
    dampC(matRef.current.color, targetColor, 0.15, delta);
  });

  return (
    <group position={targetPos}>
      <RoundedBox
        ref={meshRef}
        args={[1.6, 0.12, 1.6]}
        radius={0.03}
        smoothness={4}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(id);
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
        <meshStandardMaterial ref={matRef} color={COLOR_SURFACE} roughness={0.4} metalness={0.1} />
        <Edges color={COLOR_EDGE} threshold={15} />
      </RoundedBox>
    </group>
  );
}

// Pods rendered in a single InstancedMesh (max 36)
interface PodsInstanceProps {
  progressRef: React.MutableRefObject<number>;
  killedNodesRef: React.MutableRefObject<Set<number>>;
}

function PodsInstance({ progressRef, killedNodesRef }: PodsInstanceProps) {
  const podsMeshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Geometry with vertex colors: top face is 1.0 (pure tag color), side/bottom is dark charcoal with tint factor
  const podGeometry = useMemo(() => {
    const geom = new THREE.BoxGeometry(0.28, 0.28, 0.28);
    const pos = geom.attributes.position;
    const normals = geom.attributes.normal;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const ny = normals.getY(i);
      if (ny > 0.5) {
        // Top face: layer tag color shows completely
        colors[i * 3 + 0] = 1.0;
        colors[i * 3 + 1] = 1.0;
        colors[i * 3 + 2] = 1.0;
      } else {
        // Sides and bottom: dark charcoal body with subtle edge tint
        colors[i * 3 + 0] = 0.22;
        colors[i * 3 + 1] = 0.26;
        colors[i * 3 + 2] = 0.32;
      }
    }
    geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geom;
  }, []);

  // Persistent smoothed state for each of the 36 pods
  const podStates = useMemo(() => {
    return Array.from({ length: MAX_PODS }, () => ({
      pos: new THREE.Vector3(0, -5, 0),
      scale: new THREE.Vector3(0, 0, 0),
      color: new THREE.Color(COLOR_SURFACE),
    }));
  }, []);

  // Initialize colors on mount
  useEffect(() => {
    if (!podsMeshRef.current) return;
    const initialColor = new THREE.Color(COLOR_SURFACE);
    for (let i = 0; i < MAX_PODS; i++) {
      podsMeshRef.current.setColorAt(i, initialColor);
    }
    if (podsMeshRef.current.instanceColor) {
      podsMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, []);

  useFrame((state, delta) => {
    const mesh = podsMeshRef.current;
    if (!mesh) return;

    const currentSchedule = schedule(
      progressRef.current,
      killedNodesRef.current,
      state.clock.elapsedTime,
    );

    for (let i = 0; i < MAX_PODS; i++) {
      const pSched = currentSchedule.pods[i];
      const pState = podStates[i];

      // Damp position
      damp3(pState.pos, pSched.targetPos, 0.12, delta);

      // Damp scale uniformly
      damp(pState.scale, "x", pSched.targetScale, 0.12, delta);
      pState.scale.y = pState.scale.x;
      pState.scale.z = pState.scale.x;

      // Damp color
      dampC(pState.color, pSched.targetColor, 0.12, delta);

      dummy.position.copy(pState.pos);
      dummy.scale.copy(pState.scale);
      dummy.updateMatrix();

      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, pState.color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={podsMeshRef} args={[podGeometry, undefined, MAX_PODS]}>
      <meshStandardMaterial vertexColors roughness={0.25} metalness={0.15} />
    </instancedMesh>
  );
}

// Traffic packets (amber instanced spheres)
interface TrafficPacketsProps {
  progressRef: React.MutableRefObject<number>;
  killedNodesRef: React.MutableRefObject<Set<number>>;
}

function TrafficPackets({ progressRef, killedNodesRef }: TrafficPacketsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const packetCount = 24;

  const sphereGeometry = useMemo(() => new THREE.SphereGeometry(0.055, 12, 12), []);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const currentSchedule = schedule(
      progressRef.current,
      killedNodesRef.current,
      state.clock.elapsedTime,
    );

    for (let i = 0; i < packetCount; i++) {
      const pkt = currentSchedule.trafficPackets[i];
      if (pkt) {
        dummy.position.set(pkt.pos[0], pkt.pos[1], pkt.pos[2]);
        dummy.scale.setScalar(pkt.scale);
      } else {
        dummy.scale.setScalar(0);
      }
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[sphereGeometry, undefined, packetCount]}>
      <meshBasicMaterial color={COLOR_AMBER} />
    </instancedMesh>
  );
}

// Thin green rollout ring surrounding the cluster
interface RolloutRingProps {
  progressRef: React.MutableRefObject<number>;
  killedNodesRef: React.MutableRefObject<Set<number>>;
}

function RolloutRing({ progressRef, killedNodesRef }: RolloutRingProps) {
  const groupRef = useRef<THREE.Group>(null);
  const smoothedState = useRef({ scale: 0, opacity: 0 });
  const ringPoints = useMemo(() => createRoundedRectPoints(8.8, 6.4, 1.2), []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const currentSchedule = schedule(
      progressRef.current,
      killedNodesRef.current,
      state.clock.elapsedTime,
    );

    damp(smoothedState.current, "scale", currentSchedule.rolloutRingScale, 0.15, delta);
    damp(smoothedState.current, "opacity", currentSchedule.rolloutRingOpacity, 0.15, delta);

    const s = smoothedState.current.scale;
    groupRef.current.scale.set(s, 1, s);
    groupRef.current.visible = s > 0.01;
  });

  return (
    <group ref={groupRef} visible={false}>
      <Line points={ringPoints} color={COLOR_GREEN} lineWidth={1.8} />
    </group>
  );
}

// Background coordinate grid
function GroundGrid() {
  return (
    <group position={[0, -0.061, 0]}>
      <gridHelper args={[24, 24, "#232A33", "#14181F"]} />
    </group>
  );
}

// Orchestrates the 3D scene and connects overlay DOM refs to useFrame
interface ClusterSceneInnerProps {
  progressRef: React.MutableRefObject<number>;
  killedNodesRef: React.MutableRefObject<Set<number>>;
  overlayRefs: {
    progressTextRef: React.RefObject<HTMLSpanElement | null>;
    phaseTextRef: React.RefObject<HTMLSpanElement | null>;
    nodesTextRef: React.RefObject<HTMLSpanElement | null>;
    podsTextRef: React.RefObject<HTMLSpanElement | null>;
    statusTextRef: React.RefObject<HTMLSpanElement | null>;
    progressBarRef: React.RefObject<HTMLDivElement | null>;
  };
  onToggleNode: (id: number) => void;
}

function ClusterSceneInner({
  progressRef,
  killedNodesRef,
  overlayRefs,
  onToggleNode,
}: ClusterSceneInnerProps) {
  // Update overlay DOM directly in useFrame with zero React state re-renders
  useFrame((state) => {
    const currentSchedule = schedule(
      progressRef.current,
      killedNodesRef.current,
      state.clock.elapsedTime,
    );

    const percent = Math.round(currentSchedule.globalProgress * 100);

    if (overlayRefs.progressTextRef.current) {
      overlayRefs.progressTextRef.current.textContent = `${percent}%`;
    }
    if (overlayRefs.progressBarRef.current) {
      overlayRefs.progressBarRef.current.style.width = `${percent}%`;
    }
    if (overlayRefs.phaseTextRef.current) {
      overlayRefs.phaseTextRef.current.textContent = currentSchedule.phase;
      overlayRefs.phaseTextRef.current.style.color = currentSchedule.rolloutComplete
        ? COLOR_GREEN
        : currentSchedule.phase === "TRAFFIC"
          ? COLOR_AMBER
          : "#E6EAF0";
    }
    if (overlayRefs.nodesTextRef.current) {
      overlayRefs.nodesTextRef.current.textContent = `${currentSchedule.onlineNodesCount}/${TOTAL_NODES} online`;
    }
    if (overlayRefs.podsTextRef.current) {
      overlayRefs.podsTextRef.current.textContent = `${currentSchedule.activePodsCount} running`;
    }
    if (overlayRefs.statusTextRef.current) {
      overlayRefs.statusTextRef.current.textContent = currentSchedule.statusMessage;
      overlayRefs.statusTextRef.current.style.color = currentSchedule.rolloutComplete
        ? COLOR_GREEN
        : "#E6EAF0";
    }
  });

  return (
    <>
      <color attach="background" args={[COLOR_BG]} />
      <CameraRig />

      {/* Lighting */}
      <ambientLight intensity={0.9} color="#FFFFFF" />
      <directionalLight position={[14, 22, 12]} intensity={1.6} color="#FFFFFF" />
      <directionalLight position={[-12, 10, -10]} intensity={0.5} color="#8B95A3" />

      {/* Subtle floor grid */}
      <GroundGrid />

      {/* 4x3 Grid of Node Plates */}
      {NODE_ITEMS.map((item) => (
        <NodePlate
          key={item.nodeKey}
          id={item.id}
          center={item.pos}
          onToggle={onToggleNode}
          progressRef={progressRef}
          killedNodesRef={killedNodesRef}
        />
      ))}

      {/* Instanced Pods */}
      <PodsInstance progressRef={progressRef} killedNodesRef={killedNodesRef} />

      {/* Instanced Traffic Packets */}
      <TrafficPackets progressRef={progressRef} killedNodesRef={killedNodesRef} />

      {/* Green Rollout Ring */}
      <RolloutRing progressRef={progressRef} killedNodesRef={killedNodesRef} />
    </>
  );
}

// Main Client Component containing sticky canvas, GSAP ScrollTrigger, Lenis, and overlay
export default function Scene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<number>(0);
  const killedNodesRef = useRef<Set<number>>(new Set());

  // Direct DOM refs for high-fps overlay without React state
  const progressTextRef = useRef<HTMLSpanElement>(null);
  const phaseTextRef = useRef<HTMLSpanElement>(null);
  const nodesTextRef = useRef<HTMLSpanElement>(null);
  const podsTextRef = useRef<HTMLSpanElement>(null);
  const statusTextRef = useRef<HTMLSpanElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const overlayRefs = useMemo(
    () => ({
      progressTextRef,
      phaseTextRef,
      nodesTextRef,
      podsTextRef,
      statusTextRef,
      progressBarRef,
    }),
    [],
  );

  // Desktop click to kill/restore node
  const handleToggleNode = useCallback((id: number) => {
    if (typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches) {
      if (killedNodesRef.current.has(id)) {
        killedNodesRef.current.delete(id);
      } else {
        killedNodesRef.current.add(id);
      }
    }
  }, []);

  // GSAP ScrollTrigger + Lenis smooth scrolling
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      if (!containerRef.current) return;

      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.5,
        onUpdate: (self) => {
          progressRef.current = self.progress;
        },
      });
    });

    return () => {
      ctx.revert();
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-[500vh] bg-[#0B0D10]">
      {/* Sticky full-viewport canvas */}
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden">
        <Canvas
          orthographic
          camera={{
            position: [15, 14, 15],
            zoom: 52,
            near: -50,
            far: 200,
          }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
          }}
        >
          <ClusterSceneInner
            progressRef={progressRef}
            killedNodesRef={killedNodesRef}
            overlayRefs={overlayRefs}
            onToggleNode={handleToggleNode}
          />
        </Canvas>

        {/* Small fixed mono overlay (bottom-left) */}
        <aside
          aria-label="Cluster Metrics Overlay"
          className="fixed bottom-6 left-6 z-50 pointer-events-none select-none font-mono text-xs"
          style={{ color: "#E6EAF0" }}
        >
          <div
            className="p-3.5 rounded border backdrop-blur-md shadow-2xl flex flex-col gap-2 min-w-[280px]"
            style={{
              backgroundColor: "rgba(18, 22, 27, 0.88)",
              borderColor: "#232A33",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between pb-1.5 border-b"
              style={{ borderColor: "#232A33" }}
            >
              <span
                className="font-semibold tracking-wider text-[11px]"
                style={{ color: "#8B95A3" }}
              >
                {"LIVING CLUSTER // LAB"}
              </span>
              <span
                ref={progressTextRef}
                className="tabular-nums font-bold"
                style={{ color: "#E6EAF0" }}
              >
                0%
              </span>
            </div>

            {/* Progress bar */}
            <div
              className="w-full h-1 rounded overflow-hidden"
              style={{ backgroundColor: "#181D24" }}
            >
              <div
                ref={progressBarRef}
                className="h-full transition-all duration-75"
                style={{ width: "0%", backgroundColor: "#3A4350" }}
              />
            </div>

            {/* Metrics */}
            <div className="flex items-center justify-between">
              <span style={{ color: "#8B95A3" }}>PHASE:</span>
              <span
                ref={phaseTextRef}
                className="font-semibold tracking-wide"
                style={{ color: "#E8A33D" }}
              >
                BOOT
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span style={{ color: "#8B95A3" }}>NODES:</span>
              <span ref={nodesTextRef} className="tabular-nums" style={{ color: "#E6EAF0" }}>
                0/{TOTAL_NODES} online
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span style={{ color: "#8B95A3" }}>PODS:</span>
              <span ref={podsTextRef} className="tabular-nums" style={{ color: "#E6EAF0" }}>
                0 running
              </span>
            </div>

            {/* Status footer */}
            <div className="pt-1.5 border-t flex flex-col gap-1" style={{ borderColor: "#232A33" }}>
              <div className="flex items-center justify-between text-[11px]">
                <span style={{ color: "#8B95A3" }}>STATUS:</span>
                <span
                  ref={statusTextRef}
                  className="font-medium truncate max-w-[190px]"
                  style={{ color: "#E6EAF0" }}
                >
                  hardware boot sequence
                </span>
              </div>
              <div className="text-[10px] tracking-tight mt-0.5" style={{ color: "#8B95A3" }}>
                [desktop] click node plate to evict/heal
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
