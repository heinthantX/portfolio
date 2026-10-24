# Signal hero

Rationale and history: `docs/design/DECISIONS.md` (D7 concept, D8 motion rules, D9 wave chapter and per-point morph).

## Architecture
- One GPU particle system (about 16k points) in `src/features/signal-scene/`.
  - `SignalPoints.tsx`: geometry and shader. Owns the intro swarm (`uIntro`, `INTRO_S` = 2.8 s, per-point lag) and the morph. Each point blends its two endpoint world poses (`uMatA`/`uMatB`, `uScaleAB`) on its own stagger. Wave dots keep a fixed size (`mix(sc, 0.95, wv)`). `uWaveA`/`uWaveB` swell the field in place; crests roll along z only. `uDissolve` lifts and thins points as they leave the wave.
  - `SignalCanvas.tsx`: R3F canvas, `breathe()` idle pulse, cursor in world space (radius 0.95).
  - `timeline.ts`: `CHAPTER_IDS` is the source: intro, wave, interface, api, data, infra, shipped. `CHAPTERS`, `LAYER_OFFSET` (2) and `WAVE_CHAPTER` (1) derive from it. `chapterPose(i, view)` gives each chapter's resting pose; `Drive` is `{s, from, to}`. `FORMATION_SIDE` = `[0,0,1,1,1,1,0]`. Morph window `W` = 0.077. Text windows 0.004–0.043.
  - `shapes.ts` (tests in `shapes.test.ts`): `shapes.wave(n)` builds the field as a grid on the XZ plane. `matchByX` pairs points left to right (name → field → interface), so the drop is near-vertical.
  - `SignalHero.tsx`: DOM layer. Sticky stage, chapter copy, layer cards, wave manifesto, stack outline.
- Wave pose: x 0, Y_H -0.37 × view height, rotX 0.35, scale min(3.2, 1.12 × w/4.4). Mobile: `MOBILE_Y_H` -0.3, `MOBILE_FIT` 1.35, rotX 0.5.
- Hero section height is `450vh` (3.5 screens of scroll).
- Scroll progress (0..1) is read in rAF/`useFrame` only. Never in React state.
- Stack copy comes from `src/content/profile.ts`. `stackLayers[].points` (capability bullets) is validated in `profile.schema.ts` with default `[]`.
- Ambient sub-page background (`src/features/ambient-scene/AmbientCanvas.tsx`) follows the same motion rules: sheets drift vertically only.

## Core Flows
1. **Load:** points swarm inward from a loose cloud over 2.8 s, each with its own lag. The name glyph forms last.
2. **Intro → Wave:** the name's points drop into a perspective dotted field across the bottom third of the screen. The drop is near-vertical.
3. **Wave → Interface:** points lift and thin mid-flight, then condense into the right column. Each point regathers on its own stagger, so the formation never slides.
4. **Interface → API → Data → Infrastructure:** the formation holds the right column and the text stays on the left. `ROT_Y` is constant per layer.
   - Each layer card shows its title, tech tags and 3 capability bullets.
   - Cards rise 24px from below on enter and leave 24px upward (windows 0.004–0.043).
   - Inside a card: eyebrow and title first, tags at d 0.3, bullets at 0.45 + 0.1j.
5. **Shipped (finale):** the formation returns to the left and the CTAs appear.
6. **Wave manifesto:** "Nobody sees the stack. They feel it…", with `feel` and `one` accented. Words reveal through ScrollWords in driven mode (`docs/specs/scroll-words.md`).
   - Below it, a 4-column grid of layers: number, title →, two techs. Each item is a button that jumps to its chapter.
   - Desktop places the block at padding-top 16svh; mobile at 14svh.
7. **Idle:** `breathe()` scales the formation by 1 ± 1.2% on `sin(t*0.9)`. The 404 scene uses the same pulse.
8. **Cursor:** acts in world space within radius 0.95, on the formation only. It never changes scroll or chapter state.
9. **Stack outline (desktop):** lists the four layers. Each button calls `go(j + LAYER_OFFSET)` and scrolls to that chapter.

## Edge Cases
- Reduced motion or no WebGL: static posters. The manifesto renders statically, without the layer grid.
- The stack outline is hidden below the desktop breakpoint. Cards and bullets still render on mobile.
- Empty `stackLayers[].points` renders the card without bullets. The layout does not break.
- Scroll-linked state goes through the frame loop only. Scrolling never re-renders React.
- The only horizontal motion is the hover nudge on "→" (`group-hover:translate-x-1`). It is user-triggered and allowed.
- No autonomous left/right travel anywhere (D8, kept in D9). Use vertical, scale or opacity.
- Mobile wave dots are a fixed size, so phones get the same texture as desktop.
- The 404 page uses the same engine: points form "404", then breathe.

## Autonomous UX Polish
- The stack outline doubles as chapter navigation. The active row uses the signal colour and `aria-current="step"`. Colour transition is 200 ms.
- The manifesto layer grid doubles as navigation: hover colour and a 200 ms arrow nudge.
- Layer cards use staggered line reveals (see Core Flows 4).
- Fixed dot size on mobile keeps the wave texture consistent.
- Cursor parallax adds depth at no scroll cost.
- Hover arrow nudges on links give direction feedback without autonomous motion.
