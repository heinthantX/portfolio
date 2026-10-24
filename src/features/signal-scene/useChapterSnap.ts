"use client";

import type Lenis from "lenis";
import { type RefObject, useCallback, useEffect, useRef } from "react";
import { interceptWheel } from "@/components/site/wheel";
import { CHAPTERS, chapterProgress } from "./timeline";

/** Raw wheel speed (px/s over the last WINDOW_MS) that reads as a swipe: play the next chapter. */
const STEP_V = 1800;
const WINDOW_MS = 100;
/** A hard fling: this much raw wheel travel within a gesture's first FLING_MS scrolls freely. */
const FLING_PX = 2500;
const FLING_MS = 250;
/** This many swipes within BURST_MS also means the user is travelling (mouse wheels can't fling). */
const BURST_N = 3;
const BURST_MS = 900;
/** A swipe still going at full speed this long after it counted counts again. */
const SUSTAIN_MS = 400;
/** Quiet time that ends a wheel gesture; trackpad inertia keeps events far closer than this. */
const GAP_MS = 160;
/** Quiet time after any other scroll (touch, keys, scrollbar, a fling) before settling. */
const SETTLE_MS = 140;
/** One full chapter plays in STEP_S; shorter remainders keep the same pace, never under MIN_S. */
const STEP_S = 2;
const MIN_S = 0.5;
/** Inside the hero the scroll tracks the wheel tighter and a little further, so it never feels laggy. */
const HERO_LERP = 0.16;
const HERO_GAIN = 1.15;
const EPS = 2;

export type WheelMode = "follow" | "step" | "free";

/** Moves from the first frame, so a swipe answers at once, then eases into the chapter. */
const easeSwipe = (t: number) => 1 - (1 - t) ** 2;
/** Starts faster still, so taking over a moving scroll doesn't stall it. */
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** The next resting scroll position past `from` in direction `dir`, if any. */
export function nextStop(stops: number[], from: number, dir: number): number | undefined {
  return dir > 0 ? stops.find((y) => y > from + EPS) : stops.findLast((y) => y < from - EPS);
}

/**
 * How a wheel gesture should drive the hero. A hard fling or a burst of swipes travels freely;
 * a swipe plays the next chapter at a fixed pace; anything slower follows the wheel.
 */
export function wheelMode({
  speed,
  travelled,
  elapsed,
  swipes,
}: {
  /** raw px/s over the last WINDOW_MS */
  speed: number;
  /** raw px since the gesture started */
  travelled: number;
  /** ms since the gesture started */
  elapsed: number;
  /** swipes within the last BURST_MS, this one included if it is one */
  swipes: number;
}): WheelMode {
  if ((elapsed <= FLING_MS && travelled >= FLING_PX) || swipes >= BURST_N) return "free";
  return speed >= STEP_V ? "step" : "follow";
}

/** Seconds to cover `distance` at one chapter per STEP_S. */
export function playSeconds(distance: number, chapter: number) {
  return Math.min(STEP_S, Math.max(MIN_S, (STEP_S * Math.abs(distance)) / Math.max(chapter, 1)));
}

/**
 * Where a scroll that stopped at `y` should come to rest. Outside the hero (or already resting):
 * nowhere. A move past `nudge` from the chapter it started on finishes the chapter in the
 * direction it was going; a smaller one springs back. A fling (the user meant to travel) carries
 * on to the next chapter in its direction, never back.
 */
export function settleStop(
  stops: number[],
  y: number,
  anchor: number,
  { nudge, fling }: { nudge: number; fling: boolean },
): number | undefined {
  if (y < stops[0] - EPS || y > stops[stops.length - 1] + EPS) return undefined;
  if (stops.some((s) => Math.abs(s - y) <= EPS)) return undefined;
  const nearest = stops.reduce((b, s) => (Math.abs(s - y) < Math.abs(b - y) ? s : b), stops[0]);
  const moved = y - anchor;
  if (!fling && Math.abs(moved) <= nudge) return nearest;
  return nextStop(stops, y, moved) ?? nearest;
}

