"use client";

import type Lenis from "lenis";
import { type RefObject, useCallback, useEffect, useMemo, useRef } from "react";
import { interceptWheel } from "@/components/site/wheel";
import { CHAPTERS, chapterProgress, PEEK_P } from "./timeline";

const WINDOW_MS = 100;
/** A swipe still going at full speed this long after it counted counts again. */
const SUSTAIN_MS = 400;
/** Quiet time that ends a wheel gesture; trackpad inertia keeps events far closer than this. */
const GAP_MS = 160;
/**
 * A slow scroll that stops holds its place this long, so resting fingers pause the morph mid-way.
 * Browsers can't see fingers on a trackpad, so a still hold and a still release look the same.
 */
const HOLD_MS = 1200;
/** This many shrinking deltas in a row is trackpad inertia: the fingers let go, finish at once. */
const RELEASE_RUN = 8;
/** Quiet time after any other scroll (touch, keys, scrollbar, a fling) before settling. */
const SETTLE_MS = 140;
/** A positive number of seconds from an env var, else `fallback`. */
const seconds = (raw: string | undefined, fallback: number) => {
  const n = Number(raw);
  return raw && Number.isFinite(n) && n > 0 ? n : fallback;
};
/**
 * One full chapter plays in STEP_S, which is also the scroll speed cap: a faster wheel still plays
 * only the next chapter at this pace. Shorter remainders keep the same pace, never under MIN_S.
 * Tunable via NEXT_PUBLIC_CHAPTER_STEP_S / NEXT_PUBLIC_CHAPTER_MIN_S (inlined at build time).
 */
const STEP_S = seconds(process.env.NEXT_PUBLIC_CHAPTER_STEP_S, 1);
const MIN_S = Math.min(seconds(process.env.NEXT_PUBLIC_CHAPTER_MIN_S, 0.4), STEP_S);
/** Inside the hero a slow wheel scrubs a little further than it moves, and one event moves at most a notch. */
const HERO_GAIN = 1.15;
const MAX_EVENT_DELTA = 120;
/** The hero guide's peek: out to PEEK_P, then back to the first stop. */
const PEEK_OUT_S = 0.6;
const PEEK_BACK_S = 0.8;
const EPS = 2;

export type WheelMode = "follow" | "step";

/** Moves from the first frame, so a swipe answers at once, then eases into the chapter. */
const easeSwipe = (t: number) => 1 - (1 - t) ** 2;
/** Starts faster still, so taking over a moving scroll doesn't stall it. */
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** The next resting scroll position past `from` in direction `dir`, if any. */
export function nextStop(stops: number[], from: number, dir: number): number | undefined {
  return dir > 0 ? stops.find((y) => y > from + EPS) : stops.findLast((y) => y < from - EPS);
}

/**
 * How a wheel gesture should drive the hero. Slower than one chapter per STEP_S (counting
 * HERO_GAIN) it scrubs; faster, it plays the next chapter at that pace instead.
 */
export function wheelMode({
  speed,
  chapterPx,
}: {
  /** raw px/s over the last WINDOW_MS */
  speed: number;
  /** average px between two stops */
  chapterPx: number;
}): WheelMode {
  return speed * HERO_GAIN * STEP_S > chapterPx ? "step" : "follow";
}

/** Seconds to cover `distance` at one chapter per STEP_S. */
export function playSeconds(distance: number, chapter: number) {
  return Math.min(STEP_S, Math.max(MIN_S, (STEP_S * Math.abs(distance)) / Math.max(chapter, 1)));
}

/**
 * Where a scroll that stopped at `y` should come to rest. Outside the hero (or already resting):
 * nowhere. A move past `nudge` from the chapter it started on finishes the chapter in the
 * direction it was going; a smaller one springs back.
 */
export function settleStop(
  stops: number[],
  y: number,
  anchor: number,
  { nudge }: { nudge: number },
): number | undefined {
  if (y < stops[0] - EPS || y > stops[stops.length - 1] + EPS) return undefined;
  if (stops.some((s) => Math.abs(s - y) <= EPS)) return undefined;
  const nearest = stops.reduce((b, s) => (Math.abs(s - y) < Math.abs(b - y) ? s : b), stops[0]);
  const moved = y - anchor;
  if (Math.abs(moved) <= nudge) return nearest;
  return nextStop(stops, y, moved) ?? nearest;
}

/** Wheel delta in px, before the per-event clamp, so speed reads true. */
const rawDelta = (e: Event) => {
  const w = e as WheelEvent;
  return Math.abs(w.deltaY) * (w.deltaMode === 1 ? 16 : w.deltaMode === 2 ? window.innerHeight : 1);
};

/**
 * Page-at-a-time scrolling through the hero's chapters, so each morph plays out in full.
 * A slow wheel scrubs and finishes the chapter when the user stops; a faster one plays only the
 * next chapter at a fixed pace (more pushing meanwhile queues one more). Touch, keys and the
 * scrollbar settle the same way once they stop.
 * Returns `goTo(chapter)` for the rail and jump links, and `peek()`, which nudges the first morph
 * open and back to show the hero scrolls (false if it didn't start).
 */
