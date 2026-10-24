"use client";

import { cn } from "cn";
import Image from "next/image";
import * as React from "react";
import { profile } from "@/content/profile";
import { Sheet } from "./sheet";

type Capability = (typeof profile.capabilities)[number];

interface WhatIDoProps {
  index?: string;
  total?: number;
}

export function WhatIDo({ index = "02", total = 8 }: WhatIDoProps) {
  const [activeCap, setActiveCap] = React.useState<Capability | null>(null);
  const [expandedMobileId, setExpandedMobileId] = React.useState<string | null>(null);
  const [isDesktopFine, setIsDesktopFine] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  const listRef = React.useRef<HTMLOListElement>(null);
  const previewRef = React.useRef<HTMLDivElement>(null);
  const targetPos = React.useRef({ x: 0, y: 0 });
  const currentPos = React.useRef({ x: 0, y: 0 });
  const rafId = React.useRef<number | null>(null);

  React.useEffect(() => {
    const pointerQuery = window.matchMedia("(pointer: fine) and (min-width: 1024px)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    setIsDesktopFine(pointerQuery.matches);
    setReducedMotion(motionQuery.matches);

    const updatePointer = (e: MediaQueryListEvent) => setIsDesktopFine(e.matches);
    const updateMotion = (e: MediaQueryListEvent) => setReducedMotion(e.matches);

    pointerQuery.addEventListener("change", updatePointer);
    motionQuery.addEventListener("change", updateMotion);

    return () => {
      pointerQuery.removeEventListener("change", updatePointer);
      motionQuery.removeEventListener("change", updateMotion);
    };
  }, []);

  // Spring the preview towards the pointer; the loop runs only until it settles.
  const loop = React.useCallback(() => {
    const dx = targetPos.current.x - currentPos.current.x;
    const dy = targetPos.current.y - currentPos.current.y;
    currentPos.current.x += dx * 0.18;
    currentPos.current.y += dy * 0.18;
    if (previewRef.current) {
      previewRef.current.style.transform = `translate3d(${currentPos.current.x}px, ${currentPos.current.y}px, 0)`;
    }
    rafId.current = Math.abs(dx) + Math.abs(dy) > 0.2 ? requestAnimationFrame(loop) : null;
  }, []);

  React.useEffect(
    () => () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    },
    [],
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLOListElement>) => {
    if (!listRef.current) return;
    const rect = listRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let nextX = x + 24;
    let nextY = y - 100;

    // Keep preview within list horizontal bounds
    if (nextX + 340 > rect.width) {
      nextX = x - 344;
    }
    // Clamp Y position
    nextY = Math.max(0, Math.min(nextY, Math.max(0, rect.height - 210)));

    targetPos.current = { x: nextX, y: nextY };
    if (rafId.current === null) rafId.current = requestAnimationFrame(loop);
  };

  const toggleMobile = (id: string) => {
    setExpandedMobileId((prev) => (prev === id ? null : id));
  };

  return (
    <Sheet index={index} slug="what-i-do" total={total} title="What I do" id="what-i-do">
      <div className="relative">
        <ol
          ref={listRef}
          onMouseMove={handleMouseMove}
          className="divide-y divide-line border-y border-line"
        >
          {profile.capabilities.map((cap, idx) => {
            const num = String(idx + 1).padStart(2, "0");
            const isExpanded = expandedMobileId === cap.id;

            return (
              <li
                key={cap.id}
                className="group relative py-6 transition-colors sm:py-8"
                data-block="stagger"
              >
                {/* Full-width focusable button row with visible focus style and aria-expanded */}
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={`cap-mobile-${cap.id}`}
                  onClick={() => toggleMobile(cap.id)}
                  onFocus={() => {
                    setActiveCap(cap);
                    setExpandedMobileId(cap.id);
                  }}
                  onBlur={() => {
                    setActiveCap((current) => (current?.id === cap.id ? null : current));
                  }}
                  onMouseEnter={() => {
                    setActiveCap(cap);
                  }}
                  onMouseLeave={() => {
                    setActiveCap((current) => (current?.id === cap.id ? null : current));
                  }}
                  className="w-full text-left rounded-sm outline-none focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-2"
                >
                  <div className="grid grid-cols-1 items-baseline gap-2 lg:grid-cols-12 lg:items-center lg:gap-6">
                    {/* Mono number + Title */}
                    <div className="flex items-center gap-4 lg:col-span-3" data-part>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground transition-colors group-hover:text-signal group-focus-within:text-signal sm:text-sm">
                        {num}
                      </span>
                      <h3 className="text-lg font-semibold tracking-[-0.03em] text-text sm:text-xl">
                        {cap.title}
                      </h3>
                    </div>

                    {/* Mono stack row (muted) */}
                    <div
                      className="font-mono text-xs text-muted-foreground lg:col-span-4"
                      data-part
                    >
                      {cap.stack.join(" · ")}
                    </div>

                    {/* Pitch */}
                    <div
                      className="text-sm leading-relaxed text-muted-foreground lg:col-span-4"
                      data-part
                    >
                      {cap.pitch}
                    </div>

                    {/* Arrow indicator */}
                    <div className="flex justify-end lg:col-span-1" data-part>
                      <span
                        aria-hidden="true"
                        className={cn(
                          "inline-block font-mono text-sm text-muted-foreground transition-all duration-150 group-hover:text-signal group-focus-within:text-signal",
                          isExpanded
                            ? "rotate-90 lg:rotate-0"
                            : "group-hover:translate-x-1 group-focus-within:translate-x-1",
                        )}
                      >
                        →
                      </span>
                    </div>
                  </div>
                </button>

                {/* Reduced-motion desktop static cover preview (shown statically on the right of the hovered row) */}
                <div className="hidden shrink-0 pt-4 motion-reduce:lg:group-hover:block motion-reduce:lg:group-focus-within:block lg:pt-6">
                  <div className="relative aspect-[16/10] w-[320px] overflow-hidden rounded-md border border-line bg-surface">
                    <Image
                      src={cap.cover}
                      alt={`${cap.title} cover`}
                      width={320}
                      height={200}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>

                {/* Mobile inline cover: toggled on focus/tap */}
                <div
                  id={`cap-mobile-${cap.id}`}
                  className={cn(
                    "overflow-hidden transition-all duration-200 lg:hidden",
                    isExpanded
                      ? "max-h-80 pt-4 pb-2 opacity-100"
                      : "max-h-0 opacity-0 pointer-events-none",
                  )}
                >
                  <div className="relative aspect-[16/10] w-full max-w-[320px] overflow-hidden rounded-md border border-line bg-surface">
                    <Image
                      src={cap.cover}
                      alt={`${cap.title} cover`}
                      width={320}
                      height={200}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Desktop floating cover preview (follows cursor via requestAnimationFrame) */}
        <div
          ref={previewRef}
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-0 left-0 z-20 transition-opacity duration-200 motion-reduce:hidden",
            activeCap && isDesktopFine && !reducedMotion ? "opacity-100" : "opacity-0 invisible",
          )}
        >
          <div className="relative aspect-[16/10] w-[320px] overflow-hidden rounded-md border border-line bg-surface shadow-2xl">
            {activeCap && (
              <Image
                src={activeCap.cover}
                alt={`${activeCap.title} cover`}
                width={320}
                height={200}
                className="h-full w-full object-cover"
              />
            )}
          </div>
        </div>
      </div>
    </Sheet>
  );
}
