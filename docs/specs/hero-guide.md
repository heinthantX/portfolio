# Hero guide

First-visit guide on the hero. Scene: `signal-hero.md`. Wheel pace: `signal-hero-pace.md`.

## Risks & checks
- Guide replays too often or after the reader scrolled → gate needs scrollY < 4, idle ≥ 4500, sinceLast ≥ 15000 → vitest 79/79 in signal-scene; biome clean (src: vitest, 2026-11-07). Browser-run unverified.
- First play of the session never starts → no stored start gives Infinity → vitest: Infinity before first play (src: vitest, 2026-11-07). Pass.
- Reload replays too early or waits too long → `sinceLast` uses max(last, loadedAt) → vitest: 15000 from last start, reload counts from load (src: vitest, 2026-11-07). Pass.
- Two tabs each play once → `hero-guide-at` is per tab in sessionStorage, so no cross-tab guard → by design; browser-run unverified.
- Input mid-guide fights the peek scroll → peek uses the snap busy/finish path; touch, key and pointerdown abort the current run → Chrome: real wheel mid-flight hid the packet (src: Chrome dev check, 2026-11-07, pre-change). Peek-vs-wheel stop unverified.
- Runs overlap while one is live → per-run `running` flag → unverified.
- Reduced motion, WebGL fallback or hidden tab → no courier, drip or peek → reduced motion: gate falls back, no rail, guide never runs (src: handoff, 2026-11-07). WebGL and hidden-tab unverified.
- Courier targets a stale rail rect after resize or on mobile → rect measured at launch → unverified.
- Drip leaks into other chapters or the home stream → drip term scaled by (1 − e) on shape 0, off when `uDrip` is 0 → unverified.

## Architecture
- `src/features/signal-scene/useHeroGuide.ts` (tests `useHeroGuide.test.ts`) owns the start rule, beat timers and `stop()` (src: git status, 2026-11-07).
- Start rule `shouldStartGuide`: scrollY < 4, visible tab, not reduced motion, not WebGL fallback (src: useHeroGuide.ts, 2026-11-07).
- Idle: ≥ `GUIDE_DELAY_MS` 4500 ms since the last wheel, touchstart, keydown or pointerdown, or since `gate.ready` (src: useHeroGuide.ts, 2026-11-07).
- Spacing: `sinceLast` ≥ `GUIDE_EVERY_MS` 15000 ms; a 1 s `CHECK_MS` interval rechecks the rule (src: useHeroGuide.ts, 2026-11-07).
- `sinceLast(last, loadedAt, now)` = now − max(last, loadedAt); Infinity with no stored start (src: useHeroGuide.ts, 2026-11-07).
- `sessionStorage` `hero-guide-at` holds the last start (ms epoch), per tab session, surviving reloads (src: useHeroGuide.ts, 2026-11-07).
- `dripRef` path: `HeroLink` (src: store.ts, 2026-11-07) → `StreamCanvas` → `SignalPoints` prop.
- `SignalPoints.tsx` `VERT`: about 4% of points fall vertically, scaled by (1 − e) (src: SignalPoints.tsx, 2026-11-07).
- Rail active and hint labels carry `bg-bg/70` (src: SignalHero.tsx, 2026-11-07).

## Core Flows
1. **Start:** the start rule passes (Architecture), the beats run from zero, and `hero-guide-at` is written (src: useHeroGuide.ts, 2026-11-07).
2. **Repeat:** while the reader stays idle at top, the 1 s check starts a new run once `sinceLast` reaches 15 s.
3. **Drip (0–1600 ms):** `uDrip` goes 0 → 1, then grows 1 → 1.5 by 2400 ms (src: SignalPoints.tsx, 2026-11-07).
4. **Courier launch (900 ms):** a packet leaves the formation (src: handoff, 2026-11-07).
5. **Flight (1100 ms):** a curved path (`courierPoints`) to rail tick 02. The path ends on the tick wherever it sits (src: handoff, 2026-11-07).
6. **Hint:** `data-hint` on tick 02 for 1600 ms (src: handoff, 2026-11-07). Chrome: hint true about 1.6 s (src: Chrome dev check, 2026-11-07, pre-change).
7. **Drop:** the packet drops 120 px and fades over 600 ms (src: handoff, 2026-11-07).
8. **Peek:** `peek()` runs at landing + 100 ms (`signal-hero-pace.md` Core Flows 3). Chrome: peak scrollY 450–520 px, then 0 (src: Chrome dev check, 2026-11-07, pre-change).
9. **Abort:** any input calls `stop()` on the current run, which clears timers and rAF, stops animations, sets `dripRef` to 0 and hides the hint (src: useHeroGuide.ts, 2026-11-07). Later runs still start.

## Edge Cases
- First play of the session: no stored start, so it starts after 4.5 s idle at top.
- Reload: the 15 s count restarts at page load, so no repeat before 15 s after load.
- Two tabs: each tab has its own session, so each can play once.
- Hidden tab at start: no start.
- Reduced motion or WebGL fallback: the guide never runs, so no courier, drip or peek.
- Any input during a run aborts that run only. Chrome: a real wheel mid-flight hid the packet (src: Chrome dev check, 2026-11-07, pre-change).
- Drip is scaled by (1 − e) on shape 0 only, and is zero when `uDrip` is 0 (unverified).

## Autonomous UX Polish
- The guide shows the rail and the scroll in one pass on each run.
- Any input aborts the current run, so it never fights the reader.
- Rail labels on bg/70 keep the active name readable over particles (src: SignalHero.tsx, 2026-11-07).
