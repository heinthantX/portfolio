"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * One shared reveal for the whole site: any element with `data-reveal` fades in and rises 16px,
 * once, staggered 60ms per batch. Reduced motion: no transform, content is simply visible.
 * Content is visible without JS; the hidden state is only applied once this runs.
 */
export function RevealController() {
  const pathname = usePathname();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const els = gsap.utils.toArray<HTMLElement>("[data-reveal]");
        gsap.set(els, { autoAlpha: 0, y: 16 });
        ScrollTrigger.batch(els, {
          start: "top 88%",
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, {
              autoAlpha: 1,
              y: 0,
              duration: 0.45,
              ease: "power2.out",
              stagger: 0.06,
              overwrite: true,
            }),
        });
        // Accent lines that draw in (pipeline, frames, dividers)
        for (const line of gsap.utils.toArray<HTMLElement>("[data-draw]")) {
          gsap.fromTo(
            line,
            {
              scaleY: line.dataset.draw === "x" ? 1 : 0,
              scaleX: line.dataset.draw === "x" ? 0 : 1,
            },
            {
              scaleX: 1,
              scaleY: 1,
              ease: "none",
              scrollTrigger: { trigger: line, start: "top 80%", end: "bottom 60%", scrub: true },
            },
          );
        }
      });
      return () => mm.revert();
    },
    { dependencies: [pathname], revertOnUpdate: true },
  );

  return null;
}
