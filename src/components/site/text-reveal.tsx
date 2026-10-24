"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Reveal blocks inside a `[data-paras]` region: paragraph-level text, or a whole `[data-block]`
 * (a row, a card) that then moves as one. Keep in sync with the `.paras-armed` rule in globals.css.
 */
const BLOCKS =
  "[data-paras] :is([data-block], [data-reveal='headline'], p, li, h2, h3, h4, blockquote, pre, figure, table, img, hr):not([data-words], [data-words] *, [data-block] *, [data-reveal='headline'] *)";
/** Waits out the page-switch view transition, so above-the-fold text animates where you can see it. */
const AFTER_PAGE_SWITCH = 450;
const STEP = 80;

/** Runs before first paint (layout <head>): hides reveal blocks so they never flash in and out. */
export const ARM_SCRIPT = `(function(){var d=document.documentElement;if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;d.classList.add("paras-armed");setTimeout(function(){if(!window.__paras)d.classList.remove("paras-armed")},4000)})()`;

const HEADLINE = "[data-reveal='headline']";
const EASE = "cubic-bezier(0.2, 0.7, 0.2, 1)";
/** Each block's reveal; its fill-forwards keeps it visible over the CSS that hides it. */
const reveals = new WeakMap<Element, Animation>();

function keyframes(el: HTMLElement): Keyframe[] {
  const to = { opacity: 1, translate: "0 0", filter: "blur(0px)" };
  if (el.matches(HEADLINE))
    return [
      {
        opacity: 0,
        translate: "0 0.9em",
        filter: "blur(16px)",
        scale: "0.92",
        letterSpacing: "0.06em",
      },
      { ...to, scale: "1", letterSpacing: "normal" },
    ];
  const from = el.dataset.block === "slide" ? "-48px 0" : "0 22px";
  return [{ opacity: 0, translate: from, filter: "blur(6px)" }, to];
}

export function TextReveal() {
  const pathname = usePathname();

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-scan the new page on every route change
  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains("paras-armed")) return;
    (window as { __paras?: boolean }).__paras = true;

    const start = performance.now();
    const io = new IntersectionObserver(
      (entries) => {
        const wait = Math.max(0, AFTER_PAGE_SWITCH - (performance.now() - start));
        let n = 0;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          io.unobserve(el);
          reveals.get(el)?.cancel();
          reveals.set(
            el,
            el.animate(keyframes(el), {
              duration: el.matches(HEADLINE) ? 900 : 800,
              delay: wait + Math.min(n++, 8) * STEP,
              easing: EASE,
              fill: "both",
            }),
          );
        }
      },
      { rootMargin: "0px 0px -6% 0px" },
    );
    // No DOM writes here: these nodes may not be hydrated yet, and any attribute change is a hydration mismatch.
    const scan = () => {
      for (const el of document.querySelectorAll<HTMLElement>(BLOCKS)) {
        if (!reveals.has(el)) io.observe(el);
      }
    };
    // Next keeps visited pages mounted but hidden; coming back shows the same nodes, so replay
    // the page now on screen. Next frame, once the returning page is visible again.
    const replay = requestAnimationFrame(() => {
      for (const el of document.querySelectorAll<HTMLElement>(BLOCKS)) {
        if (!reveals.has(el) || !el.checkVisibility()) continue;
        reveals.get(el)?.cancel();
        reveals.delete(el);
      }
      scan();
    });
    // blocks that mount later (work filter, suspense) still get revealed instead of staying hidden
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(replay);
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}
