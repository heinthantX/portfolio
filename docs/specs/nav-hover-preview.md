# Nav hover arrow and preview card

## Architecture
- `src/components/site/main-nav.tsx`: `MainNav` renders the desktop links. Each hovered or focused link gets one arrow svg, built by `shotPath(..., drop)`, which returns four parts:
  - `main`: the lap, a rounded box around the label. It is the back layer only.
  - `cross`: the diagonal through the label. It is drawn as a moving dash, not a stroke that stays.
  - `dive`: the stroke that drops into the card's nail hole. The head is a separate element.
  - `rest: {at, angle}`: the point and angle of the rest head, which sits off the label box's top-right corner. It is used only by the current-page arrow.
- Layout constants in `main-nav.tsx`: `DIVE_X` (where the dive leaves the arrow's hook, measured from the link's right edge), `HOLE_X = 20` and `HOLE_Y = 12` (the nail hole's inset from the card's top-right corner), and `CARD_GAP = 20`.
- `drop` is measured as nav bottom − link top + 20 + 12. The card is positioned so its hole sits under `link.right + DIVE_X`.
- `MainNav` sets `data-pinned` on `nav` while a card is open. Clicking a link calls `close`, which drops `data-pinned`.
- One source of truth: the hover React state (`hover.href`) drives both the card and the arrow. A link gets `data-hover` when `hover.href === item.href`. Every arrow selector keys off `.nav-shot[data-hover]` (and `:not([data-hover])`), never CSS `:hover` or `:focus-visible`. The label colour uses `data-hover:text-text`.
- `MainNav` listens for window `blur` and clears the hover card. A window blur (another Chrome tab) closes the card.
- While a card is open, a window `pointermove` closes it at once when the pointer is outside the nav. It does not close if a nav link has `:focus-visible` (keyboard use).
- `src/app/globals.css`:
  - `.nav-shot` has `isolation: isolate` and `z-index: 1`, so the head paints over the card.
  - Hit area: `.nav-shot::before` has `inset: -5px -9px` (PAD_Y, PAD_X), so hovering matches the traced box, not just the text box.
  - The front masked layer and its halo carry only the cross (`.shot-cross`, animated by `@keyframes shot-cross`). The lap is the back layer only.
  - `.shot-dive` is the dive stroke. `.pv-hole` is the nail hole on the card.
  - `.shot-dive` and `.shot-head` are CSS transitions on a base-state change, not keyframe animations, so they reverse when the card hides.
  - `.shot-rest-head` is the rest head `g`, drawn from `rest.at` along `rest.angle`.
  - The arrow svg has an opacity transition. It appears at once on hover and fades out over 0.3s after a 0.5s delay when the card hides, so it only goes faint once the dive has fully retreated. The rest head reappears after 0.45s.
  - The card's open delay and swing delay are both 0.45s.
- The arrow is one element set, not a pin. The lap, cross, dive and heads are separate elements, and the svg has no rotation. The diagonal's angle comes from the path geometry.

## Core Flows
0. Rest state on the current page (`aria-current`, not hovered).
   - A faint arrow at 0.35 opacity shows the tail feathers, the lead-in and the rounded outline.
   - `.shot-rest-head` sits about 3px off the label box's top-right corner and points out along the cross line's angle.
   - No line crosses the text.
   - The arrow must read as a complete arrow with a head. Do not remove the rest arrow or its head.
   - Exception (2026-10-25): while another link is hovered (`nav[data-pinned]`), the whole rest arrow retracts so only one arrow shows. The head pops off, the line undraws into the tail, then the tail fades. It redraws in reverse when the hover ends. The label keeps its colour.
1. Hover or focus a desktop nav link (either sets the hover state, so the link gets `data-hover`). The rest head hides and the lap draws in 0.45s.
   - A mouse hover waits `SHOW_DELAY` (180ms) before setting the state, so a pointer passing over the nav fires nothing. Once the card is open, moving to another link switches at once. Keyboard focus shows it immediately. The label brightens on plain `:hover` without waiting.
   - The arrow svg appears at once; it does not fade in.
   - The lap enters from the lower left and laps a rounded box around the label.
   - It hooks over the top-right corner.
