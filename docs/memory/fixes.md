# Fixes

## Lenis virtualScroll returning false does not stop native scroll
Root cause: returning `false` from Lenis's `virtualScroll` callback skips Lenis's own handling, but it does not call `preventDefault` on the native wheel event. The browser still scrolls the page natively, so the wheel interceptor appeared to do nothing.
Fix: the interceptor calls `event.preventDefault()` itself, then returns `false` to swallow the event. In this repo that happens in `src/components/site/wheel.ts` (`interceptWheel` and `capWheelDelta`). See `docs/specs/signal-hero.md`.

## Lenis drops scrollTo onComplete when interrupted
Root cause: Lenis does not call a `scrollTo` `onComplete` when the scroll is interrupted by touch or by a new `scrollTo`. Chapter snapping that waited on `onComplete` stalled and never released its lock.
Fix: `useChapterSnap` (`src/features/signal-scene/useChapterSnap.ts`) tracks a `busyUntil` timestamp instead of relying on `onComplete`. See `docs/specs/signal-hero.md`.
