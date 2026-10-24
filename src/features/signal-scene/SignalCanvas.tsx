"use client";

import { Canvas } from "@react-three/fiber";
import { type RefObject, useCallback, useEffect, useMemo, useState } from "react";
import { profile } from "@/content/profile";
import { sampleText } from "./glyph";
import { CAMERA, type DriveFn, SignalPoints, type TextMask } from "./SignalPoints";
import { glyph, heroShapes } from "./shapes";
import { poseAt, shapeIndex } from "./timeline";

/** Idle life: a slow ~7 s scale pulse instead of a side-to-side sway. */
const breathe = (t: number) => 1 + Math.sin(t * 0.9) * 0.012;

interface Props {
  variant: "hero" | "not-found";
  progressRef?: RefObject<number>;
  maskRef?: RefObject<TextMask>;
  count: number;
  frameloop: "always" | "never";
}

/** Heavy part (three + shaders): loaded with next/dynamic, client only. */
export default function SignalCanvas({ variant, progressRef, maskRef, count, frameloop }: Props) {
  const [samples, setSamples] = useState<Float32Array | null>(null);
  const hero = variant === "hero";

  useEffect(() => {
    let live = true;
    sampleText(hero ? profile.name : "404").then((s) => live && setSamples(s));
    return () => {
      live = false;
    };
  }, [hero]);

  const shapes = useMemo(() => {
    if (!samples) return null;
    if (hero) return heroShapes(count, samples);
    const g = glyph(samples, count, 7, 4.0);
    return [g, g];
  }, [samples, hero, count]);

  // Pure function of progress (hero) or of the clock (404 scatter / reform loop).
  const drive: DriveFn = useCallback(
    (elapsed, view) => {
      if (hero) {
        const s = shapeIndex(progressRef?.current ?? 0);
        const pose = poseAt(s, view);
        pose.scale *= breathe(elapsed);
        return { s, pose };
      }
      const phase = elapsed % 9;
      const s = Math.min(1, Math.max(0, (phase - 5.5) / 3));
      const scale = Math.min(1.45, (0.9 * view.w) / 4) * breathe(elapsed);
      return { s, pose: { x: 0, y: 0, rotX: 0, rotY: 0, scale } };
    },
    [hero, progressRef],
  );

  if (!shapes) return null;
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={CAMERA}
      frameloop={frameloop}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <SignalPoints
        maskRef={maskRef}
        shapes={shapes}
        count={count}
        drive={drive}
        interactive={
          typeof window !== "undefined" && !window.matchMedia("(pointer: coarse)").matches
        }
      />
    </Canvas>
  );
}
