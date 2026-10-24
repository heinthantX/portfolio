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

Prototypes were on `/lab/blueprint` and `/lab/cluster` (removed after the decision; see git history); screenshots in `lab/`.
- Blueprint: the exploded, labelled stack (bp-45) reads "full stack" in under a second — the strongest 5-second test. Weak: the drawing phase was nearly empty, slabs were oversized dark boxes, packets rendered as white blobs, containers invisible (bp-82). All tuning problems, not concept problems.
- Cluster: very clean and legible, the HUD panel is excellent (cl-45), node failure reads well (cl-82). But it says "Kubernetes" only, and the subject is small in frame.
**Winner: Blueprint**, absorbing Cluster's best parts: INFRA becomes a node grid with pods, failure + reschedule and a rollout wave; the HUD panel becomes the hero status line (in the DOM). Full spec in `SPEC.md`.

## D6 — More motion: ambient 3D on sub-pages, interactive cursor, CSS scroll reveals (2026-10-15 03:12)

Owner request (03:10): "add scroll animations and make it smooth, make the 3D not just one, also on other page backgrounds, make the cursor interactive."
- **Scroll reveals are CSS scroll-driven animations** (`animation-timeline: view()`), replacing the GSAP RevealController. The GSAP version lived in the layout and wrote inline styles before the page segment hydrated, which caused a React hydration mismatch the owner saw. CSS needs no JS, never touches the DOM and runs off the main thread. Browsers without support just show the content.
- **Lenis tick fix:** the effect read `lenisRef.current.lenis` once on mount, before ReactLenis created it, so `raf` never ran and wheel/trackpad scroll was dead. The tick now resolves the instance every frame (Lenis docs pattern).
- **Ambient 3D backgrounds** (`src/features/ambient-scene`): one cheap R3F canvas behind sub-pages, a variant per route. /work = floating drawing sheets, /notes = dot field with a cursor ripple, /resume + /uses = service graph that lights up near the cursor, /contact = routed packets. Home keeps the hero scene. No bloom, low contrast, lazy after idle, paused when hidden, static under reduced motion, nothing without WebGL (the CSS dot-grid stays).
- **Interactive cursor:** dot + lerped ring on fine pointers only, which grows on links and shows a label on `data-cursor` (View / Read). Magnetic hero CTAs via `data-magnetic`. It is off for touch and reduced motion, and the native cursor stays on inputs.

## D7 — Hero redesign: "Signal", a particle system that morphs per chapter (2026-10-15 03:20)

Owner feedback (03:14): does not like the stacked-slab animation; wants it cool, professional and eye-pleasing; the text must not sit fixed on the left but flow with the 3D.

Brainstorm, scored 1–5 on look / professional / story / text-flow / mobile+perf:

| Concept | Idea | Look | Pro | Story | Flow | Perf | Σ |
|---|---|---|---|---|---|---|---|
| **A. Signal (particle morph)** | ~16k GPU points form a shape per chapter: name glyph → browser + phone wireframe → service graph → database discs → node cluster → globe with deploy arcs. Curl-noise drift between shapes; cursor pushes points away. | 5 | 5 | 5 | 5 | 4 | **24** |
| B. Flythrough | Camera dives down through glass layers UI → API → data → infra | 4 | 4 | 4 | 3 | 2 | 17 |
| C. Flow ribbons | Stripe-like light ribbons carry data from UI to infra | 4 | 5 | 2 | 4 | 4 | 19 |
| D. Glass monolith | One refractive object reveals inner layers as it turns | 5 | 4 | 2 | 3 | 1 | 15 |
| E. Terminal builds system | A 3D terminal types commands that assemble the system | 3 | 3 | 4 | 3 | 4 | 17 |
| (old) Slab stack | Exploding labelled slabs | 2 | 3 | 4 | 2 | 3 | 14 |