export function useChapterSnap(
  sectionRef: RefObject<HTMLElement | null>,
  lenis: Lenis | undefined,
  enabled: boolean,
) {
  const snapRef = useRef<(y: number) => void>(null);
  const peekRef = useRef<() => boolean>(null);

  const stops = useCallback(() => {
    const s = sectionRef.current;
    if (!s) return [];
    const top = s.getBoundingClientRect().top + window.scrollY;
    const range = s.offsetHeight - window.innerHeight;
    return Array.from({ length: CHAPTERS }, (_, i) => Math.round(top + range * chapterProgress(i)));
  }, [sectionRef]);
  const peekY = useCallback(() => {
    const s = sectionRef.current;
    if (!s) return undefined;
    const top = s.getBoundingClientRect().top + window.scrollY;
    return Math.round(top + (s.offsetHeight - window.innerHeight) * PEEK_P);
  }, [sectionRef]);

  useEffect(() => {
    if (!enabled || !lenis) return;
    let target = window.scrollY;
    let anchor = window.scrollY;
    // what is animating and until when (Lenis drops onComplete when interrupted)
    let playing: "step" | "finish" | null = null;
    let busyUntil = 0;
    let pending = 0; // one queued chapter: +1 / -1
    let mode: WheelMode | "pass" = "pass";
    let dir = 0;
    let lastT = 0;
    let peak = 0;
    let trough = 0;
    let prevAbs = 0;
    let fading = 0; // shrinking deltas in a row
    let pushT = 0; // when this gesture last counted as a swipe
    let samples: [number, number][] = [];
    let touching = false;
    let pressed = false;
    let settleTimer = 0;
    let endTimer = 0;

    const busy = () => performance.now() < busyUntil;
    const chapter = (s: number[]) => (s[s.length - 1] - s[0]) / Math.max(s.length - 1, 1);

    const play = (
      y: number,
      kind: "step" | "finish",
      seconds: number,
      moving: boolean,
      then?: () => void,
    ) => {
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
          if (then) return then();
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

    // a wheel mid-glide stops it and drops the return leg (Lenis drops onComplete when interrupted)
    const peek = () => {
      const s = stops();
      const y = peekY();
      if (y === undefined || !s.length || busy() || touching || pressed) return false;
      if (Math.abs(window.scrollY - s[0]) > EPS || y <= s[0] + EPS) return false;
      play(y, "finish", PEEK_OUT_S, true, () => play(s[0], "finish", PEEK_BACK_S, false));
      return true;
    };
    peekRef.current = peek;

    // a slow gesture ended: after a hold (or at once on release), finish the chapter it was heading into
    const endGesture = () => {
      if (mode === "follow" && fading < RELEASE_RUN) {
        const wait = HOLD_MS - (performance.now() - lastT);
        if (wait > 0) {
          endTimer = window.setTimeout(endGesture, wait);
          return;
        }
      }
      const was = mode;
      mode = "pass";
      if (was !== "follow" || touching || pressed) return;
      const y = lenis.targetScroll;
      const to = settleStop(stops(), y, anchor, { nudge: window.innerHeight * 0.04 });
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
      fading = !fresh && abs < prevAbs ? fading + 1 : 0;
      prevAbs = abs;
      samples = samples.filter(([t]) => now - t < WINDOW_MS);
      samples.push([now, raw]);
      clearTimeout(endTimer);
      endTimer = window.setTimeout(endGesture, GAP_MS);

      if (fresh) {
        if (!inside) mode = "pass";
        else if (busy() && playing === "step") {
          // a chapter is playing: queue one more the same way, or turn straight back
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
      if (mode === "pass") return true;

      const speed = (samples.reduce((sum, [, v]) => sum + v, 0) * 1000) / WINDOW_MS;
      const want = wheelMode({ speed, chapterPx: chapter(s) });
      // from where the page is drawn, so a chapter already under way is finished, not skipped
      const next = nextStop(s, lenis.animatedScroll, d);
      if (mode === "step" && next === undefined && !busy()) mode = "follow"; // end of the hero: scroll on
      if (mode === "step" && want === "step" && now - pushT >= SUSTAIN_MS && abs >= peak * 0.7) {
        // still pushing hard (a spinning mouse wheel): each stretch counts as another swipe.
        // A decaying trackpad inertia tail is one flick, so it never queues a second chapter.
        pushT = now;
        if (playing === "step" && d === Math.sign(target - lenis.animatedScroll)) pending = d;
      }
      if (mode === "follow" && want === "step" && next !== undefined) {
        pushT = now;
        mode = "step";
        pending = 0;
        const moving = Math.abs(lenis.velocity) > 1;
        play(next, "step", playSeconds(next - lenis.animatedScroll, chapter(s)), moving);
      }
      if (mode === "follow")
        data.deltaY = Math.max(-MAX_EVENT_DELTA, Math.min(MAX_EVENT_DELTA, deltaY)) * HERO_GAIN;
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
      const to = settleStop(stops(), y, anchor, { nudge: window.innerHeight * 0.04 });
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
    // touch pointers end in pointercancel once the browser scrolls; `touching` covers them
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch") pressed = true;
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
    window.addEventListener("pointercancel", onUp, opts);
    return () => {
      release();
      snapRef.current = null;
      peekRef.current = null;
      clearTimeout(settleTimer);
      clearTimeout(endTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [enabled, lenis, stops, peekY]);

  const goTo = useCallback(
    (chapter: number) => {
      const y = stops()[chapter];
      if (y === undefined) return;
      if (snapRef.current) snapRef.current(y);
      else window.scrollTo({ top: y, behavior: "smooth" });
    },
    [stops],
  );
  const peek = useCallback(() => peekRef.current?.() ?? false, []);
  return useMemo(() => ({ goTo, peek }), [goTo, peek]);
}
