"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { type LenisRef, ReactLenis, useLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { capWheelDelta } from "./wheel";

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Lenis smooth scroll on GSAP's ticker so ScrollTrigger stays in sync. Native scroll for reduced motion. */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    // Resolve the instance on every tick: ReactLenis creates it after this effect runs.
    const tick = (time: number) => lenisRef.current?.lenis?.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => gsap.ticker.remove(tick);
  }, []);

  return (
    <ReactLenis
      root
      ref={lenisRef}
      options={{
        autoRaf: false,
        lerp: 0.09,
        wheelMultiplier: 0.9,
        smoothWheel: !reducedMotion(),
        anchors: true,
        virtualScroll: capWheelDelta,
      }}
    >
      <ScrollTriggerSync />
      <RouteFeel />
      {children}
    </ReactLenis>
  );
}

function ScrollTriggerSync() {
  useLenis(ScrollTrigger.update);
  return null;
}

/** The home hero is tuned for a heavy glide; reading pages follow the trackpad closely. */
function RouteFeel() {
  const lenis = useLenis();
  const home = usePathname() === "/";
  useEffect(() => {
    if (!lenis) return;
    lenis.options.lerp = home ? 0.09 : 0.18;
    lenis.options.wheelMultiplier = home ? 0.9 : 1;
  }, [lenis, home]);
  return null;
}