**Winner: A, "Signal".** One cloud of light (dark) or ink stipple (light) that keeps becoming the next layer of the stack. It reads as craft, not as a diagram, and it moves smoothly because it is one mesh. It also has a natural slot for the cursor (points part around it).
- **Text flows with the formation.** *(Side-alternation superseded by D8.)* Every chapter places the formation on one side and its text on the other, alternating sides. The formation glides across while the old text leaves and the new text comes in. The hero name is centred over the name glyph, and the finale is centred over the globe with the CTAs. On mobile the formation sits in the top half and the text card in the bottom half.
- **Chapters:** 00 name → 01 Interface (browser + phone) → 02 API (service graph) → 03 Data (stacked database discs) → 04 Infrastructure (4×3 node cluster with pods) → 05 Shipped (globe with arcs) + CTA.
- **Moods (D4 kept):** dark = additive glowing points in amber + text colour, a light depth fade; light = ink-coloured stipple with normal blending and amber accents only, no glow.
- A small chapter rail (01–05) on the right edge replaces the HUD box, and each tick jumps to its chapter.
- The old stack-scene is retired. The 404 page uses the same engine: points form "404", then scatter and reform.

## D8 — No sideways motion; denser, shorter hero (2026-10-24)

The owner rejected motion that travels left and right, and the one-topic-per-screen pacing. Principles taken from a reference video on particle scrollytelling: points swarm with per-point lag instead of fading, scroll is one 0..1 number read in the frame loop, and the scene gathers on load.

- **Formation holds one column.** `FORMATION_SIDE` is `[0, 1, 1, 1, 1, 0]`: the formation stays on the right through all four layers and the text stays on the left. Yaw (`ROT_Y`) is constant per layer. Only the intro → Interface step moves the formation once, during the shape morph. _Superseded by D9: side is set per chapter, morphs are per point, and the wave step sits between intro and Interface._
- **Text moves vertically only.** Cards rise in from 24px below and leave 24px upward. No `translateX` anywhere in the hero.
- **Idle life is a scale pulse,** about 1.2% over ~7 s (`breathe()` in `SignalCanvas.tsx`), replacing the yaw sway. The 404 scene breathes too. Ambient sheets drift vertically, not sideways. Cursor-driven parallax stays.
- **Intro swarm (2.8 s):** points gather inward from a loose cloud with a per-point lag (`uIntro`, `INTRO_S` in `SignalPoints.tsx`).
- **Shorter, denser story:** the hero is `400vh` (3 screens of scroll, was 5.5). Each layer card shows the tech tags, 3 capability bullets (`stackLayers[].points` in `profile.ts`), and a stack outline of all four layers that jumps to each chapter (desktop only). Morph window `W` = 0.09 and the text windows widen to 0.05 to suit the shorter scroll. _Superseded by D9: 450vh, `W` = 0.077, text windows 0.004–0.043._
- Hover arrow nudges (`group-hover:translate-x-1` on "→" links) stay: they point in the link's direction and are user-triggered.

## D9 — Wave chapter, per-point morph and ScrollWords (2026-10-24)

Owner reference: a particle scrollytelling video. The D8 no-sideways rule stays. The hero gains a drop beat between the name and the interface.

