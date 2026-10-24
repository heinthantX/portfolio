# Signal hero

Rationale and history: `docs/design/DECISIONS.md` (D7 concept, D8 current motion rules).

## Architecture
- One GPU particle system (about 16k points) in `src/features/signal-scene/`.
  - `SignalPoints.tsx`: point geometry and shader. Owns the intro swarm (`uIntro`, `INTRO_S` = 2.8 s, per-point lag) and the shape morph.
  - `SignalCanvas.tsx`: R3F canvas, `breathe()` idle pulse, cursor parallax.
  - `timeline.ts`: chapter timing, formation values (`FORMATION_SIDE`, `ROT_Y`), morph window `W` = 0.09.
  - `SignalHero.tsx`: DOM layer. Sticky stage, layer cards, stack outline.
- Hero section height is `400vh` (3 screens of scroll).
- Scroll progress (0..1) is read in rAF/`useFrame` and stored in a ref or the frame loop only. Never in React state.
- Stack copy comes from `src/content/profile.ts`. `stackLayers[].points` (capability bullets) is validated in `profile.schema.ts` with default `[]`.
- Ambient sub-page background (`src/features/ambient-scene/AmbientCanvas.tsx`) reuses the motion rules below: sheets drift vertically only.

## Core Flows
1. **Load:** points swarm inward from a loose cloud over 2.8 s, each point with its own lag. The name glyph forms last.
2. **Scroll through the four layers (Interface first):**
   - The formation holds the right column for all four layers (`FORMATION_SIDE` = `[0,1,1,1,1,0]`). The text stays on the left.
   - The only formation move is the intro to Interface step, done inside the shape morph.
   - `ROT_Y` is constant per layer. No yaw sway.
   - Each layer card shows its title, tech tags, and 3 capability bullets.
   - Card motion is vertical only: rise 24px from below on enter, leave 24px upward. Enter and leave windows span 0.004–0.05 of progress.
3. **Finale:** the last stage (index 5) returns the formation to the left and shows the CTAs.
4. **Idle:** `breathe()` scales the formation by 1 ± 1.2% at `sin(t*0.9)`. The 404 scene uses the same pulse.
5. **Cursor:** parallax on the formation only. It does not change scroll or chapter state.
6. **Stack outline (desktop only):** lists all four layers. Each button calls `go(index)` and scrolls to that chapter.

## Edge Cases
- Stack outline is hidden below the desktop breakpoint. Cards and bullets still render on mobile.
- Empty `stackLayers[].points` renders the card without bullets. It does not break the layout.
- Scrolling never re-renders React. A change to scroll-linked state must go through the frame loop.
- Hover nudge on "→" (`group-hover:translate-x-1`) is the only horizontal motion. It is user-triggered and allowed.
- No autonomous left/right travel anywhere (owner rule, D8). Use vertical, scale or opacity.
- The 404 page uses the same engine: points form "404", then breathe.

## Autonomous UX Polish
- The stack outline doubles as chapter navigation. The active row is highlighted in the signal colour with `aria-current="step"`.
- The outline colour transition is 200 ms.
- Cursor parallax adds depth without any scroll cost.
- Hover arrow nudges on links give direction feedback without autonomous motion.
