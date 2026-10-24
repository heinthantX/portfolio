"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { type HeroLink, useHero } from "./store";

const StreamCanvas = dynamic(() => import("./StreamCanvas"), { ssr: false });

/** Leaving the home page: the stream fades out over this long, then the canvas unmounts. */
const FADE_MS = 600;

/** Hold the frame while the tab is hidden or a modal (command palette, dialogs) locks the page. */
function usePaused() {
  const [hidden, setHidden] = useState(false);
  const [modal, setModal] = useState(false);
  useEffect(() => {
    const vis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", vis);
    const body = document.body;
    const sync = () => setModal(body.hasAttribute("data-scroll-locked"));
    const mo = new MutationObserver(sync);
    mo.observe(body, { attributes: true, attributeFilter: ["data-scroll-locked"] });
    return () => {
      document.removeEventListener("visibilitychange", vis);
      mo.disconnect();
    };
  }, []);
  return hidden || modal;
}

/**
 * The home page's one canvas, fixed behind the page. The hero registers on mount (only when its
 * own gate allows a canvas: WebGL, motion allowed, idle reached) and drives its chapters through
 * it; after "shipped" the same points become the stream that runs down the rest of the page.
 * Elsewhere this renders nothing and the per-page ambient background shows; leaving home freezes
 * the last frame and fades it out instead of popping.
 */
export function HomeStream() {
  const hero = useHero();
  const paused = usePaused();
  const [kept, setKept] = useState<HeroLink | null>(null);

  useEffect(() => {
    if (hero) {
      setKept(hero);
      return;
    }
    const id = window.setTimeout(() => setKept(null), FADE_MS);
    return () => clearTimeout(id);
  }, [hero]);

  const link = hero ?? kept;
  if (!link) return null;
  return (
    <div
      aria-hidden="true"
      data-home-stream
      data-hero={hero ? "true" : "false"}
      style={{ opacity: hero ? 1 : 0, transitionDuration: `${FADE_MS}ms` }}
      className="no-print pointer-events-none fixed inset-x-0 top-0 -z-10 h-[100lvh] transition-opacity ease-out"
    >
      <StreamCanvas
        hero={hero}
        count={link.count}
        frameloop={!hero || paused ? "never" : "always"}
      />
    </div>
  );
}
