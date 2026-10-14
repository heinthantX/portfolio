# Design spec (final, from Phase R)

> **Hero scene superseded (2026-10-15 03:20):** the owner rejected the slab-stack scene below. The hero is now **"Signal"**, a particle formation that morphs per chapter, with the text flowing opposite it; see DECISIONS.md **D7** and `src/features/signal-scene/`. The rest of this spec still applies: sheets framing, theme moods (D4), fallbacks, perf tiers and the 404 variant. The slab-specific parts (phases, HUD, "Ship it again") are kept only as history.

Where this file and the handoff disagree, this file wins on creative matters; the handoff wins on the floor (a11y, fallbacks, mobile, content safety) and the run rules. Rationale lives in `DECISIONS.md`.

## 1. Concept: "Blueprint → Stack → Cluster"

**One line:** the hero starts as a technical drawing of a four-layer system, extrudes into machined hardware, runs real traffic, scales its infrastructure like a cluster, and locks together as deployed.

Story: *spec → build → run → operate → ship* — the same arc as the owner's work, from the interface to the infrastructure.

### Scene objects (`src/features/stack-scene/`)

| Layer | Label (from `profile.stackLayers`) | Objects |
|---|---|---|
| INTERFACE | `INTERFACE · React · Next.js · React Native` | 6 thin floating card panels in a grid + 1 phone-shaped panel (instanced) |
| API | `API · NestJS · Go · …` | 8 octahedron route nodes + thin route lines |
| DATA | `DATA · Postgres · Redis · …` | 3 cylinders (primary + 2 replicas) + 1 cache cube |
| INFRA | `INFRA · Docker · Kubernetes · …` | a 4×3 node-plate grid with pods (instanced, 3 → 12, max 24 on desktop) — the Cluster concept lives here |

Slabs are thinner and smaller than the prototype (about 3.2 × 0.12 × 3.2) so the objects on them carry the read, not big dark boxes. Every slab has crisp edges (`--line-strong`, brighter on hover).

### Scroll timeline (hero section is ~400vh; sticky canvas on the right on desktop, full-bleed behind text on mobile)

| Progress | Phase | What happens | Status line |
|---|---|---|---|
| 0–0.14 | **DRAW** | Ortho-like top-front view. Only outlines: slab rectangles, object footprints, dimension lines and leader lines draw themselves on (dash-offset), on the dot grid. Headline fully readable. | `drafting spec…` |
| 0.14–0.32 | **BUILD** | Camera eases to 3/4 perspective; outlines extrude into solids (scale.y 0→1, opacity 0→1), objects pop in per layer, top to bottom. | `building…` |
| 0.32–0.50 | **EXPLODE** | Layers separate vertically; labels with leader lines fade in one by one. | `4 layers · ready` |
| 0.50–0.68 | **RUN** | Amber packets (one InstancedMesh) travel Interface → API → Data and back; each node/cylinder lights as one passes. About text sits beside. | `routing requests` |
| 0.68–0.86 | **SCALE** | INFRA pods 3 → 12 with staggered pop-in; one node fails (dims, its pods reschedule), then a rollout wave sweeps the grid. Packet burst is absorbed. | `scaling 3 → 12` → `node-07 lost · rescheduling` |
| 0.86–1.00 | **DEPLOYED** | Layers close together; one soft ring pulses once around the base in `--ok`. | `deployed ✓` |

Timeline rules (unchanged from the handoff): GSAP ScrollTrigger (scrub) writes a progress ref only; components read it in `useFrame` and ease with `maath`. No React state in the hot path. Reversible.

### Interactions
- **Ship it again** button: replays SCALE → DEPLOYED (a 2.4 s tween on a separate `replay` ref) without moving the scroll.
- **Pointer tilt** (desktop, fine pointer only), max ±4°.
- **Hover a layer** (EXPLODE/RUN phases, desktop): edges brighten, label to full opacity.
- **Click a node plate** (desktop) in SCALE/DEPLOYED: kills it; pods reschedule (Cluster prototype).
- **⌘K easter eggs:** `whoami`, `ls projects`, `kubectl get skills`, `kubectl delete pod <section>` scrolls to it.

### Theme moods (D4)
- **Dark — control room at night:** graphite slabs (`--surface`, physical material, clearcoat), edges `--line-strong`, packets emissive `--accent` + bloom (desktop only), deploy ring glows `--ok`.
- **Light — blueprint on paper:** paper slabs (`--surface`, matte, roughness 0.9), ink edges (`--text` at 70%), packets solid `--accent-strong`, no bloom, ring as a crisp `--ok` stroke. The DRAW phase looks like ink on paper.
- Colours come from CSS tokens via `useThemeColors()`; on theme change materials ease over ~450 ms.

### Performance tiers
- Desktop: DPR ≤ 2, 40 packets, 24 pods, bloom on packets only.
- Mobile / `PerformanceMonitor` decline: DPR ≤ 1.5, 12 packets, 8 pods, no bloom, no shadows.
- `frameloop="demand"` when the hero is off-screen (IntersectionObserver). Canvas loads via `next/dynamic` `ssr:false` after first paint; the LCP element is the headline text.

### Fallbacks
- `prefers-reduced-motion` or no WebGL → `<picture>` poster (screenshot of DEPLOYED, dark + light) and plain fades.
- 404: same scene, EXPLODE pose, API layer replaced by a dashed outline; status `404 · layer not found`; "Restore" goes home.

## 2. Site language

- **Sheets:** each home section is a drawing sheet. The eyebrow reads like a title block: `03 / experience` on the left, `SHEET 03 / 08` muted on the right (desktop). Sections are separated by full-width hairlines that draw in left→right.
- **Palette:** as the handoff §8.2 tokens (unchanged; all four panelists kept it). One accent (amber); green only for deployed/success.
- **Type:** Geist + Geist Mono, as §8.3.
- **Motion language:** mechanical and precise — short eased snaps (150/250/450 ms, `--ease-enter`), lines that draw, never floaty springs. Reveal = fade + 16 px rise, 60 ms stagger (`RevealController`).
- **Status HUD:** the hero status line is a small mono panel (from the Cluster prototype): phase name, progress bar, layers/pods counts, status text. It lives in the DOM (accessible, `aria-live="polite"` only on phase changes), not in WebGL.
- **Theme switch:** View Transitions circular reveal from the toggle (instant under reduced motion).
- **Layouts:** §8.4–8.5 of the handoff stand, with the sheet framing above.
