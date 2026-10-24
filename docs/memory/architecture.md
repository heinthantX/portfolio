# Architecture

## Text reveal uses JS IntersectionObserver, not CSS animation-timeline
Chose opt-in `data-paras` regions with per-block IntersectionObserver reveals over bare `data-reveal` CSS `view()` timelines. Blocks are now `p`/`li`/headings/etc. inside a `data-paras` region, plus `[data-block]` for whole rows or cards. Reason: the timeline approach animated per element inconsistently across the sub-routes and gave no hook for late-mounted content. Spec: `docs/specs/text-reveal.md`.

## Reveal arms in the head before first paint
Chose an inline `ARM_SCRIPT` in `src/app/layout.tsx` that adds `html.paras-armed` before paint, over arming after hydration. Reason: arming after hydration hid text that was already painted, so it vanished and reappeared. The class is skipped under reduced motion. A 4s fallback removes it if JS never hydrates, and CSS only hides under the class, so no-JS shows everything.

## Above-the-fold reveals wait for the view transition
Chose a 450ms delay before load-time reveals, with an 80ms stagger per batch. Reason: the page-switch view transition snapshot covers the page for about 0.7s, so earlier reveals played invisibly.

## Slide-in is entry-only, from the left
`data-block="slide"` (What I do and Experience rows on home) slides in from the left once when it enters. Reason: this is a one-shot entry, not a sway. It follows the D12 precedent for hero text. It is the only reveal that moves sideways, and it must not be made repeating or ping-pong.

## Per-route Lenis feel
Chose separate Lenis tuning per route through `RouteFeel`: home keeps `lerp` 0.09 and `wheelMultiplier` 0.9, other routes use `lerp` 0.18 and `wheelMultiplier` 1. Reason: trackpad scrolling felt heavy on sub-routes, while home's cinematic hero needs the slower feel.
