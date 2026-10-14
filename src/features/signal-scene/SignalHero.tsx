"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { Eyebrow, Tag } from "@/components/site/primitives";
import { profile } from "@/content/profile";
import {
  activeChapter,
  CHAPTERS,
  chapterProgress,
  easeToward,
  FORMATION_SIDE,
  textState,
} from "./timeline";
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
    line: "Schemas, queries and caches designed to stay correct as the data grows.",
  },
  {
    id: "infra",
    title: "Infrastructure",
    line: "Containers, pipelines and clusters that make shipping routine and repeatable.",
  },
] as const;

const RAIL_LABELS = ["Intro", "Interface", "API", "Data", "Infrastructure", "Shipped"];
const POSTER_ALT =
  "Particle diagram of the stack: interface, API, data and infrastructure, shipped";

function LayerBody({ index }: { index: number }) {
  const layer = LAYERS[index];
  const tech = profile.stackLayers.find((l) => l.id === layer.id)?.tech ?? [];
  return (
    <>
      <Eyebrow>
        {String(index + 1).padStart(2, "0")} / {String(LAYERS.length).padStart(2, "0")}
      </Eyebrow>
      <h2 className="mt-3 text-[length:var(--text-h2)] leading-[1.05]">{layer.title}</h2>
      <p className="mt-4 max-w-[34ch] text-muted-foreground">{layer.line}</p>
      <ul className="mt-5 flex flex-wrap gap-1.5">
        {tech.map((t) => (
          <li key={t}>
            <Tag>{t}</Tag>
          </li>
        ))}
      </ul>
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

  // Text + rail: DOM writes from rAF, no React state per frame.
  useEffect(() => {
    if (gate.fallback) return;
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
        const { opacity, enter, leave } = textState(p, i);
        const side = -FORMATION_SIDE[i];
        const x = side * 36 * enter - side * 36 * leave;
        const y = i === 0 ? -24 * leave : i === CHAPTERS - 1 ? 24 * enter : 0;
        el.style.opacity = String(opacity);
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        el.inert = opacity < 0.5;
        el.style.visibility = opacity < 0.01 ? "hidden" : "visible";
      }
      const stage = stageRef.current;
      if (stage) {
        let best = 0;
        let bi = 0;
        for (let i = 0; i < CHAPTERS; i++) {
          const o = Number.parseFloat(blockRefs.current[i]?.style.opacity || "0");
          if (o > best) {
            best = o;
            bi = i;
          }
        }
        const el = blockRefs.current[bi];
        const sr = stage.getBoundingClientRect();
        if (el && best > 0) {
          const r = el.getBoundingClientRect();
          const m = maskRef.current;
          m.x = (((r.left + r.right) / 2 - sr.left) / sr.width) * 2 - 1;
          m.y = -((((r.top + r.bottom) / 2 - sr.top) / sr.height) * 2 - 1);
          m.w = r.width / sr.width + 0.06;
          m.h = r.height / sr.height + 0.1;
          m.a = best;
        } else maskRef.current.a = 0;
      }
      const active = activeChapter(p);
      railRefs.current.forEach((b, i) => {
        if (!b) return;
        const on = String(i === active);
        if (b.dataset.active !== on) b.dataset.active = on;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [gate.fallback]);

  const go = (i: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const top = section.getBoundingClientRect().top + window.scrollY;
    const y = top + (section.offsetHeight - window.innerHeight) * chapterProgress(i);
    if (lenis) lenis.scrollTo(y, { duration: 1.4 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

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
    <section ref={sectionRef} data-stack-hero className="relative h-[650vh] w-full">
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

        {/* layers: text on the side opposite the formation */}
        {LAYERS.map((l, i) => (
          <div
            key={l.id}
            className={`${row} ${FORMATION_SIDE[i + 1] === 1 ? "justify-start" : "justify-end"}`}
          >
            <div
              ref={(el) => {
                blockRefs.current[i + 1] = el;
              }}
              inert
              style={{ opacity: 0 }}
              className={`${block} w-full md:w-[min(42%,26rem)] ${card}`}
            >
              <Scrim />
              <LayerBody index={i} />
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
          className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1 md:top-1/2 md:right-4 md:bottom-auto md:left-auto md:translate-x-0 md:-translate-y-1/2 md:flex-col"
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
              onClick={() => go(i)}
              className="group flex size-6 items-center justify-center md:justify-end"
            >
              <span className="block h-px w-3 bg-line-strong transition-all group-data-[active=true]:w-6 group-data-[active=true]:bg-signal md:group-hover:w-5" />
            </button>
          ))}
        </nav>
      </div>
    </section>
  );
}
