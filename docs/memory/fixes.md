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
