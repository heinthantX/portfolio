"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCallback, useEffect, useRef, useState } from "react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface UseStackTimelineResult {
  /** The effective progress (0..1) combining scroll scrub and replay animation */
  progressRef: React.RefObject<number>;
  /** The raw scroll progress (0..1) from ScrollTrigger */
  scrollProgressRef: React.RefObject<number>;
  /** The replay progress (0..1) */
  replayProgressRef: React.RefObject<number>;
  /** Replays the SCALE -> DEPLOYED phase (0.68 -> 1.0) over 2.4s */
  replay: () => void;
  /** Whether reduced motion is requested */
  isReducedMotion: boolean;
}

export function useStackTimeline(
  triggerRef: React.RefObject<HTMLElement | null>,
): UseStackTimelineResult {
  const progressRef = useRef<number>(0);
  const scrollProgressRef = useRef<number>(0);
  const replayProgressRef = useRef<number>(0);
  const isReplayingRef = useRef<boolean>(false);
  const replayTweenRef = useRef<gsap.core.Tween | null>(null);

  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(mediaQuery.matches);

    const onMotionChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", onMotionChange);
    return () => {
      mediaQuery.removeEventListener("change", onMotionChange);
    };
  }, []);

  const replay = useCallback(() => {
    if (isReducedMotion) return;

    if (replayTweenRef.current) {
      replayTweenRef.current.kill();
    }

    isReplayingRef.current = true;
    replayProgressRef.current = 0;
    progressRef.current = Math.max(scrollProgressRef.current, 0.68);

    replayTweenRef.current = gsap.to(replayProgressRef, {
      current: 1,
      duration: 2.4,
      ease: "power2.inOut",
      onUpdate: () => {
        progressRef.current = Math.max(
          scrollProgressRef.current,
          0.68 + 0.32 * replayProgressRef.current,
        );
      },
      onComplete: () => {
        isReplayingRef.current = false;
        replayProgressRef.current = 0;
        progressRef.current = scrollProgressRef.current;
      },
    });
  }, [isReducedMotion]);

  useEffect(() => {
    if (isReducedMotion || !triggerRef.current || typeof window === "undefined") {
      return;
    }

    const trigger = ScrollTrigger.create({
      trigger: triggerRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.6,
      onUpdate: (self) => {
        scrollProgressRef.current = self.progress;
        if (isReplayingRef.current) {
          progressRef.current = Math.max(self.progress, 0.68 + 0.32 * replayProgressRef.current);
        } else {
          progressRef.current = self.progress;
        }
      },
    });

    return () => {
      trigger.kill();
      if (replayTweenRef.current) {
        replayTweenRef.current.kill();
      }
    };
  }, [isReducedMotion, triggerRef]);

  return {
    progressRef,
    scrollProgressRef,
    replayProgressRef,
    replay,
    isReducedMotion,
  };
}
