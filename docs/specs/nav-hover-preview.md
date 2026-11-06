# Nav hover arrow and preview card

## Risks & checks (nav string, 2026-11-07)
- Several outlines visible during a swipe (the bug being replaced) → piled-up shapes → nav has exactly one `.nav-string` path and per-link svgs carry no lap; Chrome sampler shows ≤1 outline during a sweep.
- Rest on current page isn't a lone underline → box/head at rest → string window is exactly the box path's bottom edge [s, u], no head or feathers shown.
- No current page (home, or a route outside nav) → stray line at rest → window collapses to zero and the path is hidden.
- Click navigates → string jerks back to the old page before path updates → rest target uses the clicked href until `usePathname` catches up.
- Home link appears/disappears (route home↔sub) → old arc lengths point at wrong links → rebuild the box paths and snap, no tween.
- Retarget mid-tween (fast swipe) → jump or restart from the old end → tween starts from the current interpolated window.
- Resize or font swap → line off the labels → box paths rebuilt on ResizeObserver and `document.fonts.ready`.
- Reduced motion → travelling line → window jumps, no tween.
- Card and string out of step on a switch → hole lands before/after the box → card translate and string tween share one duration/easing token (`--string-ms`, `--string-ease` on `nav.main-nav`; `StringDriver` reads them).
- (weave, 2026-11-07) Owner: destination box and rest underline stay as the first string version (box lap, cross, straight dive); only the travel changes. Box creeps into the flight → reads as "straight boxing" → flight `d` has no `H`/`V`/`Z` and no box arcs; unit test.
- Weave too busy or messy → owner rejected the loop/curl version → no loops, at most one crossing per passed label, amplitude capped to the label band (box top − 6 to box bottom + 10); unit test bounds.
- (route curves, 2026-11-07) Owner reference: plane flight-route illustrations (wide gentle arcs, smooth S-waves, an occasional big round loop). Gap-to-gap zigzag reads as "random angles, tangled" → flight built from a few smooth templates, min radius of curvature ≥ 8px, heading change ≤ 20° per 2px of length (no kinks); unit test samples both.
- Loop on a short hop looks cramped → loops only when ≥ 3 labels are passed; adjacent hops are a single arc.
- Randomness re-rolled mid-flight or per frame → line jitters → variation picked once per flight from a seed, reroutes pick a new seed only at retarget.
- Mid-air reroute on a fast swipe → line jumps or kinks → new flight starts at the current lead point along its current tangent.
- Leftward travel lands heading left into a right-running lead-in → kink at landing → the flight passes under the target and curls up in a gentle U so it lands heading right (checked by test and in the browser; no loop).
- Sag dips into the page → clipped or lost behind the card → svg `overflow: visible`, sag ≤ 44px, check in Chrome over the card.
- Dive no longer meets the line → card unpinned → the dive starts exactly where the cross ends (box top-right `x1-2, y0-4`).
- Dive head misses the nail hole → card looks unpinned → browser check: head tip vs `.pv-hole` centre ≤1.5px on every link (2026-11-07: max |dx| 0, |dy| 0.07 on /uses; the hole sat 1px off because the card's 1px border shifts its padding-box offsets, and the head overshot the hole by 3px by design).
- Dive/card regress → card unpinned → dive, dive head, hole and card timings unchanged; keyboard focus still drives the same state.

## Architecture
- `src/components/site/nav-string.ts`: pure `boxPath(box)` (one link's lead-in and rounded box, with arc-length marks `s` start of bottom edge, `u` end of bottom edge = underline, `e` box closed at the bottom-left, plus `start`/`land`, where flights land), pure `flightPath(lead, tangent, target, passed, seed)` (the flight: a template picker, returns `{ d, body, len, template }`), `windowAt` (the comet tween), `mulberry32`, and `StringDriver`, which owns the svg nodes and writes the path `d` and `stroke-dasharray`/`stroke-dashoffset` straight to the DOM in rAF. Tested in `nav-string.test.ts`.
- `src/components/site/main-nav.tsx`: `MainNav` renders the desktop links and `NavString`, two nav-level svgs: the back one (`.nav-string`, behind the labels) and a front one (`.nav-string-front`, over the labels) holding a halo and an accent copy of the same path, masked to each label's right half, plus the travelling head and feather `g`s. It rebuilds the box paths and mask on ResizeObserver (nav and each link), `document.fonts.ready`, `animationend` (Home slides in) and link-set changes, snapping without a tween. Each hovered or focused link also gets one arrow svg, built by `shotPath(w, h, drop)`, which returns:
  - `cross`: the diagonal through the label from the box's bottom-left close point (where the string's box ends) to `x1-2, y0-4`. Drawn as a moving dash, with a back copy, a front copy masked to the label's right half, and a halo.
  - `dive`: from the cross's end, hooks over and drops straight down into the card's nail hole (`V hole - 9`); the head is a separate element, origin `hole - 5` so its tip is the hole's centre, pointing straight down.
- Layout constants in `main-nav.tsx`: `DIVE_X` (where the dive leaves the arrow's hook, measured from the link's right edge), `HOLE_X = 20` and `HOLE_Y = 12` (the nail hole's inset from the card's top-right corner), and `CARD_GAP = 20`.
- `drop` is measured as nav bottom − link top + 20 + 12. The card is positioned so its hole sits under `link.right + DIVE_X`.
- `MainNav` sets `data-pinned` on `nav` while a card is open. Clicking a link calls `close`, which drops `data-pinned`.
- One source of truth: the hover React state (`hover.href`) drives both the card and the arrow. A link gets `data-hover` when `hover.href === item.href`. Every arrow selector keys off `.nav-shot[data-hover]` (and `:not([data-hover])`), never CSS `:hover` or `:focus-visible`. The label colour uses `data-hover:text-text`.
- `MainNav` listens for window `blur` and clears the hover card. A window blur (another Chrome tab) closes the card.
- While a card is open, a window `pointermove` closes it at once when the pointer is outside the nav. It does not close if a nav link has `:focus-visible` (keyboard use).
- `src/app/globals.css`:
  - `.nav-shot` has `isolation: isolate` and `z-index: 1`, so the head paints over the card.
  - Hit area: `.nav-shot::before` has `inset: -5px -9px` (PAD_Y, PAD_X), so hovering matches the traced box, not just the text box.
  - `.nav-string-svg` holds the string path (back svg) or its halo and accent copies (front svg), plus a travelling head `g` and a feather (fletching) `g`; the paths are styled like the arrow stroke (accent 1.4, round caps, glow). The dash window is set from script, never from CSS.
  - `.shot-dive` is the dive stroke. `.pv-hole` is the nail hole on the card.
  - `.shot-dive` and `.shot-head` are CSS transitions on a base-state change, not keyframe animations, so they reverse when the card hides.
  - The per-link arrow svg has an opacity transition. It appears at once on hover and fades out over 0.3s after a 0.5s delay when the card hides, so it only goes faint once the dive has fully retreated.
  - The card's open delay and swing delay equal `--string-ms` (600ms). The cross starts at `--string-ms - 0.05s`; dive, head and hole delays are `--string-ms` + 0.2s / + 0.47s / + 0.5s, so the order holds if the token changes.
  - `--string-ms` is 600ms (round 1 was 450ms) because a long route through several labels reads rushed any faster; the old 0.65s/0.92s/0.95s delays moved by the same amount.
  - `.pv-hole` is offset by 1px less than HOLE_X/HOLE_Y: those insets run from the card's padding box, the card has a 1px border, and the dive aims at the border-box offsets. ShotArrow measures the link with `getBoundingClientRect` (fractional) because the card's x is fractional too.
- The arrow is one element set, not a pin. The string, dive and heads are separate elements, and the svg has no rotation.

## Core Flows
0. Rest state on the current page (`aria-current`, not hovered).
   - The string's window is just that link's bottom edge, `[s, u]`: a single straight underline. No box, no head, no feathers.
   - With no current page (home, or a route outside the nav) the window is empty and the path is hidden.
   - A clicked link is the rest target at once (until `usePathname` catches up), so the string travels to the clicked tab's underline instead of back to the old page. Clicking Home targets nothing.
1. Hover or focus a desktop nav link (either sets the hover state, so the link gets `data-hover`). The string travels to that link and traces its box within `--string-ms`.
   - A mouse hover waits `SHOW_DELAY` (180ms) before setting the state, so a pointer passing over the nav fires nothing. Once the card is open, moving to another link switches at once. Keyboard focus shows it immediately. The label brightens on plain `:hover` without waiting.
   - The per-link arrow svg appears at once; it does not fade in.
   - Destination: lead-in from the lower left, then the rounded box (bottom edge, right side, top, left side, closing at the bottom-left). Hover window = `[s, e]`.
   - No fixed track, so the travel never traces the boxes in between. Each move builds a path on the fly: the visible window sampled into a polyline (the only `L` run), then `flightPath`, then the target's box path. The window tweens from `[0, visibleLen]` to the target window with the comet `windowAt` (leading end full easing, trailing end starts 20% later). Once settled the path swaps to the plain box path with the same window.
   - The route: one seeded template per flight, drawn like a flight-route illustration, only `M`/`C` commands, G1-joined cubics, horizontal tangents at the extremes. Weights Arc 45 / Wave 40 / Loop 15. Arc is one wide bow; Wave is 2 or 3 equal lobes alternating sides (`round(dist/180)` + 1); Loop is a hump over the labels settling under them at ~55%, then one true circle (r 10-13) hanging below the line, entered and left tangentially; it needs 3+ passed labels and a rightward trip. Amplitude `clamp(dist*0.18, 10, 36)` x 0.85-1.15; the path stays in [box top - 8, box bottom + 36] (a bow that would leave it flips side or shrinks, never clips) and shrinks until its tightest radius is >= 9.5px. It leaves the lead point along the current tangent (a heading against the trip first turns round in a half circle below) and lands on the target's lead-in start heading right; a leftward trip runs under the target and rises into the lead-in out of a wide U. The seed is drawn once per flight (a mid-air reroute draws a new one).
   - Where the route crosses a label, the line is behind the first half of the word and in front of the second (front copy with halo, masked to each label's right half), like the cross.
   - Same link to same link (underline <-> hover on the current page): no flight, the window just tweens. A retarget mid-air starts from the current lead point and tangent. A hidden line grows from the target's own lead-in.
   - While travelling, the head sits at the leading end and feathers (the old fletching shape) at the trailing end, both rotated along the path and fading over the last quarter. Neither shows at rest or once settled (the dive head takes over).
   - Reduced motion: the window and path jump, no tween, no head or feathers, no cross.
2. The cross runs at 0.4s, starting `--string-ms - 0.05s` (as the string closes its box; it begins at the box's close point).
   - It is a short dash (`stroke-dasharray 0.4 2`) whose offset goes from 0.4 to -1.
   - It moves through the word and fades out at the end, leaving nothing drawn behind.
   - At rest, no line crosses the text. The text stays fully readable once the animation ends.
   - Card sync (switch while a card is open): the card's `translate` transition uses `var(--string-ms)` / `var(--string-ease)` (600ms, cubic-bezier(0.55,0,0.25,1), no overshoot), the same token the string tween reads, so the nail hole arrives under the new link's `DIVE_X` as the string closes the new box. Order: string lands -> new dive drops (+0.2s) -> head pops (+0.47s) -> hole pops (+0.5s). The old link's dive and head retreat at once. Opening from nothing keeps the order: box draws, cross, card opens at `--string-ms`, then dive, head, hole.
   - Reduced motion: `--string-ms` is 0ms, so the string and the card both jump.
3. The card opens after a `--string-ms` delay. The swing is delayed the same. Moving between links while a card is open has no delay.
4. While `nav[data-pinned]` is set and the link has `data-hover`, the dive shows.
   - The dive draws in 0.3s, starting at `--string-ms` + 0.2s. It leaves the cross's end, hooks over and goes straight down into the card's nail hole.
   - The dive head pops at `--string-ms` + 0.47s, with its tip exactly on the hole's centre, pointing straight down. It takes over from the string's travelling head.
   - The hole pops at `--string-ms` + 0.5s.
   - The card is pinned by the arrow itself. Nothing else holds it.
5. When the card hides (a click on the link, the pointer leaving the nav, or the window losing focus), the retreat plays in this order:
   - The head pops off in 0.12s.
   - The dive pulls back up out of the nail hole to the top: `stroke-dashoffset` goes 0 → 1 over 0.3s, after a 0.1s delay.
   - The per-link arrow svg fades out over 0.3s after a 0.5s delay, so it goes faint only after the retreat completes.
   - After 400ms with no hover (the dive pull-back is 0.1s delay + 0.3s, so the line never leaves the box with the dive still in it), the string retreats over `--string-ms`: the flourish unwinds back to the current page's underline, or unwinds to nothing if there is none. Hovering another link before that cancels the wait.
6. Clicking a nav link calls `close`. The card closes at once, and the retreat in step 5 plays with it.
   - On desktop, a mouse click (`e.detail > 0`) also blurs the link, so it does not keep focus across client navigation.
   - Keyboard activation keeps focus. `onFocus` still opens the card for keyboard users.

## Edge Cases
- Arrow and card must not disagree. Driving the arrow from CSS `:hover` while the card follows React state let a missed `mouseleave` leave the card open with no arrow. Keep `data-hover` as the only arrow trigger.
- Pointer-away close: a window `pointermove` outside the nav closes an open card at once. The `:focus-visible` exception keeps keyboard users' card open.
- The dive and head are hidden unless `nav[data-pinned]` is set. A hover with no open card shows only the string's box and the cross.
- The dive and head retreat on hide; they do not vanish. If the dive becomes a keyframe animation, removing it snaps the dive away and it cannot reverse. It has to stay a transition on a base-state change.
- No cross stays drawn at rest. Any line left across the text at rest breaks readability, so it is not allowed.
- Arc lengths belong to one path. Never reuse them after the link set or sizes change: rebuild and snap.
- `.nav-shot` has `z-index: 1`. If it loses that, the head paints under the card and the pin point disappears.
- Put `z-index` on the arrow svgs inside `.nav-shot`, never on the `.shot-arrow` wrapper. A wrapper `z-index` creates a stacking context and traps the front layer behind the label. See `docs/memory/conventions.md`.
- Any `useId` value used in a CSS `url()` must have its colons stripped first.
- A mouse-clicked link stays focused across client navigation, because the header persists. When the tab regains focus, the browser refocuses it and fires `onFocus`, which reopens the card. No `mouseleave` fires, so the card stuck open. Fix: blur on mouse click, and close the card on window `blur`. See `docs/memory/fixes.md`.
- Tried and dropped: a yellow page-name pill and a separate outline box around the card.
- Tried and dropped (owner, 2026-11-07): (a) a box lap sliding along one fixed track through all links, whose travel traced every box on the way ("straight boxing"); (b) curved flourishes (sagging underline, cursive loop, no box, no cross) joined by a sag flight, which was too messy. Kept: box destination, underline rest, cross and straight dive from (a); only the travel changed. (c) the gap-to-gap zigzag weave through the labels (jittered waypoints, alternating above/below): random angles read as tangled (owner, 2026-11-07); the owner's reference was plane flight-route illustrations, so the travel is now a smooth route template (Core Flows).
- Tried and dropped: per-link laps. Each link drew its own box and held it 0.5s + 0.3s fade after the hover left, so a swipe across links stacked 3-4 boxes at once (measured 2026-11-07). Replaced by the single nav string, plus an underline rest state instead of the faint rest arrow with head.

## Autonomous UX Polish
- Reduced motion turns off the card swing and the hole pop. The card and the arrow still appear, without motion.
- The arrow fades out over 0.3s after a 0.5s delay when the card hides, so the dive retreat stays visible instead of snapping off the link.
- Clicking a link closes the card at once, so a stale card does not sit over the next page.
- Pointer-away close: moving the pointer out of the nav closes the card without waiting for a `mouseleave` that may never arrive.
- No cursor ring over the nav (`[data-no-ring]`), so the ring does not fight the arrow.
