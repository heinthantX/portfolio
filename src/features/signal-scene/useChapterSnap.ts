"use client";

import type Lenis from "lenis";
import { type RefObject, useCallback, useEffect, useRef } from "react";
import { interceptWheel } from "@/components/site/wheel";
import { CHAPTERS, chapterProgress } from "./timeline";

/** A wheel gesture that travels this far (px) within its first PROBE_MS is a fling: scroll freely. */
const FLING_PX = 900;
const PROBE_MS = 220;
/** Quiet time that ends a wheel gesture; trackpad inertia keeps events far closer than this. */
const GAP_MS = 160;
/** Quiet time after any scroll (touch, keys, scrollbar, a fling) before settling on a chapter. */
const SETTLE_MS = 140;
const STEP_S = 1.05;
const EPS = 2;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

/** The next resting scroll position past `from` in direction `dir`, if any. */
export function nextStop(stops: number[], from: number, dir: number): number | undefined {
  return dir > 0 ? stops.find((y) => y > from + EPS) : stops.findLast((y) => y < from - EPS);
}

/**
 * Where a scroll that stopped at `y` should come to rest. Outside the hero (or already resting):
 * nowhere. A deliberate nudge away from the chapter it started on completes that one step; a
 * fling settles on whichever chapter is nearest.
 */
export function settleStop(
  stops: number[],
  y: number,
  anchor: number,
  { nudge, fling }: { nudge: number; fling: boolean },
): number | undefined {
  if (y < stops[0] - EPS || y > stops[stops.length - 1] + EPS) return undefined;
  if (stops.some((s) => Math.abs(s - y) <= EPS)) return undefined;
  const nearest = (v: number) =>
    stops.reduce((b, s, i) => (Math.abs(s - v) < Math.abs(stops[b] - v) ? i : b), 0);
  let k = nearest(y);
  const moved = y - anchor;
  if (!fling && Math.abs(moved) > nudge && k === nearest(anchor)) {
    k = Math.max(0, Math.min(stops.length - 1, k + Math.sign(moved)));
  }
  return stops[k];
}

/**
 * Page-at-a-time scrolling through the hero's chapters: one wheel gesture moves exactly one
 * chapter and lets its morph play out; a fast fling scrolls freely and then settles on the
 * nearest chapter. Touch, keys and the scrollbar settle the same way once they stop.
 * Returns `goTo(chapter)` for the rail and jump links.
 */
export function useChapterSnap(
  sectionRef: RefObject<HTMLElement | null>,
  lenis: Lenis | undefined,
  enabled: boolean,
) {
  const snapRef = useRef<(y: number) => void>(null);

  const stops = useCallback(() => {
    const s = sectionRef.current;
    if (!s) return [];
    const top = s.getBoundingClientRect().top + window.scrollY;
    const range = s.offsetHeight - window.innerHeight;
    return Array.from({ length: CHAPTERS }, (_, i) => Math.round(top + range * chapterProgress(i)));
  }, [sectionRef]);

  useEffect(() => {
    if (!enabled || !lenis) return;
    let target = window.scrollY;
    let anchor = window.scrollY;
    let busyUntil = 0; // a snap is animating until then (Lenis drops onComplete when interrupted)
    let gesture: "step" | "free" | "pass" = "pass";
    let fling = false;
    let lastT = 0;
    let lastAbs = 0;
    let startT = 0;
    let sum = 0;
    let touching = false;
    let pressed = false;
    let timer = 0;

    const snap = (y: number) => {
      target = y;
      anchor = y;
      busyUntil = performance.now() + STEP_S * 1000 + 120;
      lenis.scrollTo(y, { duration: STEP_S, easing: easeInOut });
    };
    snapRef.current = snap;

    const release = interceptWheel(({ deltaY, event }) => {
      if (event.type !== "wheel" || deltaY === 0) return true;
      const now = performance.now();
      const abs = Math.abs(deltaY);
      // a new gesture: after a pause, or a fresh push on top of a decaying inertia tail
      const fresh = now - lastT > GAP_MS || (abs > 24 && abs > 2 * lastAbs);
      lastT = now;
      lastAbs = abs;
      if (fresh) {
        startT = now;
        sum = 0;
        const from = now < busyUntil ? target : lenis.targetScroll;
        const next = nextStop(stops(), from, deltaY);
        const s = stops();
        const inside = from >= s[0] - EPS && from <= s[s.length - 1] + EPS;
        gesture = inside && next !== undefined ? "step" : "pass";
        if (gesture === "step" && next !== undefined) snap(next);
      }
      sum += abs;
      if (gesture === "step" && now - startT < PROBE_MS && sum > FLING_PX) {
        // user means to travel: hand the wheel back to Lenis from where the snap was heading
        gesture = "free";
        fling = true;
        busyUntil = 0;
      }
      return gesture !== "step";
    });

    const settle = () => {
      if (touching || pressed || performance.now() < busyUntil || lenis.isScrolling === "smooth") {
        timer = window.setTimeout(settle, SETTLE_MS);
        return;
      }
      const y = window.scrollY;
      const to = settleStop(stops(), y, anchor, { nudge: window.innerHeight * 0.04, fling });
      fling = false;
      if (to === undefined) anchor = y;
      else snap(to);
    };
    const onScroll = () => {
      clearTimeout(timer);
      timer = window.setTimeout(settle, SETTLE_MS);
    };
    const onTouchStart = () => {
      touching = true;
      busyUntil = 0; // a touch stops Lenis' animation; the next settle decides
      anchor = window.scrollY;
    };
    const onTouchEnd = () => {
      touching = false;
      onScroll();
    };
    const onDown = () => {
      pressed = true;
    };
    const onUp = () => {
      pressed = false;
      onScroll();
    };
    const opts = { passive: true } as const;
    window.addEventListener("scroll", onScroll, opts);
    window.addEventListener("touchstart", onTouchStart, opts);
    window.addEventListener("touchend", onTouchEnd, opts);
    window.addEventListener("touchcancel", onTouchEnd, opts);
    window.addEventListener("pointerdown", onDown, opts);
    window.addEventListener("pointerup", onUp, opts);
    return () => {
      release();
      snapRef.current = null;
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, [enabled, lenis, stops]);

  return useCallback(
    (chapter: number) => {
      const y = stops()[chapter];
      if (y === undefined) return;
      if (snapRef.current) snapRef.current(y);
      else window.scrollTo({ top: y, behavior: "smooth" });
    },
    [stops],
  );
}