/** Wheel delta in px, before the per-event cap, so speed reads true. */
const rawDelta = (e: Event) => {
  const w = e as WheelEvent;
  return Math.abs(w.deltaY) * (w.deltaMode === 1 ? 16 : w.deltaMode === 2 ? window.innerHeight : 1);
};

/**
 * Page-at-a-time scrolling through the hero's chapters, so each morph plays out in full.
 * A slow wheel follows the user and finishes the chapter when they stop; a swipe plays the next
 * chapter at a fixed pace (another swipe meanwhile queues one more); only a hard fling or a burst
 * of swipes scrolls freely. Touch, keys and the scrollbar settle the same way once they stop.
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
    const baseLerp = lenis.options.lerp;
    let target = window.scrollY;
    let anchor = window.scrollY;
    // what is animating and until when (Lenis drops onComplete when interrupted)
    let playing: "step" | "finish" | null = null;
    let busyUntil = 0;
    let pending = 0; // one queued chapter: +1 / -1
    let mode: WheelMode | "pass" = "pass";
    let fling = false;
    let dir = 0;
    let lastT = 0;
    let peak = 0;
    let trough = 0;
    let startT = 0;
    let pushT = 0; // when this gesture last counted as a swipe
    let from = 0; // where the gesture began
    let held = 0; // wheel delta swallowed by this gesture, owed to Lenis if it turns into a fling
    let travelled = 0;
    let samples: [number, number][] = [];
    let swipes: number[] = [];
    let touching = false;
    let pressed = false;
    let settleTimer = 0;
    let endTimer = 0;

    const busy = () => performance.now() < busyUntil;
    const chapter = (s: number[]) => (s[s.length - 1] - s[0]) / Math.max(s.length - 1, 1);

    const play = (y: number, kind: "step" | "finish", seconds: number, moving: boolean) => {
      target = y;
      anchor = y;
      playing = kind;
      busyUntil = performance.now() + seconds * 1000 + 120;
      lenis.scrollTo(y, {
        duration: seconds,
        easing: moving ? easeOut : easeSwipe,
        onComplete: () => {
          playing = null;
          busyUntil = 0;
          const d = pending;
          pending = 0;
          const s = stops();
          const next = d ? nextStop(s, y, d) : undefined;
          if (next !== undefined) play(next, "step", playSeconds(next - y, chapter(s)), false);
        },
      });
    };
    const snap = (y: number) => {
      pending = 0;
      play(y, "step", playSeconds(y - window.scrollY, chapter(stops())), false);
    };
    snapRef.current = snap;

    // a slow gesture ended: finish the chapter it was heading into
    const endGesture = () => {
      const was = mode;
      mode = "pass";
      if (was !== "follow" || touching || pressed) return;
      const y = lenis.targetScroll;
      const to = settleStop(stops(), y, anchor, { nudge: window.innerHeight * 0.04, fling: false });
      if (to === undefined) anchor = y;
      else play(to, "finish", playSeconds(to - lenis.animatedScroll, chapter(stops())), true);
    };

    const release = interceptWheel((data) => {
      const { deltaY, event } = data;
      if (event.type !== "wheel" || deltaY === 0) return true;
      const now = performance.now();
      const s = stops();
      const at = busy() ? target : lenis.targetScroll;
      const inside = s.length > 0 && at >= s[0] - EPS && at <= s[s.length - 1] + EPS;
      lenis.options.lerp = inside ? HERO_LERP : baseLerp;
      const d = Math.sign(deltaY);
      const abs = Math.abs(deltaY);
      const raw = rawDelta(event);
      // a new gesture: after a pause, on reversing, or a push that rises out of a decayed inertia tail
      const fresh =
        now - lastT > GAP_MS || d !== dir || (abs >= 20 && abs > 3 * trough && trough < peak / 2);
      lastT = now;
      dir = d;
      // the trough only counts after the peak, so a swipe's own ramp-up is not a new push
      if (fresh || abs > peak) peak = trough = abs;
      else trough = Math.min(trough, abs);
      samples = samples.filter(([t]) => now - t < WINDOW_MS);
      samples.push([now, raw]);
      swipes = swipes.filter((t) => now - t < BURST_MS);
      clearTimeout(endTimer);
      endTimer = window.setTimeout(endGesture, GAP_MS);

      if (fresh) {
        startT = now;
        travelled = 0;
        held = 0;
        from = lenis.animatedScroll;
        if (!inside) mode = "pass";
        else if (busy() && playing === "step") {
          // a chapter is playing: queue one more the same way, or turn straight back
          swipes.push(now);
          pushT = now;
          mode = "step";
          if (d === Math.sign(target - lenis.animatedScroll)) pending = d;
          else {
            const back = nextStop(s, lenis.animatedScroll, d);
            if (back !== undefined)
              play(back, "step", playSeconds(back - lenis.animatedScroll, chapter(s)), true);
          }
        } else {
          // idle, or finishing a slow scroll: follow from here
          if (busy()) {
            // stop the glide where it is drawn, so this wheel adds on from there (no dip back)
            lenis.scrollTo(lenis.animatedScroll, { immediate: true });
            busyUntil = 0;
            playing = null;
          }
          mode = "follow";
        }
      }
      travelled += raw;
      if (mode === "pass" || mode === "free") return true;

      const speed = (samples.reduce((sum, [, v]) => sum + v, 0) * 1000) / WINDOW_MS;
      if (mode === "step" && speed >= STEP_V && now - pushT >= SUSTAIN_MS) {
        // still pushing hard (a spinning mouse wheel): each stretch counts as another swipe
        swipes.push(now);
        pushT = now;
        if (playing === "step" && d === Math.sign(target - lenis.animatedScroll)) pending = d;
      }
      const want = wheelMode({
        speed,
        travelled,
        elapsed: now - startT,
        swipes: swipes.length + (mode === "follow" && speed >= STEP_V ? 1 : 0),
      });
      if (want === "free") {
        // the user means to travel: hand the wheel back to Lenis, with what this gesture already sent
        const owed = from + held;
        lenis.scrollTo(
          d > 0 ? Math.max(owed, lenis.animatedScroll) : Math.min(owed, lenis.animatedScroll),
          {
            programmatic: false,
            lerp: baseLerp,
          },
        );
        mode = "free";
        fling = true;
        busyUntil = 0;
        playing = null;
        pending = 0;
        lenis.options.lerp = baseLerp;
        return true;
      }
      if (mode === "follow" && want === "step") {
        swipes.push(now);
        pushT = now;
        mode = "step";
        // from where the page is drawn, so a chapter already under way is finished, not skipped
        const next = nextStop(s, lenis.animatedScroll, d);
        if (next !== undefined) {
          pending = 0;
          const moving = Math.abs(lenis.velocity) > 1;
          play(next, "step", playSeconds(next - lenis.animatedScroll, chapter(s)), moving);
        }
      }
      if (mode === "follow") data.deltaY = deltaY * HERO_GAIN;
      else held += deltaY;
      return mode !== "step";
    });

    const settle = () => {
      if (
        touching ||
        pressed ||
        busy() ||
        mode !== "pass" ||
        lenis.isScrolling === "smooth" ||
        performance.now() - lastT < GAP_MS
      ) {
        settleTimer = window.setTimeout(settle, SETTLE_MS);
        return;
      }
      const y = window.scrollY;
      const to = settleStop(stops(), y, anchor, { nudge: window.innerHeight * 0.04, fling });
      fling = false;
      if (to === undefined) anchor = y;
      else play(to, "finish", playSeconds(to - y, chapter(stops())), false);
    };
    const onScroll = () => {
      clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settle, SETTLE_MS);
    };
    const onTouchStart = () => {
      touching = true;
      busyUntil = 0; // a touch stops Lenis' animation; the next settle decides
      playing = null;
      pending = 0;
      mode = "pass";
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
      lenis.options.lerp = baseLerp;
      snapRef.current = null;
      clearTimeout(settleTimer);
      clearTimeout(endTimer);
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