2. The cross runs at 0.4s, starting at 0.4s.
   - It is a short dash (`stroke-dasharray 0.4 2`) whose offset goes from 0.4 to -1.
   - It moves through the word and fades out at the end, leaving nothing drawn behind.
   - At rest, no line crosses the text. The text stays fully readable once the animation ends.
3. The card opens after a 0.45s delay. The swing is delayed 0.45s too. Moving between links while a card is open has no delay.
4. While `nav[data-pinned]` is set and the link has `data-hover`, the dive shows.
   - The dive draws in 0.3s, starting at 0.65s. It goes straight down into the card's nail hole.
   - The dive head pops at 0.92s, with its tip buried in the hole. It takes over from the rest head.
   - The hole pops at 0.95s.
   - The card is pinned by the arrow itself. Nothing else holds it.
5. When the card hides (a click on the link, the pointer leaving the nav, or the window losing focus), the retreat plays in this order:
   - The head pops off in 0.12s.
   - The dive pulls back up out of the nail hole to the top: `stroke-dashoffset` goes 0 → 1 over 0.3s, after a 0.1s delay.
   - The arrow svg fades out over 0.3s after a 0.5s delay, so it goes faint only after the retreat completes.
   - The arrow returns to the rest state if the link is the current page.
6. Clicking a nav link calls `close`. The card closes at once, and the retreat in step 5 plays with it.
   - On desktop, a mouse click (`e.detail > 0`) also blurs the link, so it does not keep focus across client navigation.
   - Keyboard activation keeps focus. `onFocus` still opens the card for keyboard users.

## Edge Cases
- Arrow and card must not disagree. Driving the arrow from CSS `:hover` while the card follows React state let a missed `mouseleave` leave the card open with no arrow. Keep `data-hover` as the only arrow trigger.
- Pointer-away close: a window `pointermove` outside the nav closes an open card at once. The `:focus-visible` exception keeps keyboard users' card open.
- The dive and head are hidden unless `nav[data-pinned]` is set. A hover with no open card shows only the lap and the cross.
- The dive and head retreat on hide; they do not vanish. If the dive becomes a keyframe animation, removing it snaps the dive away and it cannot reverse. It has to stay a transition on a base-state change.
- The rest head is hidden while hovered. The dive head takes over.
- No cross stays drawn at rest, and the faint current-page arrow has no cross. Any line left across the text at rest breaks readability, so it is not allowed.
- Do not remove the rest arrow to simplify rest. A rest state with only the outline and tail, and no head, is not a complete arrow and is not allowed.
- `.nav-shot` has `z-index: 1`. If it loses that, the head paints under the card and the pin point disappears.
- Put `z-index` on the arrow svgs inside `.nav-shot`, never on the `.shot-arrow` wrapper. A wrapper `z-index` creates a stacking context and traps the front layer behind the label. See `docs/memory/conventions.md`.
- Any `useId` value used in a CSS `url()` must have its colons stripped first.
- A mouse-clicked link stays focused across client navigation, because the header persists. When the tab regains focus, the browser refocuses it and fires `onFocus`, which reopens the card. No `mouseleave` fires, so the card stuck open. Fix: blur on mouse click, and close the card on window `blur`. See `docs/memory/fixes.md`.
- Tried and dropped: a yellow page-name pill and a separate outline box around the card.

## Autonomous UX Polish
- Reduced motion turns off the card swing and the hole pop. The card and the arrow still appear, without motion.
- The arrow fades out over 0.3s after a 0.5s delay when the card hides, so the dive retreat stays visible instead of snapping off the link.
- Clicking a link closes the card at once, so a stale card does not sit over the next page.
- Pointer-away close: moving the pointer out of the nav closes the card without waiting for a `mouseleave` that may never arrive.
- No cursor ring over the nav (`[data-no-ring]`), so the ring does not fight the arrow.
