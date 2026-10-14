# Concept Panel — Claude Sonnet 4.6 (Thinking)

---

### 1. Control Room

- **Idea:** The hero is a live ops dashboard frozen mid-incident — metric graphs flatline, one container goes red — then you scroll to resolve it, ending on all-green deployed.
- **Shows full-stack + DevOps by:** Every layer of the stack appears as a rack-mounted instrument panel (browser row → API row → DB row → infra row); scrolling through an on-call runbook is the site's core metaphor, proving the engineer owns the whole system under pressure.
- **Scroll storyboard:**
  1. **0–15%** — Camera close on a single glowing amber alert badge; pull back to reveal four horizontal instrument rows stacked in 3/4 perspective, all nominal except one flashing red container.
  2. **15–35%** — Rows separate (exploded), each labelled; a packet trace line crawls downward through them, spotlighting the bad container.
  3. **35–55%** — Container restarts: a scale-out counter ticks 1 → 3 → 6 → 12, graph lines climb back to nominal, packets flow freely.
  4. **55–75%** — Camera pivots to show the full grid head-on; telemetry callouts (latency, RPS, error-rate) render around the edges in Geist Mono.
  5. **75–90%** — Rows close back together; status badge flips from amber to green `DEPLOYED ✓`.
  6. **90–100%** — Scene settles into idle; About text fades in beside it.
- **Interactions:**
  - Hover any instrument row (exploded phase) → row brightens edges + inline metric readout animates to a peak value.
  - "Trigger incident" easter egg: typing `panic` in the `⌘K` palette flashes all rows red, kicks off the resolution animation, ends at `DEPLOYED ✓` — a silent flex on debugging instincts.
  - Pointer parallax tilt on desktop; disabled on touch.
- **Site experience:**
  - Palette unchanged (graphite / amber / `--ok` green); typography adds a subtle scanline texture on the mono status strips only — one CSS `repeating-linear-gradient`, 1 px at 4% opacity.
  - Sections reveal with a vertical wipe from a hairline, not a plain fade — each section "prints" onto the page like a terminal line.
  - Page transitions use the View Transitions API: shared element morphing on project covers so the grid card stretches into the case-study hero.
- **Tech approach:** Procedural `PlaneGeometry` strips for instrument rows; `InstancedMesh` for container cubes and packet spheres; custom TSL fragment shader for the amber glow pulse on alert badges (smooth sine wave on `uTime`); `@react-three/postprocessing` bloom on the red alert only; GSAP SplitText for the metric counter tick-up; Lenis + ScrollTrigger scrub drives `uScrollProgress` uniform.
- **Risks:**
  - Performance: **med** — two post-processing passes (bloom + subtle vignette); `PerformanceMonitor` drops bloom first.
  - Mobile: **low** — rows are flat geometry, no heavy meshes; drop bloom entirely on mobile.
  - Build time: **low** — no GLTF, all procedural; 3D work fits in ~1.5 h.
