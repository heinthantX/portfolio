"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { hasWebGL, lowPower } from "@/features/signal-scene/useSignalGate";
import { useHero } from "./store";

const SignalCanvas = dynamic(() => import("@/features/signal-scene/SignalCanvas"), {
  ssr: false,
});

/** WebGL present, motion allowed, idle reached; point count by device; tab visibility. */
function useSiteGate() {
  const [ready, setReady] = useState(false);
  const [count, setCount] = useState(16000);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !hasWebGL()) return;
    if (lowPower()) setCount(6000);
    const go = () => setReady(true);
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(go, { timeout: 800 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(go, 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const vis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", vis);
    return () => document.removeEventListener("visibilitychange", vis);
  }, []);

  return { ready, count, hidden };
}

/** One fixed canvas behind every page, kept across route changes. The hero drives it. */
export function SiteWave() {
  const hero = useHero();
  const gate = useSiteGate();
  const wrap = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(true);

  useEffect(() => {
    const el = hero?.stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [hero]);

  // ride along with the sticky stage, so the canvas leaves exactly when it does
  useEffect(() => {
    const el = hero?.stageRef.current;
    if (!el || !onScreen) return;
    let raf = 0;
    const tick = () => {
      const top = Math.min(0, el.getBoundingClientRect().top);
      if (wrap.current) wrap.current.style.transform = `translate3d(0, ${top}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hero, onScreen]);

  if (!gate.ready || !hero) return null;
  return (
    <div
      ref={wrap}
      aria-hidden="true"
      data-site-wave
      data-hero="true"
      className="no-print pointer-events-none fixed inset-x-0 top-0 -z-10 h-[100svh]"
    >
      <SignalCanvas
        variant="hero"
        progressRef={hero.progressRef}
        maskRef={hero.maskRef}
        count={gate.count}
        frameloop={onScreen && !gate.hidden ? "always" : "never"}
      />
    </div>
  );
}
