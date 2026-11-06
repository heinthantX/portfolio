"use client";

import { type RefObject, useEffect, useRef } from "react";
import { CHAPTERS, formationCentre } from "./timeline";

/**
 * Hero guide that teaches "scroll down" and "the rail is clickable". It plays on each hero chapter
 * the reader rests on. Three beats from one start: the formation drips (shader, driven by
 * `dripRef`), a courier packet flies from it to the next rail tick and lights its label (on the
 * last chapter, which has no next tick, it falls to the bottom of the stage), then the page peeks
 * into the next morph and springs back.
 * Quiet time is the time since the latest of: the last input, the page settling on this chapter,
 * the last guide start and the canvas becoming ready. The guide starts once it reaches
 * GUIDE_DELAY_MS (nothing has played yet this tab session) or GUIDE_EVERY_MS (something has,
 * a reload included). Beat timings are ms from start.
 */
export const GUIDE_KEY = "hero-guide-at"; // last start, ms since epoch (sessionStorage)
export const GUIDE_DELAY_MS = 4500; // first play; also clears the 2.8s particle intro and the text reveal
export const GUIDE_EVERY_MS = 15_000; // every later play
const CHECK_MS = 250; // also how precisely the settle time is known
const DRIP_MS = 1600; // drip runs 0 -> 1 over this, then the points grow back (1 -> 1.5)
const COURIER_AT = 900;
const FLIGHT_MS = 1100;
const PEEK_AFTER_LAND_MS = 100;
const HINT_MS = 1600;
const DROP_PX = 120;
const DROP_MS = 600;
const PACKET_PX = 6;
const LAST_DROP_Y = 0.8; // the last chapter's packet falls from this share of the stage height
const INPUTS = ["wheel", "touchstart", "keydown", "pointerdown"] as const;

export interface GuideState {
  /** the page rests on one of the hero's chapter stops */
  atStop: boolean;
  /** ms since the latest input, settle, guide start or canvas-ready (see `quietMs`) */
  quietMs: number;
  /** the guide has already played this tab session */
  played: boolean;
  reducedMotion: boolean;
  /** the tab is visible */
  visible: boolean;
  /** WebGL fallback: no canvas, no rail */
  fallback: boolean;
}

/** Quiet time the reader must give before the guide plays. */
export const guideWait = (played: boolean) => (played ? GUIDE_EVERY_MS : GUIDE_DELAY_MS);

/** ms since the latest of the given marks (epoch ms). */
export const quietMs = (now: number, marks: number[]) => now - Math.max(...marks);

export function shouldStartGuide(s: GuideState): boolean {
  return (
    s.atStop && s.quietMs >= guideWait(s.played) && !s.reducedMotion && s.visible && !s.fallback
  );
}

export interface Pt {
  x: number;
  y: number;
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * The courier's curve, sampled as `n + 1` points from `from` to `to` (ease in-out along a cubic).
 * The curve bows to one side, upward when the line is not horizontal, so it reads as a thrown
 * packet rather than a ruler line. Works for a rail on the right (desktop) or at the bottom.
 */
export function courierPoints(from: Pt, to: Pt, n: number): Pt[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy) || 1;
  let nx = -dy / dist;
  let ny = dx / dist;
  if (ny > 0 || (ny === 0 && nx < 0)) {
    nx = -nx;
    ny = -ny;
  }
  const bow = dist * 0.22;
  const c1 = { x: from.x + dx * 0.33 + nx * bow, y: from.y + dy * 0.33 + ny * bow };
  const c2 = { x: from.x + dx * 0.66 + nx * bow * 0.6, y: from.y + dy * 0.66 + ny * bow * 0.6 };
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = easeInOut(i / n);
    const u = 1 - t;
    const a = u * u * u;
    const b = 3 * u * u * t;
    const c = 3 * u * t * t;
    const d = t * t * t;
    out.push({
      x: a * from.x + b * c1.x + c * c2.x + d * to.x,
      y: a * from.y + b * c1.y + c * c2.y + d * to.y,
    });
  }
  // the end of the curve is the target exactly, whatever float error the sum carries
  out[0] = { ...from };
  out[n] = { ...to };
  return out;
}

