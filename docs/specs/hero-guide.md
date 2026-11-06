# Hero guide

First-visit guide on the hero, on every chapter 0–6. Scene: `signal-hero.md`. Wheel pace: `signal-hero-pace.md`.

## Risks & checks
- Guide replays too often or after the reader moves → start needs rest stop, quiet ≥ guideWait, visible tab → vitest 159/159 full suite; biome clean (src: vitest, 2026-11-07). Browser run pending.
- First play never starts → guideWait 4500 before any play → vitest suite passes; per-case unverified (src: vitest, 2026-11-07).
- Reload replays too early or waits too long → quiet marks include readyAt → unverified; browser run pending.
- Guide on chapters 1–6 launches from the wrong place → courier uses the chapter captured at start → unverified; browser run pending.
- Drip never shows at rest → weight is `smoothstep(0.6, 1.0, abs(2.0 * e - 1.0))`, 1 at either rest and 0 mid-morph (src: SignalPoints.tsx:265, 2026-11-07).
- Input mid-guide or overlapping runs fight the peek → any input aborts; per-run `running` flag → Chrome: real wheel mid-flight hid the packet (src: Chrome dev check, 2026-11-07, pre-change). Re-run pending.
- Two tabs each play once → `hero-guide-at` is per tab in sessionStorage → by design; browser unverified.
- Reduced motion, WebGL fallback or hidden tab → no courier, drip or peek → handoff only (src: handoff, 2026-11-07); browser unverified.
- Courier targets a stale rail rect after resize or on mobile → rect measured at launch → unverified.
- Drip leaks into other chapters → drip scaled by (1 − e) on shape 0, zero at uDrip 0 → unverified.

## Architecture
- `src/features/signal-scene/useHeroGuide.ts` (tests `useHeroGuide.test.ts`) owns the start rule, beat timers and `stop()` (src: git status, 2026-11-07).
- `shouldStartGuide({ atStop, quietMs, played, reducedMotion, visible, fallback })` decides each start (src: handoff, 2026-11-07).
- `resting()` in `useChapterSnap` returns the stop index within `REST_PX` of scrollY, else −1 (src: handoff, 2026-11-07).
- `resting()` returns −1 while busy, touching, pressed, or when mode is not "pass" (src: handoff, 2026-11-07).
- `quietMs(now, [lastInput, settledAt, lastStart, readyAt])` works on `Date.now` marks (src: handoff, 2026-11-07).
- `settledAt` is set when `resting()` changes; a 250 ms check loop (`CHECK_MS`) rechecks the rule (src: handoff, 2026-11-07).
- `guideWait(played)`: 4500 ms before any play this tab session, else 15000 ms (src: handoff, 2026-11-07).
- `sessionStorage` `hero-guide-at` holds the last start (ms epoch), per tab session (src: handoff, 2026-11-07).
- Removed: `sinceLast`, `idleMs`, `sinceLastMs`, `atTop` (src: handoff, 2026-11-07).
- Courier launch: `formationCentre(i, aspect, mobile)` in `timeline.ts`; mobile uses the top of `blockRefs[i]` (src: handoff, 2026-11-07).
- Peek target `peekProgress(i)` = boundary(i) − 0.2W, shapeIndex ≈ i + 0.3 (src: handoff, 2026-11-07).
- Last chapter peek target: `FLOW_FROM + 0.3 × (1 − FLOW_FROM)` = 0.9615 (src: handoff, 2026-11-07).
- Drip rest term `dripRest = smoothstep(0.6, 1.0, abs(2.0 * e - 1.0))` × (1 − fm) (src: SignalPoints.tsx:265-266, 2026-11-07).
- `dripRef` path: `HeroLink` (src: store.ts, 2026-11-07) → `StreamCanvas` → `SignalPoints` prop.
- `SignalPoints.tsx` `VERT`: about 4% of points fall vertically, scaled by (1 − e) (src: SignalPoints.tsx, 2026-11-07).
- Rail active and hint labels carry `bg-bg/70` (src: SignalHero.tsx, 2026-11-07).

## Core Flows
1. **Start:** `shouldStartGuide` passes on the chapter i (0–6) current at start; beats run from zero; `hero-guide-at` is written (src: handoff, 2026-11-07).
2. **Repeat:** the 250 ms check starts a new run once quiet reaches `guideWait` (src: handoff, 2026-11-07).
3. **Drip (0–1600 ms):** `uDrip` goes 0 → 1, then grows 1 → 1.5 by 2400 ms (src: SignalPoints.tsx, 2026-11-07).
4. **Courier launch (900 ms):** a packet leaves `formationCentre(i, aspect, mobile)` (src: handoff, 2026-11-07).
5. **Flight (1100 ms):** curved `courierPoints` path to rail tick i+1 on chapters 0–5 (src: handoff, 2026-11-07).
6. **Hint:** `data-hint` on tick i+1 for 1600 ms. Chrome: hint true about 1.6 s on tick 02 (src: Chrome dev check, 2026-11-07, pre-change).
7. **Drop:** the packet drops 120 px and fades over 600 ms (src: handoff, 2026-11-07).
8. **Last chapter (6):** the packet flies to bottom centre (80% stage height) and drops; no hint (src: handoff, 2026-11-07).
9. **Peek:** `peek(i)` runs at landing + 100 ms (`signal-hero-pace.md` Core Flows 3). Chrome: peak scrollY 450–520 px, then 0 (src: Chrome dev check, 2026-11-07, pre-change).
10. **Abort:** any input calls `stop()`: clears timers and rAF, stops animations, sets `dripRef` to 0, hides the hint (src: handoff, 2026-11-07). Later runs still start.

## Edge Cases
- First play of the session: no stored start, so 4.5 s of quiet is needed (src: handoff, 2026-11-07).
- Later plays: 15 s of quiet since the latest of input, settle, last start or ready (src: handoff, 2026-11-07).
- Reload: `played` comes from sessionStorage, so the wait is 15 s of quiet from page ready (src: handoff, 2026-11-07).
- Two tabs: each tab has its own `hero-guide-at`, so each plays on its own clock.
- Hidden tab at start: no start.
- Reduced motion or WebGL fallback: the guide never runs, so no courier, drip or peek.
- Any input during a run aborts that run only. Chrome: pre-change, a real wheel mid-flight hid the packet (src: Chrome dev check, 2026-11-07, pre-change).
- Last chapter (6): courier to bottom centre, no hint, peek to 0.9615.
- Drip is scaled by (1 − e) on shape 0 only, and is zero when `uDrip` is 0 (unverified).

## Autonomous UX Polish
- The guide runs on every chapter, so a reader who settles mid-hero still sees the rail (src: handoff, 2026-11-07).
- Any input aborts the current run, so it never fights the reader.
- Rail labels on bg/70 keep the active name readable over particles (src: SignalHero.tsx, 2026-11-07).
