# Design decisions

Each entry: what was chosen, what lost, why. Newest at the bottom.

## D1 — Hero concept shortlist and scores (2026-10-15 02:25)

Panel: Opus, Sonnet, Gemini 3.8 Flash High (stand-in for agy pro; Gemini 4 Argon unavailable), agy Claude Sonnet 4.6. 12 concepts in `concepts/panel-*.md`. Several overlapped, so they were merged:

| Concept (source) | Wow | Relevance | Feasibility | Mobile perf | Maintain | Total |
|---|---|---|---|---|---|---|
| **Blueprint** — Stack starts as a 2D technical drawing, extrudes into hardware, runs (Opus #3 + §5 + Gemini #1) | 4 | 5 | 5 | 5 | 5 | **24** |
| **Living Cluster** — isometric cluster that schedules, scales, self-heals, rolls out (Sonnet #2, Opus #2 2nd half) | 4 | 4 | 4 | 5 | 4 | **21** |
| **Trace** — one request becomes a 3D trace waterfall (Opus #1, Sonnet #3) | 4 | 4 | 4 | 4 | 4 | 20 |
| **Pipeline Rail** — a commit rides a rail through CI/CD stations (Sonnet #1, Opus #2) | 4 | 5 | 3 | 4 | 3 | 19 |
| Topology / Service Mesh (agy-Sonnet #3, Gemini #2) | 3 | 4 | 4 | 4 | 4 | 19 |
| Control Room incident (agy-Sonnet #1) | 3 | 4 | 4 | 4 | 4 | 19 |
| Telemetry Deck, TE-style console (Gemini #3) | 5 | 3 | 2 | 3 | 2 | 15 |
| Pipeline tube fly-through (agy-Sonnet #2) | 4 | 4 | 2 | 2 | 3 | 15 |

Key frames for the top 5 are in `concepts/{blueprint,cluster,trace,pipeline,deck}-{a,b}.png`.
Notes from looking at them:
- **blueprint-b** (exploded slabs + amber arcs + leader lines) is the strongest single frame and reads as "system" instantly. blueprint-a proves the drawing→hardware idea is visually distinct from every reference.
- **cluster-b** (rollout wave across a pod grid with a green ring) is gorgeous and very DevOps, but alone it under-sells the front end.
- **deck** is the most memorable object but reads "hardware/product designer", not "software engineer", and procedural modelling of dials is a build-time risk.
- **trace-b** is elegant but abstract; needs explanation.

**Decision:** prototype **Blueprint** vs **Living Cluster** on `/lab`. Planned combination if Blueprint wins: borrow the Cluster's rollout wave + click-to-kill self-heal for the Infrastructure layer's scale-out phase, and the Trace idea ("send another request") for the request-flow phase.
Lost: Trace, Pipeline, Deck, Topology, Control Room (lower feasibility or weaker 5-second read as full-stack).

## D2 — Theme: system by default (2026-10-15 02:31, owner request)

Owner asked for dark mode, light mode and auto-detecting the OS setting. `next-themes` with `defaultTheme="system"` + `enableSystem`; the first visit follows the OS; the header toggle is a two-state light ↔ dark switch (owner: no separate "system" option). Once clicked, the choice is saved. Before JS runs, a `prefers-color-scheme: light` media query on `:root:not(.dark)` applies the light tokens, so there is no wrong-theme flash and no-JS visitors still follow the OS. Dark stays the designed-first theme (screenshots, poster default).
Lost: dark-only default (the brief's original), a system/light/dark cycle (owner rejected the extra option).

## D3 — Mermaid rendered client-side, lazily (2026-10-15 02:28)

The brief asked for build-time Mermaid. Build-time rendering (rehype-mermaid) needs a headless Chromium inside `pnpm build`, which would also run inside the Alpine Docker build. Instead a small client component lazy-imports `mermaid` when the diagram scrolls into view, themed from the CSS tokens, and falls back to the raw code. Stretch S1 (React Flow) replaces it anyway.

## D4 — Animations follow the theme (2026-10-15 02:34, owner request)

Owner: animations must be relevant to the dark/light setting, not just recoloured. Requirement for P2 and the motion pass:
- **One scene, two moods.** Dark = "control room at night": glossy graphite slabs, emissive amber packets with soft bloom, green deploy ring glows. Light = "blueprint on paper": matte paper-white slabs, ink-coloured (`--text`) hairline edges, packets drawn as solid amber-ink dots with no bloom, deploy ring as a crisp green stroke. The drawing → extrude phase (Blueprint concept) reads as pencil-on-paper in light and light-on-graphite in dark.
- All scene colours come from the CSS tokens via `useThemeColors()`, re-read when `resolvedTheme` changes; materials ease to the new colours over ~450 ms instead of snapping. Lighting rig and bloom strength are per-theme values in `materials.ts`.
- **Theme switch is a moment:** a View Transitions API circular reveal from the toggle button (`document.startViewTransition`), falling back to an instant switch when unsupported or under reduced motion.
- Hero posters (reduced-motion / no-WebGL) exist for both themes and swap with the theme.
- Section motion (reveals, drawn accent lines, hover cover reveal) uses token colours, so it follows the theme for free; drawn lines use `--accent` in dark and `--accent-strong` in light for contrast.

## D5 — Final concept: Blueprint, with the Cluster inside the INFRA layer (2026-10-15 02:45)

Prototypes on `/lab/blueprint` and `/lab/cluster`; screenshots in `lab/`.
- Blueprint: the exploded, labelled stack (bp-45) reads "full stack" in under a second — the strongest 5-second test. Weak: the drawing phase was nearly empty, slabs were oversized dark boxes, packets rendered as white blobs, containers invisible (bp-82). All tuning problems, not concept problems.
- Cluster: very clean and legible, the HUD panel is excellent (cl-45), node failure reads well (cl-82). But it says "Kubernetes" only, and the subject is small in frame.
**Winner: Blueprint**, absorbing Cluster's best parts: INFRA becomes a node grid with pods, failure + reschedule and a rollout wave; the HUD panel becomes the hero status line (in the DOM). Full spec in `SPEC.md`.

## D6 — More motion: ambient 3D on sub-pages, interactive cursor, CSS scroll reveals (2026-10-15 03:12)

Owner request (03:10): "add scroll animations and make it smooth, make the 3D not just one, also on other page backgrounds, make the cursor interactive."
- **Scroll reveals are CSS scroll-driven animations** (`animation-timeline: view()`), replacing the GSAP RevealController. The GSAP version lived in the layout and wrote inline styles before the page segment hydrated, which caused a React hydration mismatch the owner saw. CSS needs no JS, never touches the DOM and runs off the main thread. Browsers without support just show the content.
- **Lenis tick fix:** the effect read `lenisRef.current.lenis` once on mount, before ReactLenis created it, so `raf` never ran and wheel/trackpad scroll was dead. The tick now resolves the instance every frame (Lenis docs pattern).
- **Ambient 3D backgrounds** (`src/features/ambient-scene`): one cheap R3F canvas behind sub-pages, a variant per route. /work = floating drawing sheets, /notes = dot field with a cursor ripple, /resume + /uses = service graph that lights up near the cursor, /contact = routed packets. Home keeps the hero scene. No bloom, low contrast, lazy after idle, paused when hidden, static under reduced motion, nothing without WebGL (the CSS dot-grid stays).
- **Interactive cursor:** dot + lerped ring on fine pointers only, which grows on links and shows a label on `data-cursor` (View / Read). Magnetic hero CTAs via `data-magnetic`. It is off for touch and reduced motion, and the native cursor stays on inputs.
