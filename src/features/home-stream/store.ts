"use client";

import { type RefObject, useSyncExternalStore } from "react";
import type { TextMask } from "@/features/signal-scene/SignalPoints";

/** What the hero shares with the home stream canvas. Per-frame values stay in the refs. */
export interface HeroLink {
  progressRef: RefObject<number>;
  maskRef: RefObject<TextMask>;
  stageRef: RefObject<HTMLElement | null>;
  /** point count the hero's gate picked for this device */
  count: number;
}

let hero: HeroLink | null = null;
const subs = new Set<() => void>();
const emit = () => {
  for (const fn of subs) fn();
};

/** The hero is live on the home page: the stream canvas draws it. Returns the unregister call. */
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

/** The live hero, or null. Re-renders on register and unregister only. */
export const useHero = () => useSyncExternalStore(subscribe, get, () => null);
