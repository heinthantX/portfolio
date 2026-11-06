# Hero scroll pace

Wheel behaviour inside the hero, and the one Lenis feel used on every route. Scene: `signal-hero.md`.

## Risks & checks
- Fast wheel at the last chapter is swallowed → page stuck on Shipped → Chrome: 8 fast scrolls → leave the hero (src: Chrome dev check, 2026-11-07). Pass at 0.7 s pace; not re-run at 1 s (unverified).
- Threshold too low → every trackpad scroll steps, slow scrub never works → unit test: speed under chapterPx/STEP_S follows, over it steps → vitest 75/75 pass in signal-scene (src: vitest, 2026-11-07). Per-case assertion unverified.
- One fast scroll from top overshoots → Chrome: one fast scroll from top → lands on chapter 02 only (src: Chrome dev check, 2026-11-07). Pass at 0.7 s pace; not re-run at 1 s (unverified).
- Uncapped wheel outside the hero jumps on free-spin wheels → cap kept inside hero follow only → Chrome: one 10-tick scroll outside the hero → moved 1000px (src: Chrome dev check, 2026-11-07). Owner accepted uncapped scroll.
- Decaying trackpad tail queues a second chapter → sustained re-count needs |delta| ≥ 0.7 × peak → unit test → unverified.
- Progress feels delayed → displayed progress easing too slow → rate 16 kept (was 5) → Chrome catch-up check → unverified.
- Still hold and still release look alike → morph waits 1.2 s after a real stop → Chrome: slow swipe, then rest → finish at 1.2 s → unverified.
- Inertia shorter than 8 shrinking deltas → 1.2 s hold instead of 160 ms → Chrome: trackpad fling → finish after the tail → unverified.
- Mouse notch sends no shrinking run → holds 1.2 s → Chrome: mouse notch, then stop → finish at 1.2 s → unverified.

## Architecture
- `useChapterSnap.ts` (tests `useChapterSnap.test.ts`): `useChapterSnap(sectionRef, lenis, enabled)` returns `{ goTo, peek }`. Pure helpers `nextStop` and `settleStop` are tested.
- Pace defaults: `STEP_S` 1 s, `MIN_S` 0.4 s (src: useChapterSnap.ts, 2026-11-07).
- `.env.example` documents the same defaults, 1 s and 0.4 s (src: .env.example, 2026-11-07).
- Hold: `endGesture` reschedules until `HOLD_MS` 1.2 s after the last wheel event, unless `fading` reaches `RELEASE_RUN` 8 (src: useChapterSnap.ts, 2026-11-07).
- `fading` counts consecutive shrinking non-fresh deltas (src: useChapterSnap.ts, 2026-11-07). Browsers cannot see trackpad fingers, so 1.2 s is the compromise.
- Build-time overrides `NEXT_PUBLIC_CHAPTER_STEP_S` and `NEXT_PUBLIC_CHAPTER_MIN_S` (src: .env.example, 2026-11-07). Bad values fall back to defaults; minimum is capped at step (unverified).
- `wheelMode({speed, chapterPx})` picks step or follow. `HERO_GAIN` 1.15 (src: useChapterSnap.ts, 2026-11-07). The `HERO_LERP` swap is removed (src: useChapterSnap.ts, 2026-11-07).
- `PEEK_P` is shapeIndex ≈0.3 in `timeline.ts` (src: timeline.ts, 2026-11-07).
- `src/components/site/wheel.ts`: `interceptWheel(fn)` registers the hook. `routeWheel` (renamed from `capWheelDelta`) calls it, then `preventDefault` and returns false. Global 120 px cap removed (src: wheel.ts, 2026-11-07).
- `src/components/site/smooth-scroll.tsx`: Lenis `lerp` 0.2 and `wheelMultiplier` 1 on every route. `RouteFeel` removed (src: smooth-scroll.tsx, 2026-11-07).
- Hero displayed progress: `easeToward` rate 16, was 5 (src: SignalHero.tsx, 2026-11-07).

## Core Flows
1. **Wheel (hero only):** `routeWheel` swallows each event. Speed is the raw WheelEvent delta (deltaMode adjusted) over a 100 ms window (unverified).
   - **Fast:** steps one chapter when `speed` × 1.15 × `STEP_S` > `chapterPx`, about 422 px/s at a 900 px viewport (src: useChapterSnap.ts, 2026-11-07).
   - **Slow:** the page follows the hand (scrub) at delta gain 1.15.
   - **Slow hold:** a follow gesture that stops holds its place for `HOLD_MS` 1.2 s, then finishes the chapter (src: useChapterSnap.ts, 2026-11-07).
   - **Release:** 8 shrinking deltas in a row (`RELEASE_RUN`) read as trackpad inertia, so the chapter finishes after `GAP_MS` 160 ms (src: useChapterSnap.ts, 2026-11-07).
   - **Last chapter:** a fast gesture with no next stop follows, so the page leaves the hero (see Risks).
   - **Re-count:** a sustained count needs |delta| ≥ 0.7 × peak, so a decaying trackpad tail never queues a second chapter (src: useChapterSnap.ts, 2026-11-07).
   - **Follow cap:** per-event delta capped at ±120 px × 1.15, inside the hero only (src: useChapterSnap.ts, 2026-11-07).
   - **Trackpad push (unverified):** a new push is a delta ≥ 20 and more than 3× the trough after the peak. The trough resets on ramp-up.
   - **Wheel during a glide:** stops the glide in place (`scrollTo` at `animatedScroll`, immediate), then follows (unverified).
   - **Removed:** free, fling and burst modes (src: useChapterSnap.ts, 2026-11-07).
2. **Settle (touch, keys, scrollbar):** `settleStop` runs once scrolling is quiet. Past the nudge, it finishes in the direction of travel (unverified). Touch pointers never set `pressed`; `pointercancel` counts as `pointerup` (unverified).
3. **Peek (hero guide):** `peek()` glides to `PEEK_P` in 0.6 s and back in 0.8 s through the finish/busy path (src: useChapterSnap.ts, 2026-11-07). A wheel during a peek stops it and follows (unverified).
4. **Chapter jumps:** the rail, stack outline and layer grid call `goTo` and use the same pace (`signal-hero-chapters.md`).
5. **Busy tracking:** the snap tracks a `busyUntil` timestamp, not `onComplete`, because Lenis drops `onComplete` on interrupt (`docs/memory/fixes.md`).

## Edge Cases
- Outside the hero section: no snap and no cap. Chrome: one 10-tick scroll moved 1000px (src: Chrome dev check, 2026-11-07).
- Reduced motion or no WebGL: chapter snap is disabled (see `signal-hero.md`).
- A wheel during a glide or a playing chapter never moves the page twice (unverified).
- A decaying inertia tail after a fast gesture never queues a second chapter (Core Flows 1).
- Resting fingers pause the morph mid-way for 1.2 s, then it finishes (Core Flows 1). Chrome check unverified.

## Autonomous UX Polish
- One scroll feel on every route, so sub-pages scroll the same way home does (src: smooth-scroll.tsx, 2026-11-07).
- Fast gestures skip one chapter and slow ones scrub, so there is no mode to learn.
- Faster progress catch-up (rate 16) targets the owner's "feels delayed" report (unverified).
