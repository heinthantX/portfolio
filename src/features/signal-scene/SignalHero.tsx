"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { Eyebrow, Tag } from "@/components/site/primitives";
import { ScrollWords } from "@/components/site/scroll-words";
import { profile } from "@/content/profile";
import {
  activeChapter,
  CHAPTERS,
  easeToward,
  FORMATION_SIDE,
  LAYER_OFFSET,
  textState,
  WAVE_CHAPTER,
} from "./timeline";
import { useChapterSnap } from "./useChapterSnap";
import { useSignalGate } from "./useSignalGate";

gsap.registerPlugin(ScrollTrigger);

const SignalCanvas = dynamic(() => import("./SignalCanvas"), { ssr: false });

const LAYERS = [
  {
    id: "interface",
    title: "Interface",
    line: "The surface people touch: fast, accessible screens on the web and on mobile.",
  },
  {
    id: "api",
    title: "API",
    line: "Typed services that keep business rules in one place and fail loudly at the edges.",
  },
  {
    id: "data",
    title: "Data",
    line: "SQL or NoSQL, picked per job: schemas, queries and caches that stay correct as the data grows.",
  },
  {
    id: "infra",
    title: "Infrastructure",
    line: "Containers, pipelines and clusters that make shipping routine and repeatable.",
  },
] as const;

const RAIL_LABELS = ["Intro", "Approach", "Interface", "API", "Data", "Infrastructure", "Shipped"];

const MANIFESTO =
  "Nobody sees the stack. They feel it: a screen that answers before they blink, an API that says the same thing twice, data that is still right a year later, and a deploy nobody noticed. I build every layer, so it all feels like one product.";
const POSTER_ALT =
  "Particle diagram of the stack: interface, API, data and infrastructure, shipped";

function LayerBody({ index, onJump }: { index: number; onJump?: (chapter: number) => void }) {
  const layer = LAYERS[index];
  const { tech = [], points = [] } = profile.stackLayers.find((l) => l.id === layer.id) ?? {};
  return (
    <>
      <div data-line>
        <Eyebrow>
          {String(index + 1).padStart(2, "0")} / {String(LAYERS.length).padStart(2, "0")}
        </Eyebrow>
      </div>
      <h2 data-line className="mt-3 text-[length:var(--text-h2)] leading-[1.05]">
        {layer.title}
      </h2>
      <ScrollWords
        mode="driven"
        text={layer.line}
        className="mt-4 max-w-[38ch] text-muted-foreground"
      />
      <ul
        data-line
        style={{ "--d": 0.3 } as React.CSSProperties}
        className="mt-5 flex flex-wrap gap-1.5"
      >
        {tech.map((t) => (
          <li key={t}>
            <Tag>{t}</Tag>
          </li>
        ))}
      </ul>
      {points.length > 0 && (
        <ul className="mt-5 space-y-2 text-sm">
          {points.map((pt, j) => (
            <li
              key={pt}
              data-line
              style={{ "--d": 0.45 + j * 0.1 } as React.CSSProperties}
              className="flex gap-2.5"
            >
              <span aria-hidden="true" className="mt-[0.6em] h-px w-2.5 shrink-0 bg-signal" />
              <span>{pt}</span>
            </li>
          ))}
        </ul>
      )}
      {onJump && <StackOutline active={index} onJump={onJump} />}
    </>
  );
}

