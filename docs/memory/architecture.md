# Architecture

## Text reveal uses JS IntersectionObserver, not CSS animation-timeline
Chose opt-in `data-paras` regions with per-block IntersectionObserver reveals over bare `data-reveal` CSS `view()` timelines. Blocks are now `p`/`li`/headings/etc. inside a `data-paras` region, plus `[data-block]` for whole rows or cards. Reason: the timeline approach animated per element inconsistently across the sub-routes and gave no hook for late-mounted content. Spec: `docs/specs/text-reveal.md`.

## Reveal arms in the head before first paint
Chose an inline `ARM_SCRIPT` in `src/app/layout.tsx` that adds `html.paras-armed` before paint, over arming after hydration. Reason: arming after hydration hid text that was already painted, so it vanished and reappeared. The class is skipped under reduced motion. A 4s fallback removes it if JS never hydrates, and CSS only hides under the class, so no-JS shows everything.

## Above-the-fold reveals wait for the view transition
Chose a 450ms delay before load-time reveals, with an 80ms stagger per batch. Reason: the page-switch view transition snapshot covers the page for about 0.7s, so earlier reveals played invisibly.

## Stagger replaces the left slide for home rows
Chose `data-block="stagger"` over the left-entry `data-block="slide"` for home rows. The container stays still and each `[data-part]` child is observed and revealed on its own entry. Reason: rows used to reveal as one block triggered by their top edge, so on narrow screens (stacked Featured work cards) the lower text finished animating off-screen and "only animated sometimes". The slide was also the only sideways reveal. Spec: `docs/specs/text-reveal.md`.

## Home reveals replay on scroll back
Chose to reset home reveals once a target has scrolled fully past the bottom edge (a second observer, `below`, cancels the reveal and removes it from `reveals`), over reveal-once. Reason: the home page is one long scroll, and once-only reveals left the second pass static. Sub-routes keep reveal-once with unobserve. Targets that leave upward stay shown. Spec: `docs/specs/text-reveal.md`.

## One Lenis feel on every route
_Decision_

Chose one Lenis tuning (`lerp` 0.2, `wheelMultiplier` 1) on every route over per-route `RouteFeel`. Owner asked to stop slowing the whole page and to remove other pages' scroll restrictions. Source: `src/components/site/smooth-scroll.tsx`, 2026-11-07.

## Hero wheel: speed threshold instead of free mode
_Decision_

Chose a speed threshold over a free/fling mode: a fast gesture steps one chapter, a slow one scrubs. Owner: any scroll faster than the threshold should only go to the next page. Threshold is about 422 px/s at a 900 px viewport (src: `src/features/signal-scene/useChapterSnap.ts`, 2026-11-07). A fast gesture on the last chapter follows, so the page leaves the hero.

## Slow wheel holds before finishing
_Decision_

Chose a 1.2 s hold after a slow gesture stops over finishing at once, so resting fingers pause the morph mid-way. Browsers cannot see trackpad fingers, so a still hold and a still release look alike. Eight shrinking deltas in a row count as inertia (release) and finish after GAP_MS 160. Source: `src/features/signal-scene/useChapterSnap.ts` (`endGesture`), 2026-11-07. Spec: `docs/specs/signal-hero-pace.md`.

## Hero guide replays every 15s while idle
_Decision_

Chose sessionStorage with a 15 s spacing over the 60 s localStorage rule. Owner: the session's first play comes after 4.5 s idle; later plays every 15 s. `sinceLast` = now − max(last start, page load), Infinity with no stored start. Rule: scrollY < 4, 4500 ms idle since last input, sinceLast ≥ 15000, visible tab, no reduced motion, no WebGL fallback. Last start is `sessionStorage` `hero-guide-at`, per tab. A 1 s interval rechecks; input aborts only the current run. Source: `src/features/signal-scene/useHeroGuide.ts`, 2026-11-07. Spec: `docs/specs/hero-guide.md`.
