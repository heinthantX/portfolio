"use client";

import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useState } from "react";
import { sampleText } from "./glyph";
import { CAMERA, type DriveFn, SignalPoints } from "./SignalPoints";
import { glyph } from "./shapes";
import { breathe } from "./timeline";

interface Props {
  count: number;
  frameloop: "always" | "never";
}

/** The 404 scene: points form "404", scatter and reform; the cursor repels. Client only. */
export default function SignalCanvas({ count, frameloop }: Props) {
  const [samples, setSamples] = useState<Float32Array | null>(null);

  useEffect(() => {
    let live = true;
    sampleText("404").then((s) => live && setSamples(s));
    return () => {
      live = false;
    };
  }, []);

  const shapes = useMemo(() => {
    if (!samples) return null;
    const g = glyph(samples, count, 7, 4.0);
    return [g, g];
  }, [samples, count]);

  // a pure function of the clock: scatter / reform loop
  const drive: DriveFn = useCallback((elapsed, view) => {
    const phase = elapsed % 9;
    const s = Math.min(1, Math.max(0, (phase - 5.5) / 3));
    const scale = Math.min(1.45, (0.9 * view.w) / 4) * breathe(elapsed);
    const pose = { x: 0, y: 0, rotX: 0, rotY: 0, scale };
    return { s, from: pose, to: pose };
  }, []);

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
