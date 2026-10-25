# home-stream

Home page only (D25). After the hero's last chapter (`shipped`), the same particles dissolve and pour into a packet stream that flows behind the rest of the home page and narrows to a small gold glow at `#contact`.

## Architecture
- `src/features/home-stream/`: `HomeStream.tsx` (mounted in `layout.tsx` so it can freeze and fade out over 0.6s on route change; renders nothing off `/`), `StreamCanvas.tsx` (one fixed full-viewport canvas, `-z-10`, pointer-events none, aria-hidden), `store.ts` (the hero registers on mount; the canvas draws only while it is registered), `measure.ts` (section + text rects in document coords), `waveDriver.ts` (pure spine/regime/packet logic, unit tested).
- Hero drawing moved onto this canvas on home; `SignalScene` (404) keeps its own small canvas.
- Shipped rest moved from 99% to 92.5% of hero scroll; the final stretch is the hand-off window (`uFlow` 0→1).
- Ported from the reverted site-wide build (8d7a1dd, `docs/archive/site-wave.md` has the full regime/packet constants).
- Cursor lens constants live in one place: `LENS = { r: 130, push: 46, glow: 0.85, grow: 0.7 }`, exported from `src/features/signal-scene/SignalPoints.tsx`. The stream branch of its VERT shader applies the lens in screen px to `q` before building `fw`. `uMouse` eases toward the pointer at `1 - exp(-dt * 16)` and snaps when `uStrength < 0.01`.
- `StreamCanvas.tsx`: `Packets` takes an `interactive` prop, tracks the pointer itself, and applies the same `LENS` to the gold, flash and ack sprites. The end glow does not get the lens.

## Core flows
- Stream: noise spine (value noise + domain warp + mean-reverting heading, no periodic sway), per-section regimes (river, braid, delta, fibre, pool, funnel; card sections lean pool; contact = funnel), thinning under measured text with a floor, gold packets (drops, resends, rare acks), scroll velocity stirs it.
- Cursor lens (ring push + highlight) on desktop, for points and packets. Within `LENS.r` (130px) a point is pushed outward by `f² · 46px` where `f = 1 - d / 130`. Its alpha gains `f · 0.85` (scaled by `uSiteA`, and only for points already visible). Its size grows by `×(1 + f · 0.7)`. The constants are ported from the owner's reference prototype (`emit` in the `index.html` prototype). It replaces the earlier world-space cursor repel.
- Route change off `/`: last frame freezes and fades (~0.8s), then the route's AmbientBackground shows. Back on `/`: starts at the hero.

## Edge cases
- Pauses while the tab is hidden or the command palette is open.
- Reduced motion: hero poster, no stream. No WebGL: CSS dot grid.
- Mobile: 6000 points, dpr ≤ 1.25; the canvas uses large-viewport height, so hero shapes sit slightly lower than before.
- Lens is desktop only (`pointer: fine`). Touch gets no lens and `Packets` does no pointer tracking.
- ~40% of points have no stream slot at hand-off start and fade near the globe.
- Draws every frame while on `/`.

## Autonomous UX Polish
- The lens glides to the pointer (`uMouse` easing above) instead of snapping, so entering and leaving the ring reads as a soft push.
- The lens is gated to `pointer: fine`, so touch devices keep the calm stream with no extra work per frame.
- Reduced motion keeps the poster only, so the lens never runs for users who opted out of motion.

## Header bends (2026-10-24)
`measure.ts` reads each section's heading block (eyebrow + h2, measured to where the text ends). The spine starts curving out above it, passes on the side with room (desktop: right), hugs the edge and tucks back under the corner. Gap, curve length, hug, reach and tuck are noise-seeded per heading; the shift is continuous and keeps channel order (no crossing, no periodic sway). Phones: smaller gap, thinner band (45% squeeze vs 20%). Known: pool-regime swirls aren't deflected; the Contact tuck crosses the "Open to…" line.

## Resume
Tab return / modal close: the scene keeps its own monotonic clock, so it lands in the state for the current scroll (see `docs/memory/fixes.md`).