- **Wave chapter.** After the name, the points drop into a perspective dotted field across the bottom third of the screen, then condense into Interface in the right column. The drop is near-vertical: `matchByX` pairs points left to right. The field swells in place and its crests roll along z only. Lost: any sideways travel for the wave (D8).
- **Per-point morph replaces the rigid group pose.** Lost: the group transform. It moved every point together, so any side change slid the whole formation sideways even with a per-point stagger. Now each point blends its own two world-space poses in the shader, so a side change reads as the swarm regathering. `Drive` is `{s, from, to}`, with resting values from `chapterPose(i, view)` in place of `poseAt`.
- **Leaving the wave dissolves.** Points lift and thin mid-flight (`uDissolve`), then condense into Interface. Chosen over a direct morph, which would read as a slide.
- **Seven chapters, 450vh.** Chapters come from `CHAPTER_IDS` (intro, wave, interface, api, data, infra, shipped), and the hero is 450vh to fit the extra chapter (was 400vh with six). Morph window `W` = 0.077 (was 0.09). Text windows 0.004–0.043 (was 0.05). `FORMATION_SIDE` = `[0,0,1,1,1,1,0]`.
- **Manifesto and layer grid.** The wave chapter carries the "Nobody sees the stack" copy. The 4-column layer grid below it doubles as navigation.
- **ScrollWords for scroll text.** CSS view timelines on the home page, and one frame-loop `--reveal` variable in the hero, over per-word JS. This keeps scroll state out of React and runs the work off the main thread, the same reasoning as D6.
- **Backups.** Branch `feat/hero-scroll-scenes`. Tags `backup/hero-animation-v1-original` (b60f47e) and `backup/hero-animation-v2-vertical` (29095a9).

## D10 — Wave network, chapter snap, firing ambients and 5-word reveals (2026-10-24)

Owner direction: the scene keeps moving while the page is still, one wheel gesture moves one chapter, and the text reveals more dramatically. D8 (no sideways travel) and D9 (per-point morph) still hold.

- **Wave runs past both screen edges.** `WAVE_FAR` 3.1 (far row), `WAVE_NEAR` 2.1, `WAVE_RATIO` 3.4 columns per row. The edge fade sits at |x| 2.8..3.15, off-screen. `waveCells(field)` recovers the grid from positions. Lost: the narrower wave (2.2 to 1.6) and the fade at |x| 1.7..2.25.
- **Every shape carries a network.** One `THREE.LineSegments` per shape shares the points' uniforms. The wave uses `waveNet` (paths flowing from the horizon toward the viewer). Other shapes use `neuralNet` (110 neurons, 2 nearest links). Depth is the hop count from the cluster's first neuron, packed into 0..0.4, so a pulse cascades and then rests. Links fade in only once both ends have landed. Lost: static edges. Result: the scene keeps moving while the page is still.
- **Chapter snap replaces free rail scroll.** `useChapterSnap(sectionRef, lenis, enabled)` returns `goTo(chapter)`. One gesture moves exactly one chapter (`lenis.scrollTo`, 1.05s, easeInOutCubic). A fling (>900px within the first 220ms) hands the wheel back to Lenis. Lost: the rail calling `lenis.scrollTo` directly with a 1.4s duration. Rail clicks use the same `goTo`, so they never fight the snap. Disabled in the fallback (reduced motion or no WebGL).
- **Ambient backgrounds fire.** `firing.ts` adds `createFiring` (a seeded spiking net: spontaneous rate, carry chance, refractory, pulse travel time) and `nearestLinks`. Lost: the Graph variant lit only near the cursor with static edges, and packets flowing left to right on /contact (now routed upright so packets rise). Details: `docs/specs/ambient-scene.md`.
- **Text reveals are more dramatic.** Driven words use a 5-word window, each going from opacity 0.04 to 1, translateY 0.9em, rotateX -75deg flip-up and scale 0.9, with a 14px blur on desktop only. Lost: the 4-word window, 0.25em rise and 6px blur. Headline reveal: blur 16px, 0.9em rise, scale 0.92, letter-spacing 0.06em.
- **Data layer breadth is shown in copy, not highlights.** Tech: Postgres, MySQL, MongoDB, Redis, Drizzle, Prisma. Bullet: "SQL and NoSQL: Postgres and MySQL for relational data, MongoDB for documents." Hero Data line: "SQL or NoSQL, picked per job: ...". MySQL is the name used; MariaDB is a fork. Lost: highlighted, signal-coloured skill tags (MongoDB, NoSQL). The owner rejected that approach.
- **Autonomous polish added:** the cursor excites graph neurons, networks start mid-activity rather than dead, and rail clicks share the snap.

