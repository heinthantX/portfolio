"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { hasWebGL, lowPower } from "@/features/signal-scene/useSignalGate";
import { useHero } from "./store";

const WaveCanvas = dynamic(() => import("./WaveCanvas"), { ssr: false });

/**
 * WebGL present and idle reached; point count and pixel ratio by device; tab visibility. Under
 * reduced motion the wave still loads, as one still frame.
 */
function useSiteGate() {
  const [ready, setReady] = useState(false);
  const [still, setStill] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!hasWebGL()) return;
    setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setMobile(lowPower());
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

  return { ready, still, mobile, count: mobile ? 6000 : 16000, hidden };
}

/**
 * One fixed canvas behind every page, kept across route changes: the site-wide stream. On the
 * home page the hero drives it, and its shapes dissolve into the stream after "shipped".
 */
export function SiteWave() {
  const hero = useHero();
  const gate = useSiteGate();
  if (!gate.ready) return null;
  return (
    <div
      aria-hidden="true"
      data-site-wave
      data-hero={hero ? "true" : "false"}
      className="no-print pointer-events-none fixed inset-x-0 top-0 -z-10 h-[100lvh]"
    >
      <WaveCanvas
        count={gate.count}
        still={gate.still}
        mobile={gate.mobile}
        frameloop={gate.still ? "demand" : gate.hidden ? "never" : "always"}
      />
    </div>
  );
}
