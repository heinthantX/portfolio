"use client";

import { useEffect, useRef } from "react";
import { phaseAt, podCount, statusText } from "./phases";

export interface HudProps {
  progressRef: React.RefObject<number>;
  maxPods?: number;
  isStatic?: boolean;
  className?: string;
}

export function Hud({ progressRef, maxPods = 12, isStatic = false, className = "" }: HudProps) {
  const percentTextRef = useRef<HTMLSpanElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const phaseTextRef = useRef<HTMLSpanElement>(null);
  const countsTextRef = useRef<HTMLSpanElement>(null);
  const statusLineRef = useRef<HTMLSpanElement>(null);
  const ariaLiveRef = useRef<HTMLDivElement>(null);

  const lastPhaseRef = useRef<string>("");

  useEffect(() => {
    if (isStatic) return;

    let rafId: number;

    const tick = () => {
      const p = Math.max(0, Math.min(1, progressRef.current ?? 0));
      const phase = phaseAt(p);
      const percent = Math.round(p * 100);
      const pods = podCount(p, maxPods);
      const status = statusText(p);

      if (percentTextRef.current) {
        percentTextRef.current.textContent = `${percent}%`;
      }
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${percent}%`;
      }
      if (phaseTextRef.current) {
        phaseTextRef.current.textContent = phase;
      }
      if (countsTextRef.current) {
        countsTextRef.current.textContent = `layers 4/4 · pods ${pods}`;
      }
      if (statusLineRef.current) {
        statusLineRef.current.textContent = status;
      }

      // Update aria-live only when the phase changes
      if (phase !== lastPhaseRef.current) {
        lastPhaseRef.current = phase;
        if (ariaLiveRef.current) {
          ariaLiveRef.current.textContent = `Scene phase changed to ${phase}: ${status}`;
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [progressRef, maxPods, isStatic]);

  return (
    <aside
      className={`font-mono text-xs select-none ${className}`}
      aria-label="3D Stack System Status"
    >
      {/* Visually hidden screen reader announcement on phase changes */}
      <div ref={ariaLiveRef} aria-live="polite" className="sr-only">
        {isStatic ? "Scene phase changed to DEPLOYED: deployed ✓" : undefined}
      </div>

      <div className="flex flex-col gap-2 rounded border border-line bg-surface/90 px-3.5 py-2.5 shadow-xl backdrop-blur-md min-w-[260px] max-w-xs">
        {/* Header: Phase name and % */}
        <div className="flex items-center justify-between border-b border-line pb-1.5 text-[11px]">
          <span ref={phaseTextRef} className="font-semibold tracking-wider text-accent-strong">
            {isStatic ? "DEPLOYED" : "DRAW"}
          </span>
          <span ref={percentTextRef} className="tabular-nums font-bold text-text">
            {isStatic ? "100%" : "0%"}
          </span>
        </div>

        {/* Scrub progress hairline */}
        <div className="h-1 w-full overflow-hidden rounded bg-line">
          <div
            ref={progressBarRef}
            className="h-full bg-accent transition-[width] duration-75"
            style={{ width: isStatic ? "100%" : "0%" }}
          />
        </div>

        {/* Metrics line: layers and pods */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>SYSTEM</span>
          <span ref={countsTextRef} className="tabular-nums text-text">
            {isStatic ? "layers 4/4 · pods 12" : "layers 4/4 · pods 0"}
          </span>
        </div>

        {/* Status text */}
        <div className="border-t border-line pt-1 text-[11px]">
          <span className="text-muted-foreground mr-1.5">STATUS:</span>
          <span
            ref={statusLineRef}
            className="font-medium text-text truncate inline-block align-bottom max-w-[180px]"
          >
            {isStatic ? "deployed ✓" : "drafting spec…"}
          </span>
        </div>
      </div>
    </aside>
  );
}
