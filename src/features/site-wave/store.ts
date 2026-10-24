"use client";

import { type RefObject, useSyncExternalStore } from "react";
import type { TextMask } from "@/features/signal-scene/SignalPoints";

/** What the hero shares with the site canvas. Per-frame values stay in the refs. */
export interface HeroLink {
  progressRef: RefObject<number>;
  maskRef: RefObject<TextMask>;
  stageRef: RefObject<HTMLElement | null>;
}

let hero: HeroLink | null = null;
const subs = new Set<() => void>();
const emit = () => {
  for (const fn of subs) fn();
};

/** The hero mounted: the site canvas draws its shapes. Returns the unregister call. */
export function registerHero(link: HeroLink) {
  hero = link;
  emit();
  return () => {
    if (hero !== link) return;
    hero = null;
    emit();
  };
}

const subscribe = (fn: () => void) => {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
};
const get = () => hero;

/** The mounted hero, or null (pure flow). Re-renders on mount and unmount only. */
export const useHero = () => useSyncExternalStore(subscribe, get, () => null);
