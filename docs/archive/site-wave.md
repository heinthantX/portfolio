> **Archived 2026-10-24 (D22).** Reverted the same day: the owner meant the particle flow between hero shapes, not a stream across every page. The code is in git at 8d7a1dd (`src/features/site-wave/`).

# Site wave (one stream across every page)

Rationale: `docs/design/DECISIONS.md` D21. Hero: `docs/specs/signal-hero.md`. Replaced: `docs/archive/ambient-scene.md`.

## Architecture
- `src/features/site-wave/`:
  - `SiteWave.tsx`: the gate. Mounted once in `src/app/layout.tsx` as a fixed `-z-10` layer that is `100lvh` tall, `aria-hidden` and `no-print`, so it survives client-side route changes.
    - It waits for WebGL and an idle moment before loading.
    - Points: 16k on desktop, 6k on low-power or mobile devices.
    - `frameloop`: `demand` under reduced motion (one still frame); `never` while the tab is hidden or a modal is open (the body has `data-scroll-locked`); otherwise `always`.
  - `store.ts`: a module ref store. `SignalHero` registers `{progressRef, maskRef, stageRef}` on mount and unregisters on unmount. `useHero()` subscribes to that mount state; per-frame values stay in refs.
  - `WaveCanvas.tsx`: the R3F canvas.
    - The hero's `SignalPoints` (shapes, morphs, text mask) is blended into the stream by `flowMix(progress)` from `timeline.ts`. The final chapter rests at progress 0.925, then dissolves into the flow. Once the stage scrolls away, the canvas is all flow.
    - On pages without a hero, `flow` = 1. Mode changes ease, never pop.
    - Gold packet sprites are a second small `points` object.
  - `waveDriver.ts` (pure, tests in `waveDriver.test.ts`):
    - Spine: the lateral centre along document y. It sums ≥3 value-noise octaves along arc length, adds a domain warp and a mean-reverting heading, and has no sin sway. Features drift downstream over time.
    - Regimes per section: river, braid, delta, fibre, pool, funnel. Section borders are blended with a noise-jittered band. Every 36 s an epoch re-picks each section's regime, unlike its previous pick and unlike its neighbour, with an 8 s crossfade.
    - Card-heavy sections lean to pool. The last section is always the funnel, which converges on the CTA.
    - The stream thins under text, with a floor so it never vanishes. Scroll velocity stirs speed and packet rate.
    - Packets ease into a channel and re-pick at splits. About 10% flash-drop and are resent from upstream; rare acks travel up.
  - `measure.ts`: reads the sections (home ids or `main`'s outer sections), the CTA and text rects into document coordinates. It runs on route change, resize and font load, never per frame.
- `SignalCanvas.tsx` is now used only by the 404 scene (`SignalScene`).

## Edge cases
- Reduced motion shows one still frame. The hero keeps its poster.
- Without WebGL there is no canvas; the CSS dot-grid remains.
- The page-switch view transition (D19) animates only `main`, so the canvas stays put.
