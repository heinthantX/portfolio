"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Hud } from "./Hud";
import { local } from "./phases";
import { useStackTimeline } from "./useStackTimeline";

const DynamicStackScene = dynamic(() => import("./StackScene"), { ssr: false });

export interface StackHeroProps {
  /** Hero text (visible first). */
  children: React.ReactNode;
  /** About text, shown beside the stack during the RUN phase. */
  about?: React.ReactNode;
  poster: { dark: string; light: string };
}

function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

const POSTER_ALT = "Four-layer system diagram: interface, API, data and infrastructure, deployed";

export function StackHero({ children, about, poster }: StackHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);

  const { progressRef, replay, isReducedMotion } = useStackTimeline(sectionRef);

  const [isClientReady, setIsClientReady] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [tier, setTier] = useState<"high" | "low">("high");
  const [frameloop, setFrameloop] = useState<"always" | "demand">("always");

  // Decide capabilities, then load the scene only after first paint.
  useEffect(() => {
    setHasWebGL(checkWebGLSupport());
    const coarse = window.matchMedia("(pointer: coarse), (max-width: 767px)").matches;
    setTier(coarse ? "low" : "high");
    const onLoad = () => setIsClientReady(true);
    if ("requestIdleCallback" in window) {
      const handle = window.requestIdleCallback(onLoad, { timeout: 800 });
      return () => window.cancelIdleCallback(handle);
    }
    const timeout = setTimeout(onLoad, 0);
    return () => clearTimeout(timeout);
  }, []);

  // Render only while the stage is on screen.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new IntersectionObserver(([entry]) =>
      setFrameloop(entry.isIntersecting ? "always" : "demand"),
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const showPoster = isReducedMotion || !hasWebGL;

  // Hero text hands over to the About text as the stack starts running. DOM writes, no re-renders.
  useEffect(() => {
    if (showPoster || !about) return;
    let raf = 0;
    const tick = () => {
      const p = progressRef.current;
      const heroOut = local(p, 0.3, 0.42);
      const aboutIn = local(p, 0.46, 0.54) * (1 - local(p, 0.82, 0.9));
      if (heroTextRef.current) {
        heroTextRef.current.style.opacity = String(1 - heroOut);
        heroTextRef.current.style.transform = `translateY(${-24 * heroOut}px)`;
        heroTextRef.current.inert = heroOut > 0.5;
      }
      if (aboutRef.current) {
        aboutRef.current.style.opacity = String(aboutIn);
        aboutRef.current.style.transform = `translateY(${24 * (1 - aboutIn)}px)`;
        aboutRef.current.inert = aboutIn < 0.5;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [showPoster, about, progressRef]);

  if (showPoster) {
    // Static, fully readable layout: no scroll track, poster beside the text, about below.
    return (
      <section data-stack-hero className="relative">
        <div className="mx-auto grid min-h-[100svh] max-w-[1280px] items-center gap-10 px-4 pt-24 sm:px-6 lg:grid-cols-2 lg:px-10">
          <div>{children}</div>
          <div className="relative">
            {/* biome-ignore lint/performance/noImgElement: theme-swapped poster pair */}
            <img src={poster.light} alt={POSTER_ALT} className="hidden w-full light:block" />
            {/* biome-ignore lint/performance/noImgElement: theme-swapped poster pair */}
            <img src={poster.dark} alt={POSTER_ALT} className="w-full light:hidden" />
            <Hud progressRef={progressRef} isStatic className="mt-4" />
          </div>
        </div>
        {about && <div className="mx-auto max-w-[1280px] px-4 pb-24 sm:px-6 lg:px-10">{about}</div>}
      </section>
    );
  }

  return (
    <section ref={sectionRef} data-stack-hero className="relative h-[400vh] w-full">
      <div
        ref={stageRef}
        data-stack-stage
        className="sticky top-0 h-[100svh] w-full overflow-hidden"
      >
        <div className="absolute inset-0 opacity-45 lg:left-[38%] lg:opacity-100">
          {isClientReady && (
            <DynamicStackScene
              progressRef={progressRef}
              variant="hero"
              tier={tier}
              frameloop={frameloop}
            />
          )}
        </div>

        <div className="pointer-events-none relative mx-auto grid h-full w-full max-w-[1280px] items-center px-4 sm:px-6 lg:px-10">
          <div
            className="pointer-events-auto col-start-1 row-start-1 w-full lg:w-1/2"
            ref={heroTextRef}
          >
            {children}
          </div>
          {about && (
            <div
              ref={aboutRef}
              className="pointer-events-auto col-start-1 row-start-1 w-full opacity-0 lg:w-[42%]"
            >
              {about}
            </div>
          )}
        </div>

        <div className="absolute bottom-5 left-4 z-10 flex flex-col items-start gap-3 sm:left-6 sm:flex-row sm:items-center lg:left-auto lg:right-10">
          <Hud progressRef={progressRef} maxPods={tier === "high" ? 12 : 8} />
          <Button variant="secondary" size="sm" onClick={replay}>
            Ship it again
          </Button>
        </div>
      </div>
    </section>
  );
}