/** The whole stack at a glance under the active layer; each row jumps to its chapter. */
function StackOutline({ active, onJump }: { active: number; onJump: (chapter: number) => void }) {
  return (
    <ol className="mt-6 hidden border-line border-t pt-3 md:block">
      {LAYERS.map((l, j) => {
        const tech = profile.stackLayers.find((s) => s.id === l.id)?.tech ?? [];
        const on = j === active;
        return (
          <li key={l.id}>
            <button
              type="button"
              onClick={() => onJump(j + LAYER_OFFSET)}
              aria-current={on ? "step" : undefined}
              className={`flex w-full items-baseline gap-3 py-1 text-left text-sm transition-colors duration-200 ${on ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <span className={`font-mono text-[0.6875rem] ${on ? "text-signal" : ""}`}>
                {String(j + 1).padStart(2, "0")}
              </span>
              <span className="w-28 shrink-0">{l.title}</span>
              <span className="truncate font-mono text-[0.6875rem]">
                {tech.slice(0, 3).join(" · ")}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** The chapter over the wave: what the stack is for, then the four layers at a glance. */
function ManifestoBody({ onJump }: { onJump?: (chapter: number) => void }) {
  return (
    <>
      <div data-line>
        <Eyebrow>00 / how it fits together</Eyebrow>
      </div>
      <ScrollWords
        mode={onJump ? "driven" : "view"}
        text={MANIFESTO}
        accent={["feel", "one"]}
        className="mt-4 max-w-[34ch] text-[clamp(1.5rem,2.7vw,2.5rem)] leading-[1.2] tracking-tight"
      />
      {onJump && (
        <ol className="mt-8 grid max-w-[46rem] grid-cols-2 gap-x-6 gap-y-3 border-line border-t pt-4 sm:grid-cols-4">
          {LAYERS.map((l, j) => {
            const tech = profile.stackLayers.find((s) => s.id === l.id)?.tech ?? [];
            return (
              <li key={l.id} data-line style={{ "--d": 0.5 + j * 0.08 } as React.CSSProperties}>
                <button
                  type="button"
                  onClick={() => onJump(j + LAYER_OFFSET)}
                  className="group flex w-full flex-col items-start gap-0.5 text-left"
                >
                  <span className="font-mono text-[0.6875rem] text-signal">
                    {String(j + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm text-foreground transition-colors duration-200 group-hover:text-signal">
                    {l.title}{" "}
                    <span
                      aria-hidden="true"
                      className="inline-block transition-transform duration-200 group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </span>
                  <span className="truncate font-mono text-[0.6875rem] text-muted-foreground">
                    {tech.slice(0, 2).join(" · ")}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}

/** Soft bg-coloured halo behind a text block so it stays readable over the points. */
function Scrim() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -inset-x-[12%] -inset-y-[18%] -z-10 bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--bg)_82%,transparent)_55%,transparent)]"
    />
  );
}

function FinaleBody({ finale }: { finale: React.ReactNode }) {
  return (
    <>
      <h2 className="text-[length:var(--text-h1)] leading-none tracking-tight">Shipped.</h2>
      <p className="mt-4 text-muted-foreground">From the first screen to the running cluster.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">{finale}</div>
    </>
  );
}

interface Rect {
  l: number;
  t: number;
  w: number;
  h: number;
  x: number;
  y: number;
}

export interface SignalHeroProps {
  /** Intro: eyebrow, h1 name, tagline, CTAs, availability. */
  children: React.ReactNode;
  /** Finale CTAs. */
  finale: React.ReactNode;
  poster: { dark: string; light: string };
}

export function SignalHero({ children, finale, poster }: SignalHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0); // displayed (eased) progress, read by the scene
  const maskRef = useRef({ x: 0, y: 0, w: 0, h: 0, a: 0 }); // active text rect in NDC
  const targetRef = useRef(0); // raw ScrollTrigger progress
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
  const railRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const gate = useSignalGate(stageRef);
  const lenis = useLenis();
  // Layout cache (stage-relative, scroll independent) so the rAF loop never reads layout.
  const layoutRef = useRef({ sw: 1, sh: 1, blocks: [] as Rect[] });
  const appliedRef = useRef<{ x: number; y: number }[]>([]); // transform currently on each block
  const revealRef = useRef<number[]>([]); // --reveal currently on each block

  // Progress comes from ScrollTrigger; everything below is a pure function of it.
  useEffect(() => {
    const section = sectionRef.current;
    if (gate.fallback || !section) return;
    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        targetRef.current = self.progress;
      },
      onRefresh: (self) => {
        targetRef.current = self.progress;
      },
    });
    // first mount / reload mid-page: start at the target, do not animate from 0
    targetRef.current = st.progress;
    progressRef.current = st.progress;
    return () => st.kill();
  }, [gate.fallback]);

  // Measure block rects once per resize / ScrollTrigger refresh (not per frame).
  useEffect(() => {
    if (gate.fallback) return;
    const measure = () => {
      const stage = stageRef.current;
      if (!stage) return;
      const sr = stage.getBoundingClientRect();
      layoutRef.current = {
        sw: sr.width || 1,
        sh: sr.height || 1,
        blocks: blockRefs.current.map((el, i) => {
          const r = el?.getBoundingClientRect();
          const a = appliedRef.current[i] ?? { x: 0, y: 0 };
          return r
            ? { l: r.left - sr.left, t: r.top - sr.top, w: r.width, h: r.height, x: a.x, y: a.y }
            : { l: 0, t: 0, w: 0, h: 0, x: 0, y: 0 };
        }),
      };
    };
    measure();
    ScrollTrigger.addEventListener("refresh", measure);
    window.addEventListener("resize", measure);
    return () => {
      ScrollTrigger.removeEventListener("refresh", measure);
      window.removeEventListener("resize", measure);
    };
  }, [gate.fallback]);

  // Text + rail: DOM writes from rAF, no React state per frame. Paused off-screen / hidden tab.
  useEffect(() => {
    if (gate.fallback || !gate.active) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      progressRef.current = easeToward(progressRef.current, targetRef.current, dt);
      const p = progressRef.current;
      for (let i = 0; i < CHAPTERS; i++) {
        const el = blockRefs.current[i];
        if (!el) continue;
        const { opacity, enter, leave, reveal } = textState(p, i);
        // vertical only: rises in from below, leaves upward, following the scroll direction
        const y = 24 * enter - 24 * leave;
        el.style.opacity = String(opacity);
        el.style.transform = `translate3d(0, ${y}px, 0)`;
        appliedRef.current[i] = { x: 0, y };
        el.inert = opacity < 0.5;
        el.style.visibility = opacity < 0.01 ? "hidden" : "visible";
        // words sharpen from CSS off one number; only write it when it moves
        if (Math.abs((revealRef.current[i] ?? -1) - reveal) > 0.002) {
          revealRef.current[i] = reveal;
          el.style.setProperty("--reveal", reveal.toFixed(3));
        }
      }
      {
        const { sw, sh, blocks } = layoutRef.current;
        let best = 0;
        let bi = 0;
        for (let i = 0; i < CHAPTERS; i++) {
          const o = Number.parseFloat(blockRefs.current[i]?.style.opacity || "0");
          if (o > best) {
            best = o;
            bi = i;
          }
        }
        const r = blocks[bi];
        const applied = appliedRef.current[bi];
        if (r && applied && best > 0) {
          // cached layout rect, shifted by how far the block has moved since it was measured
          const cx = r.l + r.w / 2 + (applied.x - r.x);
          const cy = r.t + r.h / 2 + (applied.y - r.y);
          const m = maskRef.current;
          m.x = (cx / sw) * 2 - 1;
          m.y = -((cy / sh) * 2 - 1);
          m.w = r.w / sw + 0.06;
          m.h = r.h / sh + 0.1;
          m.a = best;
        } else maskRef.current.a = 0;
      }
      const active = activeChapter(p);
      railRefs.current.forEach((b, i) => {
        if (!b) return;
        const on = String(i === active);
        if (b.dataset.active !== on) {
          b.dataset.active = on;
          if (i === active) b.setAttribute("aria-current", "step");
          else b.removeAttribute("aria-current");
        }
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [gate.fallback, gate.active]);

  const go = useChapterSnap(sectionRef, lenis, !gate.fallback);

  if (gate.fallback) {
    return (
      <section data-stack-hero className="relative">
        <div className="mx-auto grid min-h-[100svh] max-w-[1280px] items-center gap-10 px-4 pt-24 pb-12 sm:px-6 lg:grid-cols-2 lg:px-10">
          <div>{children}</div>
          <div>
            {/* biome-ignore lint/performance/noImgElement: theme-swapped poster pair */}
            <img src={poster.light} alt={POSTER_ALT} className="hidden w-full light:block" />
            {/* biome-ignore lint/performance/noImgElement: theme-swapped poster pair */}
            <img src={poster.dark} alt={POSTER_ALT} className="w-full light:hidden" />
          </div>
        </div>
        <div className="mx-auto max-w-[1280px] divide-y divide-line px-4 sm:px-6 lg:px-10">
          <div className="py-12">
            <ManifestoBody />
          </div>
          {LAYERS.map((l, i) => (
            <div key={l.id} className="py-12">
              <LayerBody index={i} />
            </div>
          ))}
          <div className="py-16 text-center">
            <FinaleBody finale={finale} />
          </div>
        </div>
      </section>
    );
  }

  const block = "pointer-events-auto relative isolate will-change-transform";
  const row =
    "pointer-events-none absolute inset-0 mx-auto flex max-w-[1280px] items-center px-4 sm:px-6 lg:px-10 max-md:items-end max-md:pb-16";
  const card = "max-md:rounded-lg max-md:bg-bg/80 max-md:p-4 max-md:backdrop-blur-md";

  return (
    <section ref={sectionRef} data-stack-hero className="relative h-[450vh] w-full">
      <div
        ref={stageRef}
        data-stack-stage
        className="sticky top-0 h-[100svh] w-full overflow-hidden"
      >
        <div aria-hidden="true" className="absolute inset-0">
          {gate.ready && (
            <SignalCanvas
              variant="hero"
              progressRef={progressRef}
              maskRef={maskRef}
              count={gate.count}
              frameloop={gate.frameloop}
            />
          )}
        </div>

        {/* intro */}
        <div className={`${row} justify-center md:items-end md:pb-[10svh]`}>
          <div
            ref={(el) => {
              blockRefs.current[0] = el;
            }}
            className={`${block} flex max-w-[44rem] flex-col items-center text-center ${card} [&_div]:justify-center [&_h1]:sr-only [&_p]:mx-auto`}
          >
            <Scrim />
            {children}
          </div>
        </div>

        {/* approach: copy in the upper half, the wave field below it */}
        <div className="pointer-events-none absolute inset-0 mx-auto flex max-w-[1280px] items-start px-4 pt-[14svh] sm:px-6 md:pt-[16svh] lg:px-10">
          <div
            ref={(el) => {
              blockRefs.current[WAVE_CHAPTER] = el;
            }}
            inert
            style={{ opacity: 0 }}
            className={`${block} w-full md:w-auto ${card}`}
          >
            <Scrim />
            <ManifestoBody onJump={go} />
          </div>
        </div>

        {/* layers: text on the side opposite the formation */}
        {LAYERS.map((l, i) => (
          <div
            key={l.id}
            className={`${row} ${FORMATION_SIDE[i + LAYER_OFFSET] === 1 ? "justify-start" : "justify-end"}`}
          >
            <div
              ref={(el) => {
                blockRefs.current[i + LAYER_OFFSET] = el;
              }}
              inert
              style={{ opacity: 0 }}
              className={`${block} w-full md:w-[min(46%,30rem)] ${card}`}
            >
              <Scrim />
              <LayerBody index={i} onJump={go} />
            </div>
          </div>
        ))}

        {/* finale */}
        <div className={`${row} justify-center md:items-end md:pb-[10svh]`}>
          <div
            ref={(el) => {
              blockRefs.current[CHAPTERS - 1] = el;
            }}
            inert
            style={{ opacity: 0 }}
            className={`${block} flex flex-col items-center text-center ${card}`}
          >
            <Scrim />
            <FinaleBody finale={finale} />
          </div>
        </div>

        <nav
          aria-label="Hero chapters"
          className="group/rail absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1 md:top-1/2 md:right-4 md:bottom-auto md:left-auto md:translate-x-0 md:-translate-y-1/2 md:flex-col md:items-end"
        >
          {RAIL_LABELS.map((label, i) => (
            <button
              key={label}
              ref={(el) => {
                railRefs.current[i] = el;
              }}
              type="button"
              aria-label={label}
              data-active={i === 0 ? "true" : "false"}
              aria-current={i === 0 ? "step" : undefined}
              onClick={() => go(i)}
              className="group flex size-6 items-center justify-center gap-3 md:h-6 md:w-auto md:justify-end"
            >
              {/* chapter tab: the current one is always named; hovering the rail names them all */}
              <span
                aria-hidden="true"
                className="hidden rounded-sm px-1.5 py-0.5 font-mono text-[0.6875rem] tracking-[0.12em] text-muted-foreground uppercase opacity-0 transition-[opacity,color,background-color] duration-300 group-hover:text-text group-focus-visible:opacity-100 group-hover/rail:bg-bg/70 group-hover/rail:opacity-100 group-data-[active=true]:text-signal group-data-[active=true]:opacity-100 md:inline"
              >
                <span className="mr-1.5 tabular-nums opacity-60">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {label}
              </span>
              <span className="block h-px w-3 shrink-0 bg-line-strong transition-all group-data-[active=true]:w-6 group-data-[active=true]:bg-signal md:group-hover:w-5" />
            </button>
          ))}
        </nav>
      </div>
    </section>
  );
}
