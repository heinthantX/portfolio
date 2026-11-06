"use client";

import { type RefObject, useEffect, useRef } from "react";

/**
 * Hero guide that teaches "scroll down" and "the rail is clickable". Three beats from
 * one start: the name drips (shader, driven by `dripRef`), a courier packet flies to rail tick 02
 * and lights its label, then the page peeks into the first morph and springs back.
 * The first play of a tab session comes once the reader idles GUIDE_DELAY_MS on the first section;
 * later plays (a reload included) wait GUIDE_EVERY_MS from the last start or the load, whichever
 * is later, and still need the idle time. Timings are ms from start.
 */
export const GUIDE_KEY = "hero-guide-at"; // last start, ms since epoch (sessionStorage)
export const GUIDE_DELAY_MS = 4500; // idle time; also clears the 2.8s particle intro and the text reveal
export const GUIDE_EVERY_MS = 15_000;
const CHECK_MS = 1000;
const DRIP_MS = 1600; // drip runs 0 -> 1 over this, then the points grow back (1 -> 1.5)
const COURIER_AT = 900;
const FLIGHT_MS = 1100;
const PEEK_AFTER_LAND_MS = 100;
const HINT_MS = 1600;
const DROP_PX = 120;
const DROP_MS = 600;
const TICK = 1; // rail index of "02 Approach"
const PACKET_PX = 6;
const INPUTS = ["wheel", "touchstart", "keydown", "pointerdown"] as const;

export interface GuideState {
  /** page is at the hero's first stop */
  atTop: boolean;
  /** ms since the last wheel, touch, key or pointer input (or since the canvas was ready) */
  idleMs: number;
  reducedMotion: boolean;
  /** ms since the last start or the load, whichever is later; Infinity before the first play */
  sinceLastMs: number;
  /** the tab is visible */
  visible: boolean;
  /** WebGL fallback: no canvas, no rail */
  fallback: boolean;
}

/** Before the first play of the session (no stored start) the wait is over at once. */
export const sinceLast = (last: number, loadedAt: number, now: number) =>
  last > 0 ? now - Math.max(last, loadedAt) : Number.POSITIVE_INFINITY;

export function shouldStartGuide(s: GuideState): boolean {
  return (
    s.atTop &&
    s.idleMs >= GUIDE_DELAY_MS &&
    s.sinceLastMs >= GUIDE_EVERY_MS &&
    !s.reducedMotion &&
    s.visible &&
    !s.fallback
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
  /** rail ticks: the guide lights index 1 and flies the courier to it */
  railRefs: RefObject<(HTMLButtonElement | null)[]>;
  /** text blocks; index 0 is the intro, whose top anchors the courier on mobile */
  blockRefs: RefObject<(HTMLDivElement | null)[]>;
  packetRef: RefObject<HTMLElement | null>;
  /** from useChapterSnap: nudges the page into the first morph and back */
  peek: () => boolean;
}

export function useHeroGuide(o: HeroGuideOptions) {
  const { ready, fallback, dripRef, stageRef, railRefs, blockRefs, packetRef } = o;
  const peekRef = useRef(o.peek);
  peekRef.current = o.peek;
  const lastInput = useRef(0); // performance.now() of the last input
  const stopRef = useRef<(() => void) | null>(null);

  // Any input resets the idle clock and stops a guide that is playing.
  useEffect(() => {
    const onInput = () => {
      lastInput.current = performance.now();
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
    const readyAt = performance.now();
    const loadedAt = Date.now();
    let hinted: HTMLElement | null = null;

    const after = (ms: number, fn: () => void) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        if (running) fn();
      }, ms);
      timers.add(id);
    };
    const setHint = (on: boolean) => {
      const tick = railRefs.current?.[TICK];
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

    /** Fly the packet from the name to tick 02; the hint, the drop and the peek follow. */
    const courier = () => {
      const stage = stageRef.current;
      const packet = packetRef.current;
      const line = railRefs.current?.[TICK]?.lastElementChild;
      if (!stage || !packet || !line || !packet.animate) return;
      const sr = stage.getBoundingClientRect();
      const lr = line.getBoundingClientRect();
      const to = { x: lr.left + lr.width / 2 - sr.left, y: lr.top + lr.height / 2 - sr.top };
      const intro = blockRefs.current?.[0]?.getBoundingClientRect();
      const mobile = !window.matchMedia("(min-width: 768px)").matches;
      const from =
        mobile && intro
          ? { x: sr.width / 2, y: intro.top - sr.top }
          : { x: sr.width / 2, y: sr.height * 0.42 };
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
        setHint(true);
        const drop = packet.animate(
          [
            { transform: place(to), opacity: 1 },
            { transform: place({ x: to.x, y: to.y + DROP_PX }), opacity: 0 },
          ],
          { duration: DROP_MS, easing: "ease-in", fill: "forwards" },
        );
        anims.add(drop);
        after(PEEK_AFTER_LAND_MS, () => peekRef.current?.());
        after(HINT_MS, stop);
      };
    };

    const begin = () => {
      if (running) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const state: GuideState = {
        atTop: window.scrollY < 4,
        idleMs: performance.now() - Math.max(lastInput.current, readyAt),
        reducedMotion: reduced,
        sinceLastMs: sinceLast(readLast(), loadedAt, Date.now()),
        visible: document.visibilityState === "visible",
        fallback,
      };
      const full = shouldStartGuide(state);
      // reduced motion: no courier, drip or peek, only the lit label (same pace)
      const flash = !full && reduced && shouldStartGuide({ ...state, reducedMotion: false });
      if (!full && !flash) return;
      markLast();
      running = true;
      stopRef.current = stop;
      if (flash) {
        setHint(true);
        after(HINT_MS, stop);
        return;
      }
      drip();
      after(COURIER_AT, courier);
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
