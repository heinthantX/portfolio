# Fixes

## Lenis virtualScroll returning false does not stop native scroll
Root cause: returning `false` from Lenis's `virtualScroll` callback skips Lenis's own handling, but it does not call `preventDefault` on the native wheel event. The browser still scrolls the page natively, so the wheel interceptor appeared to do nothing.
Fix: the interceptor calls `event.preventDefault()` itself, then returns `false` to swallow the event. In this repo that happens in `src/components/site/wheel.ts` (`interceptWheel` and `capWheelDelta`). See `docs/specs/signal-hero.md`.

## Lenis drops scrollTo onComplete when interrupted
Root cause: Lenis does not call a `scrollTo` `onComplete` when the scroll is interrupted by touch or by a new `scrollTo`. Chapter snapping that waited on `onComplete` stalled and never released its lock.
Fix: `useChapterSnap` (`src/features/signal-scene/useChapterSnap.ts`) tracks a `busyUntil` timestamp instead of relying on `onComplete`. See `docs/specs/signal-hero.md`.

## Lenis scrollTo handback drops the swallowed delta
Root cause: during a duration `scrollTo`, Lenis keeps `targetScroll` near the animated position. Handing the wheel back to Lenis mid-step therefore lost all the delta the step had swallowed. A fling moved about 30px.
Fix: on going free, credit the delta the gesture already sent (from + held) to Lenis explicitly. See `docs/specs/signal-hero.md` (Core Flows 10) and `docs/design/DECISIONS.md` D11.

## Snap easeInOut reads as lag on a swipe
Root cause: an easeInOut step barely moves in its first 200ms, so a swipe's page reaction looked delayed.
Fix: snaps use ease-out curves. Swipes use `easeSwipe` = 1-(1-t)^2, which moves from the first frame. Slow settles use easeOut. See `docs/design/DECISIONS.md` D11.

## Trackpad push misread from the previous delta
Root cause: comparing each delta with the previous one reads a swipe's own ramp-up as a new push.
Fix: track the trough reached after the peak. A new push is a delta of 20 or more and more than 3x that trough. The trough resets on ramp-up. See `docs/specs/signal-hero.md` (Core Flows 10).

## R3F 9.8.x constructs a deprecated THREE.Clock
Root cause: `@react-three/fiber` 9.8.1 and 9.8.2 construct `THREE.Clock`, which three r186 deprecates and warns about.
Fix: pnpm patch `patches/@react-three__fiber@9.8.1.patch` (listed under `patchedDependencies` in `pnpm-workspace.yaml`) swaps in a Clock-compatible object. Re-check or drop the patch when upgrading `@react-three/fiber`. See `docs/design/DECISIONS.md` D11.

## Tab inside a Radix Dialog moves focus off the input
Root cause: `preventDefault` on Tab stops the browser's focus move, but the keydown still bubbles. FocusScope's keydown handler on an ancestor then wraps focus away from the input when the input is the first or last tabbable element.
Fix: the command menu's Tab handler calls `stopPropagation` as well as `preventDefault`, so FocusScope never sees the key. See `docs/specs/command-menu.md` (Core Flows 3) and `docs/design/DECISIONS.md` D12.

## shadcn `data-selected:` needs "true" (2026-10-24)
shadcn's tailwind.css defines `@custom-variant data-selected { &:where([data-selected="true"]) }`. Command-output rows set `data-selected=""`, so the selection moved but was never drawn. The e2e test checked only the attribute and passed. Set `"true"`, and assert a visible style in tests.

## Text reveal armed after hydration made painted text vanish (2026-10-24)
Root cause: the reveal class was added after hydration, so text that had already painted was hidden and then shown again. The result read as a flicker with no animation.
Fix: `ARM_SCRIPT` in the `<head>` of `src/app/layout.tsx` adds `html.paras-armed` before first paint. See `docs/memory/architecture.md` and `docs/specs/text-reveal.md`.

## Load-time reveals played behind the view-transition snapshot (2026-10-24)
Root cause: the page-switch view transition snapshot covers the page for about 0.7s, so load-time animations ran hidden behind it and were never seen.
Fix: above-the-fold reveals wait 450-500ms before starting. See `docs/memory/architecture.md` and `docs/specs/text-reveal.md`.

## StrictMode double effect left reveals hidden forever (2026-10-24)
Root cause: under React StrictMode the first effect run marked elements pending. Its cleanup disconnected the IntersectionObserver, and the second run skipped those elements because they were already marked. They stayed hidden.
Fix: the second run re-observes anything not yet in the "in" state. See `docs/specs/text-reveal.md` (Edge Cases).

## R3F frameloop switch resets the clock: stale hero shape after tab return (2026-10-24)
react-three-fiber 9.8.1 resets `clock` to 0 whenever `frameloop` changes. The home canvas pauses (`frameloop="never"`) while the tab is hidden or a modal is open, so on resume `delta`/elapsed ran backwards; `easeToward` with a negative dt drove the stream hand-off (`uFlow`) hugely negative or NaN and the shipped globe stuck over the lower sections. Fix: `SignalPoints` keeps its own monotonic clock (frame steps clamped 0..0.1s), `easeToward` ignores negative dt, the stream's dt is floored at 0. Never trust R3F's clock across frameloop changes.

- **Hydration mismatch from reveal markers (2026-10-24):** text-reveal.tsx set `data-para` on nodes the MutationObserver saw before React hydrated them, so React reported an attribute mismatch (Eyebrow on /contact). Fix: no DOM writes; reveal with `el.animate()` and track state in a WeakSet.

- **Reveals did not replay on back/forth navigation (2026-10-24):** Next keeps visited routes mounted but hidden (2 `[data-paras]` regions in the DOM), so returning showed already-revealed nodes. Fix: on each pathname change, next frame, cancel and re-observe reveals of blocks that are `checkVisibility()`.

## Hero chapters never snapped on phones (pointercancel) (2026-10-24)
Root cause: when the browser takes over a touch scroll it fires `pointercancel` instead of `pointerup`. `useChapterSnap` kept its `pressed` flag true, so `settle()` deferred forever. The first 7 home chapters never snapped on phones, leaving text half-revealed and blurred between stops.
Fix: `pressed` ignores touch pointers (touchstart/touchend `touching` covers touch), and `pointercancel` is treated as `pointerup`. Source: `src/features/signal-scene/useChapterSnap.ts`. See `docs/specs/signal-hero.md`.