const readLast = () => {
  try {
    const n = Number(sessionStorage.getItem(GUIDE_KEY));
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
};
const markLast = () => {
  try {
    sessionStorage.setItem(GUIDE_KEY, String(Date.now()));
  } catch {}
};

export interface HeroGuideOptions {
  /** the canvas gate is ready (the points are drawn) */
  ready: boolean;
  fallback: boolean;
  /** 0 off, 0..1 drip, 1..1.5 grow back; read by the shader through the home stream */
  dripRef: RefObject<number>;
  stageRef: RefObject<HTMLElement | null>;
  /** rail ticks: the guide lights the next chapter's tick and flies the courier to it */
  railRefs: RefObject<(HTMLButtonElement | null)[]>;
  /** text blocks by chapter; the active block's top anchors the courier on mobile */
  blockRefs: RefObject<(HTMLDivElement | null)[]>;
  packetRef: RefObject<HTMLElement | null>;
  /** from useChapterSnap: the chapter the page rests on, or -1 */
  resting: () => number;
  /** from useChapterSnap: nudges the page into chapter i's next morph and back */
  peek: (i: number) => boolean;
}

export function useHeroGuide(o: HeroGuideOptions) {
  const { ready, fallback, dripRef, stageRef, railRefs, blockRefs, packetRef } = o;
  const peekRef = useRef(o.peek);
  peekRef.current = o.peek;
  const restingRef = useRef(o.resting);
  restingRef.current = o.resting;
  const lastInput = useRef(0); // Date.now() of the last input
  const stopRef = useRef<(() => void) | null>(null);

  // Any input resets the idle clock and stops a guide that is playing.
  useEffect(() => {
    const onInput = () => {
      lastInput.current = Date.now();
      stopRef.current?.();
    };
    for (const type of INPUTS)
      window.addEventListener(type, onInput, { passive: true, capture: true });
    return () => {
      for (const type of INPUTS) window.removeEventListener(type, onInput, { capture: true });
    };
  }, []);

  useEffect(() => {
    if (!ready || fallback) return;
    const timers = new Set<number>();
    const anims = new Set<Animation>();
    let raf = 0;
    let running = false;
    const readyAt = Date.now();
    let restedOn = -2; // chapter seen at the last check; a change restarts the wait
    let settledAt = readyAt;
    let startedAt = 0; // this page's last start, in case sessionStorage is blocked
    let hinted: HTMLElement | null = null;
    let tickIndex = 0; // rail tick the current run lights: the next chapter's

    const after = (ms: number, fn: () => void) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        if (running) fn();
      }, ms);
      timers.add(id);
    };
    const setHint = (on: boolean) => {
      const tick = railRefs.current?.[tickIndex];
      if (on && tick) {
        tick.dataset.hint = "true";
        hinted = tick;
      } else if (hinted) {
        delete hinted.dataset.hint;
        hinted = null;
      }
    };
    const stop = () => {
      if (!running) return;
      running = false;
      for (const id of timers) clearTimeout(id);
      timers.clear();
      cancelAnimationFrame(raf);
      for (const a of anims) a.cancel();
      anims.clear();
      dripRef.current = 0;
      setHint(false);
      if (stopRef.current === stop) stopRef.current = null;
    };

    const drip = () => {
      const t0 = performance.now();
      const frame = (now: number) => {
        const u = Math.min(1.5, Math.max(0, (now - t0) / DRIP_MS));
        dripRef.current = u;
        raf = u < 1.5 ? requestAnimationFrame(frame) : 0;
        if (u >= 1.5) dripRef.current = 0;
      };
      raf = requestAnimationFrame(frame);
    };

    /** Fly the packet from chapter `chapter`'s formation to the next tick; the hint, drop and peek follow. */
    const courier = (chapter: number) => {
      const stage = stageRef.current;
      const packet = packetRef.current;
      if (!stage || !packet?.animate) return;
      const last = chapter === CHAPTERS - 1;
      const line = last ? null : railRefs.current?.[chapter + 1]?.lastElementChild;
      if (!last && !line) return;
      const sr = stage.getBoundingClientRect();
      const mobile = sr.width < 768;
      // the formation's centre on screen; on phones the top of the text block, just under it
      const centre = formationCentre(chapter, sr.width / sr.height, mobile);
      const block = mobile ? blockRefs.current?.[chapter]?.getBoundingClientRect() : undefined;
      const from = block
        ? { x: sr.width / 2, y: block.top - sr.top }
        : { x: centre.x * sr.width, y: centre.y * sr.height };
      let to: Pt;
      if (line) {
        const lr = line.getBoundingClientRect();
        to = { x: lr.left + lr.width / 2 - sr.left, y: lr.top + lr.height / 2 - sr.top };
      } else {
        to = { x: sr.width / 2, y: sr.height * LAST_DROP_Y }; // "keep scrolling": no next tick
      }
      const place = (p: Pt) => `translate3d(${p.x - PACKET_PX / 2}px, ${p.y - PACKET_PX / 2}px, 0)`;
      const path = courierPoints(from, to, 28);
      const flight = packet.animate(
        path.map((p, i) => ({
          transform: place(p),
          opacity: Math.min(1, (i / path.length) * 8),
          offset: i / (path.length - 1),
        })),
        { duration: FLIGHT_MS, easing: "linear", fill: "forwards" },
      );
      anims.add(flight);
      flight.onfinish = () => {
        if (!running) return;
        if (!last) setHint(true);
        const drop = packet.animate(
          [
            { transform: place(to), opacity: 1 },
            { transform: place({ x: to.x, y: to.y + DROP_PX }), opacity: 0 },
          ],
          { duration: DROP_MS, easing: "ease-in", fill: "forwards" },
        );
        anims.add(drop);
        after(PEEK_AFTER_LAND_MS, () => peekRef.current?.(chapter));
        after(HINT_MS, stop);
      };
    };

    const begin = () => {
      const chapter = restingRef.current();
      if (chapter !== restedOn) {
        restedOn = chapter;
        settledAt = Date.now();
      }
      if (running) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const now = Date.now();
      const last = Math.max(readLast(), startedAt);
      const state: GuideState = {
        atStop: chapter >= 0,
        quietMs: quietMs(now, [lastInput.current, settledAt, last, readyAt]),
        played: last > 0,
        reducedMotion: reduced,
        visible: document.visibilityState === "visible",
        fallback,
      };
      const full = shouldStartGuide(state);
      // reduced motion: no courier, drip or peek, only the lit label (same pace)
      const flash = !full && reduced && shouldStartGuide({ ...state, reducedMotion: false });
      if (!full && !flash) return;
      startedAt = now;
      markLast();
      running = true;
      stopRef.current = stop;
      tickIndex = chapter + 1; // none past the last chapter
      if (flash) {
        setHint(true);
        after(HINT_MS, stop);
        return;
      }
      drip();
      after(COURIER_AT, () => courier(chapter));
    };

    const onHidden = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", onHidden);
    const check = window.setInterval(begin, CHECK_MS);
    return () => {
      clearInterval(check);
      document.removeEventListener("visibilitychange", onHidden);
      stop();
    };
  }, [ready, fallback, dripRef, stageRef, railRefs, blockRefs, packetRef]);
}
