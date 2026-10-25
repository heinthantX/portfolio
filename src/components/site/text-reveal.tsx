"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Reveal blocks inside a `[data-paras]` region: paragraph-level text, or a whole `[data-block]`
 * (a row, a card) that then moves as one. `data-block="stagger"` keeps the row still and reveals
 * each of its `[data-part]` pieces as that piece scrolls in, so the bottom of a tall card isn't
 * done animating before you reach it. `ScrollWords mode="in"` words inside a block
 * flip in word by word with it. Keep in sync with the `.paras-armed` rules in globals.css.
 */
const BLOCKS =
  "[data-paras] :is([data-block], [data-reveal='headline'], p, li, h2, h3, h4, blockquote, pre, figure, table, img, hr):not([data-words], [data-words] *, [data-block] *, [data-reveal='headline'] *, [data-block='stagger']), [data-paras] [data-block='stagger'] [data-part]";
/** Waits out the page-switch view transition, so above-the-fold text animates where you can see it. */
const AFTER_PAGE_SWITCH = 450;
const STEP = 80;

/** Runs before first paint (layout <head>): hides reveal blocks so they never flash in and out. */
export const ARM_SCRIPT = `(function(){var d=document.documentElement;if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;d.classList.add("paras-armed");setTimeout(function(){if(!window.__paras)d.classList.remove("paras-armed")},4000)})()`;

const HEADLINE = "[data-reveal='headline']";
const EASE = "cubic-bezier(0.2, 0.7, 0.2, 1)";
/** Each block's reveals; their fill-forwards keeps it visible over the CSS that hides it. */
const reveals = new WeakMap<Element, Animation[]>();

const RISE: Keyframe[] = [
  { opacity: 0, translate: "0 22px", filter: "blur(6px)" },
  { opacity: 1, translate: "0 0", filter: "blur(0px)" },
];
/** Same flip as the `word-in` keyframes that page titles use on load. */
const WORD: Keyframe[] = [
  {
    opacity: 0.04,
    filter: "blur(14px)",
    transform: "perspective(30em) translateY(0.9em) rotateX(-75deg) scale(0.9)",
  },
  { opacity: 1, filter: "blur(0px)", transform: "none" },
];

function reveal(el: HTMLElement, delay: number): Animation[] {
  const opts = { easing: EASE, fill: "both" } as const;
  const anims = [
    el.animate(keyframes(el), {
      ...opts,
      duration: el.matches(HEADLINE) ? 900 : 800,
      delay,
    }),
  ];
  for (const words of el.querySelectorAll<HTMLElement>("[data-words='in']")) {
    const w = words.querySelectorAll<HTMLElement>("[data-w]");
    const step = Math.min(45, 1000 / w.length);
    w.forEach((word, i) => {
      anims.push(word.animate(WORD, { ...opts, duration: 700, delay: delay + 150 + i * step }));
    });
  }
  return anims;
}

function keyframes(el: HTMLElement): Keyframe[] {
  if (!el.matches(HEADLINE)) return RISE;
  const to = { opacity: 1, translate: "0 0", filter: "blur(0px)" };
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
}

function cancel(el: Element) {
  for (const a of reveals.get(el) ?? []) a.cancel();
}

export function TextReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains("paras-armed")) return;
    (window as { __paras?: boolean }).__paras = true;

    const start = performance.now();
    // Home replays: a block that drops fully below the viewport (scrolled back up past it) hides
    // again, so it reveals each time you scroll down to it. Blocks above stay shown.
    const replays = pathname === "/";
    const io = new IntersectionObserver(
      (entries) => {
        const wait = Math.max(0, AFTER_PAGE_SWITCH - (performance.now() - start));
        let n = 0;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          if (replays) {
            if (reveals.has(el)) continue;
          } else io.unobserve(el);
          cancel(el);
          reveals.set(el, reveal(el, wait + Math.min(n++, 8) * STEP));
        }
      },
      { rootMargin: "0px 0px -6% 0px" },
    );
    const below = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting || e.boundingClientRect.top < window.innerHeight) continue;
        cancel(e.target);
        reveals.delete(e.target);
      }
    });
    // No DOM writes here: these nodes may not be hydrated yet, and any attribute change is a hydration mismatch.
    const scan = () => {
      for (const el of document.querySelectorAll<HTMLElement>(BLOCKS)) {
        if (reveals.has(el)) continue;
        io.observe(el);
        if (replays) below.observe(el);
      }
    };
    // Next keeps visited pages mounted but hidden; coming back shows the same nodes, so replay
    // the page now on screen. Next frame, once the returning page is visible again.
    const replay = requestAnimationFrame(() => {
      for (const el of document.querySelectorAll<HTMLElement>(BLOCKS)) {
        if (!reveals.has(el) || !el.checkVisibility()) continue;
        cancel(el);
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
      below.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}
