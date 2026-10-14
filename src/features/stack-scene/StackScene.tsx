"use client";

import { AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { damp, damp3 } from "maath/easing";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { DeployRing } from "./DeployRing";
import { Layer } from "./Layer";
import { STACK_LAYERS, TIER_CONFIG } from "./layers";
import { Packets } from "./Packets";
import { local } from "./phases";
import { type ThemeColors, type ThemeMood, useThemeColors } from "./useThemeColors";

export interface StackSceneProps {
  progressRef: React.RefObject<number>;
  variant?: "hero" | "not-found";
  tier?: "high" | "low";
  frameloop?: "always" | "demand";
}

interface SceneContentProps {
  progressRef: React.RefObject<number>;
  variant: "hero" | "not-found";
  tier: "high" | "low";
  setTier: (tier: "high" | "low") => void;
  colors: ThemeColors;
  mood: ThemeMood;
}

function SceneContent({ progressRef, variant, tier, colors, mood }: SceneContentProps) {
  const tiltGroupRef = useRef<THREE.Group>(null);
  const gapAnimRef = useRef({ val: 0.28 });
  const pointerRef = useRef({ x: 0, y: 0 });

  const tempLookAt = useMemo(() => new THREE.Vector3(), []);
  const fixedProgressRef = useRef<number>(0.45); // Fixed EXPLODE pose for not-found
  const activeProgressRef = variant === "not-found" ? fixedProgressRef : progressRef;

  // Track fine-pointer mouse position for ±4° tilt
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePointerMove = (e: PointerEvent) => {
      if (window.matchMedia("(pointer: fine)").matches) {
        pointerRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointerRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  useFrame((state, delta) => {
    const p = activeProgressRef.current ?? 0;

    // -----------------------------------------------------------------
    // 1. Camera easing:
    // DRAW (0..0.14): top-front ortho-like [0, 8.5, 3.2]
    // BUILD onward (0.14..0.32+): 3/4 perspective [7.4, 6.2, 8.6]
    // -----------------------------------------------------------------
    if (variant === "not-found") {
      damp3(state.camera.position, [7.4, 6.2, 8.6], 0.2, delta);
      tempLookAt.set(1.7, 0.2, 0);
      state.camera.lookAt(tempLookAt);
    } else {
      const camT = local(p, 0.14, 0.32);
      const camEase = THREE.MathUtils.smoothstep(camT, 0, 1);
      const targetCamX = THREE.MathUtils.lerp(0, 7.4, camEase);
      const targetCamY = THREE.MathUtils.lerp(8.5, 6.2, camEase);
      const targetCamZ = THREE.MathUtils.lerp(3.2, 8.6, camEase);

      damp3(state.camera.position, [targetCamX, targetCamY, targetCamZ], 0.2, delta);
      const targetLookX = THREE.MathUtils.lerp(0, 1.7, camEase);
      tempLookAt.set(targetLookX, 0, 0);
      state.camera.lookAt(tempLookAt);
    }

    // -----------------------------------------------------------------
    // 2. Small pointer tilt: max ±4° (~0.07 rad) on fine pointers
    // -----------------------------------------------------------------
    if (tiltGroupRef.current) {
      const maxTilt = (4 * Math.PI) / 180;
      const targetRotX = -pointerRef.current.y * maxTilt;
      const targetRotY = pointerRef.current.x * maxTilt;
      damp(tiltGroupRef.current.rotation, "x", targetRotX, 0.2, delta);
      damp(tiltGroupRef.current.rotation, "y", targetRotY, 0.2, delta);
    }

    // -----------------------------------------------------------------
    // 3. Dynamic layer gaps per phase:
    // - DRAW / BUILD: assembled gap ~0.28
    // - EXPLODE (0.32..0.50): opens to ~1.35
    // - RUN / SCALE (0.50..0.86): remains exploded at ~1.35
    // - DEPLOYED (0.86..1.0): closes back together to ~0.38
    // -----------------------------------------------------------------
    let targetGap = 0.28;
    if (variant === "not-found") {
      targetGap = 1.35;
    } else if (p < 0.32) {
      targetGap = 0.28;
    } else if (p < 0.5) {
      const t = local(p, 0.32, 0.5);
      targetGap = THREE.MathUtils.lerp(0.28, 1.35, THREE.MathUtils.smoothstep(t, 0, 1));
    } else if (p < 0.86) {
      targetGap = 1.35;
    } else {
      const t = local(p, 0.86, 1.0);
      targetGap = THREE.MathUtils.lerp(1.35, 0.38, THREE.MathUtils.smoothstep(t, 0, 1));
    }

    damp(gapAnimRef.current, "val", targetGap, 0.2, delta);
  });

  const curGap = gapAnimRef.current.val;
  const slabYOffsets = [curGap * 1.5, curGap * 0.5, -curGap * 0.5, -curGap * 1.5] as const;

  return (
    <>
      {/* Lights per mood */}
      {mood === "dark" ? (
        <>
          <ambientLight intensity={0.7} color={colors.text} />
          <directionalLight position={[8, 12, 6]} intensity={1.5} color={colors.text} />
          <directionalLight position={[-8, 6, -6]} intensity={0.5} color={colors.lineStrong} />
          <directionalLight position={[0, -6, 0]} intensity={0.25} color={colors.line} />
        </>
      ) : (
        <>
          <ambientLight intensity={1.1} color="#FFFFFF" />
          <directionalLight position={[8, 14, 6]} intensity={1.6} color="#FFFFFF" />
          <directionalLight position={[-6, 6, -6]} intensity={0.4} color={colors.line} />
          <directionalLight position={[0, -6, 0]} intensity={0.2} color={colors.line} />
        </>
      )}

      {/* Main tilt group */}
      <group ref={tiltGroupRef}>
        {/* The 4 Slabs */}
        {STACK_LAYERS.map((spec, index) => {
          const isMissing = variant === "not-found" && spec.id === "api";
          return (
            <Layer
              key={spec.id}
              spec={spec}
              progressRef={activeProgressRef}
              tier={tier}
              colors={colors}
              mood={mood}
              yOffset={slabYOffsets[index]}
              isMissing={isMissing}
            />
          );
        })}

        {/* Traveling packets: hero variant only */}
        {variant !== "not-found" && (
          <Packets
            progressRef={activeProgressRef}
            tier={tier}
            colors={colors}
            mood={mood}
            slabYOffsets={slabYOffsets}
          />
        )}

        {/* Green deploy ring at base */}
        <DeployRing
          progressRef={activeProgressRef}
          colors={colors}
          mood={mood}
          baseY={slabYOffsets[3]}
        />
      </group>

      {/* Bloom only in dark mood and high tier */}
      {mood === "dark" && tier === "high" && (
        <EffectComposer>
          <Bloom luminanceThreshold={1.2} luminanceSmoothing={0.2} intensity={1.5} mipmapBlur />
        </EffectComposer>
      )}
    </>
  );
}

export default function StackScene({
  progressRef,
  variant = "hero",
  tier: propTier = "high",
  frameloop = "always",
}: StackSceneProps) {
  const [tier, setTier] = useState<"high" | "low">(propTier);
  const { colors, mood } = useThemeColors();

  useEffect(() => {
    setTier(propTier);
  }, [propTier]);

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 8.5, 3.2], fov: 38 }}
        dpr={TIER_CONFIG[tier].dpr}
        gl={{ antialias: true, alpha: true }}
        frameloop={frameloop}
      >
        <PerformanceMonitor onDecline={() => setTier("low")} />
        <AdaptiveDpr pixelated={false} />

        <SceneContent
          progressRef={progressRef}
          variant={variant}
          tier={tier}
          setTier={setTier}
          colors={colors}
          mood={mood}
        />
      </Canvas>
    </div>
  );
}
