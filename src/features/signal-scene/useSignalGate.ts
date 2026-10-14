"use client";

import { type RefObject, useEffect, useState } from "react";

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Decides, after hydration, whether the canvas may load: WebGL present, motion allowed,
 * idle time reached. Also reports point count and whether the stage is on screen.
 * Server and first client render both see `{ fallback: false, ready: false }`.
 */
export function useSignalGate(stage: RefObject<HTMLElement | null>) {
  const [fallback, setFallback] = useState(false);
  const [ready, setReady] = useState(false);
  const [count, setCount] = useState(16000);
  const [visible, setVisible] = useState(true);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !hasWebGL()) {
      setFallback(true);
      return;
    }
    if (window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768) setCount(6000);
    const go = () => setReady(true);
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(go, { timeout: 800 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(go, 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    const vis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", vis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
    };
  }, [stage]);

  return {
    fallback,
    ready,
    count,
    frameloop: visible && !hidden ? ("always" as const) : ("never" as const),
  };
}