- **Key-frame prompts:**
  1. Dark graphite background, isometric technical illustration, thin precise lines, soft amber (#E8A33D) light accents, subtle depth of field, minimal, no text, no logos, no people, no UI screenshots. Four horizontal instrument panel slabs in a stacked isometric rack, one slab glowing amber-red at its left edge, thin telemetry lines arcing between them, emergency-status aesthetic.
  2. Dark graphite background, isometric technical illustration, thin precise lines, soft amber (#E8A33D) light accents, subtle depth of field, minimal, no text, no logos, no people, no UI screenshots. The same four slabs compressed back into a single block, a small green ring pulsing at its base, all telemetry lines resolved and calm.

---

### 2. Pipeline

- **Idea:** A single CI/CD pipeline rendered as a luminous 3D tube that the camera flies through — each chamber is a build stage — ending as the artifact exits into the public internet.
- **Shows full-stack + DevOps by:** The pipeline literally *is* the DevOps workflow (lint → test → build → push → deploy → health-check); each chamber houses the relevant code or infra layer, making the connection between "writing code" and "running in production" viscerally clear.
- **Scroll storyboard:**
  1. **0–10%** — Wide exterior view: a curved hexagonal tube receding into the distance on a dark void; a commit badge enters the mouth with a soft amber flash.
  2. **10–30%** — Camera flies inside the tube; first chamber glows: lint & typecheck nodes spin briefly, all turn green.
  3. **30–50%** — Second chamber: miniature test runners represented as small glowing orbs run in parallel, pass, merge into one artifact sphere.
  4. **50–65%** — Third chamber: Docker layer rings wrap around the artifact sphere; a container cylinder assembles.
  5. **65–80%** — Fourth chamber: Kubernetes pod grid scales out; the container lands on a node; replica count ticks up.
  6. **80–95%** — Camera exits the tube's far end; artifact emerges, a green health-check ring confirms it; `DEPLOYED ✓` status.
  7. **95–100%** — Camera pulls back; About / hero text settles into the left column.
- **Interactions:**
  - Click any chamber label (desktop, exploded nav overlay) → camera lerps to that chamber, showing its detail; scroll continues from there.
  - "Re-run pipeline" button outside scroll replays chambers 1–6 with fresh amber flash.
  - Easter egg: `⌘K` → type `git push --force` → all chambers flash red, camera shakes one frame, status reads `build failed · please don't do that`.
- **Site experience:**
  - Slightly warmer graphite for the tube interior (`#0E1115`); exterior void uses pure `--bg`; accent amber used only for the artifact sphere and active-stage glow.
  - Section transitions: horizontal slide driven by `clip-path` expanding from a thin vertical line — evokes a stage gate opening.
  - Custom cursor: a small crosshair `+` in `--muted` that brightens to amber when over interactive elements.
- **Tech approach:** Extruded `TubeGeometry` along a `CatmullRomCurve3` path; camera position driven by `getPointAt(scrollProgress)` with `maath` damping; each chamber is an `<group>` with `InstancedMesh` internals; TSL vertex shader distorts the tube walls subtly with a sine wave on `uTime`; bloom only on artifact sphere and green ring; GSAP ScrollTrigger scrubs `uT` uniform for camera progress; no GLTF.
- **Risks:**
  - Performance: **med** — camera fly-through requires continuous render; `frameloop="demand"` not usable during scroll; compensate with `AdaptiveDpr`.
  - Mobile: **med** — tube interior is GPU-heavy on low-end; fallback replaces interior fly-through with a 2D pipeline SVG animation (DrawSVG).
  - Build time: **med** — camera path tuning and chamber staging is fiddly; allow ~2 h.
- **Key-frame prompts:**
  1. Dark graphite background, isometric technical illustration, thin precise lines, soft amber (#E8A33D) light accents, subtle depth of field, minimal, no text, no logos, no people, no UI screenshots. A luminous hexagonal tube receding in perspective into deep space, a glowing amber sphere entering its mouth, thin circuit-trace lines running along the tube's facets.
  2. Dark graphite background, isometric technical illustration, thin precise lines, soft amber (#E8A33D) light accents, subtle depth of field, minimal, no text, no logos, no people, no UI screenshots. The far exit of the same hexagonal tube, a bright green ring hovering at the opening, a clean container cylinder just emerging into open dark space.

---

### 3. Topology

- **Idea:** The hero is a live distributed-system graph — nodes for every layer — that assembles from scattered particles as you scroll, revealing the engineer's mental model of a running system.
- **Shows full-stack + DevOps by:** Nodes are typed by layer (browser, API, worker, DB primary, DB replica, cache, load-balancer, CI runner); edges carry amber packets at realistic rates; the graph is the architecture, not a decoration — it IS the full-stack + DevOps story told spatially.
- **Scroll storyboard:**
  1. **0–15%** — ~200 dim particles drift randomly; headline and tagline are readable; a faint amber attractor pulse begins.
  2. **15–35%** — Particles converge, snapping into node positions with a staggered spring pop; edges draw in simultaneously using `QuadraticBezierLine`; graph settles into a calm isometric layout.
  3. **35–55%** — Amber packets flow along edges, tracing a request path from browser node → LB → API → DB; each node pulses softly as a packet passes.
  4. **55–70%** — "Scale event": 2 API nodes clone out to 5, 1 DB replica becomes 2; new edges draw in; packet rate increases proportionally; status: `scaling…`.
  5. **70–85%** — A CI node pulses, sends a deploy packet to each API node; nodes briefly flash the deploy colour then settle green; status: `deployed ✓`.
  6. **85–100%** — Graph compresses into a tight icon (~4 × 4 units) that becomes the footer glyph; About content fully visible.
- **Interactions:**
  - Hover any node (assembled phase) → tooltip-free highlight: node ring brightens, its two nearest edges glow, mono label fades in beside it.
  - Drag to rotate (desktop, `PresentationControls` from drei) during the "explore" phase (after step 3); scroll resumes normally.
  - Easter egg: click the load-balancer node three times rapidly → it spawns 10 API nodes with a satisfying spring pop, packet rate maxes out for 2 seconds, then gracefully scales back — a quiet nod to the "10× traffic spike" story every DevOps engineer has.
- **Site experience:**
  - Same graphite palette; the graph glow gives the hero a faint cool-blue ambient (`#1A2230` on the canvas `fog` near-plane only) so the amber packets read cleanly without changing the brand tokens.
  - Sections below the hero use a generous left-edge accent line that draws down as you scroll — the same "edge as signal" motif from the graph.
  - No page-level scroll-jacking; only the hero canvas is scrubbed. All other sections reveal with `useReveal` fade + rise. Feels calm and editorial after the energetic hero.
- **Tech approach:** `InstancedMesh` for ~60 nodes (sphere + ring geometry merged); `QuadraticBezierLine` from drei for ~90 edges; packet positions computed in a custom TSL shader keyed to `uTime` and `uScrollProgress` — zero React state in the hot path; `@react-three/rapier` impulse for the particle-to-node snap animation (low body count, safe on mobile); `AdaptiveDpr` + `PerformanceMonitor` reduce node count on weak devices; bloom only on packet spheres.
- **Risks:**
  - Performance: **med** — ~150 draw calls before instancing; instancing brings it under 20; Rapier adds ~60 KB WASM but loads async.
  - Mobile: **low-med** — reduce to 30 nodes and 40 edges on mobile; disable Rapier snap (use tween instead); graph still reads clearly.
  - Build time: **low** — graph layout is data-driven from `profile.ts` layer data; node positions computed once at mount; no manual mesh tuning needed; ~1.5 h.
- **Key-frame prompts:**
  1. Dark graphite background, isometric technical illustration, thin precise lines, soft amber (#E8A33D) light accents, subtle depth of field, minimal, no text, no logos, no people, no UI screenshots. A cloud of two hundred dim grey particles suspended mid-scatter in deep space, a faint amber pulse at the geometric center beginning to attract them, sense of imminent assembly.
  2. Dark graphite background, isometric technical illustration, thin precise lines, soft amber (#E8A33D) light accents, subtle depth of field, minimal, no text, no logos, no people, no UI screenshots. A clean isometric distributed-system node graph fully assembled, twelve geometric nodes connected by thin bezier-curve edges, tiny amber spheres mid-flight along several edges, a calm engineering diagram aesthetic.
