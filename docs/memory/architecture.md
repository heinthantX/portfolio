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

## Per-route Lenis feel
Chose separate Lenis tuning per route through `RouteFeel`: home keeps `lerp` 0.09 and `wheelMultiplier` 0.9, other routes use `lerp` 0.18 and `wheelMultiplier` 1. Reason: trackpad scrolling felt heavy on sub-routes, while home's cinematic hero needs the slower feel.
