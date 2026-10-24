# Signal hero

Rationale and history: `docs/design/DECISIONS.md` (D7 concept, D8 motion rules, D9 wave chapter and per-point morph, D10 networks, chapter snap and reveals).

## Architecture
- One GPU particle system (about 16k points) in `src/features/signal-scene/`.
  - `SignalPoints.tsx`: geometry and shader. Owns the intro swarm (`uIntro`, `INTRO_S` = 2.8 s, per-point lag) and the morph. Each point blends its two endpoint world poses (`uMatA`/`uMatB`, `uScaleAB`) on its own stagger. Wave dots keep a fixed size (`mix(sc, 0.95, wv)`). `uWaveA`/`uWaveB` swell the field in place; crests roll along z only. `uDissolve` lifts and thins points as they leave the wave. Points carry `aNodeA`/`aNodeB` (swapped with the from/to shapes): neurons glow, flash when current reaches them, and stray points crackle.
  - `shapes.ts` (tests in `shapes.test.ts`): `shapes.wave(n)` builds the field as a grid on the XZ plane, wider than the screen: `WAVE_FAR` 3.1 (far row local half-width), `WAVE_NEAR` 2.1, `WAVE_RATIO` 3.4 columns per row. `waveCells(field)` recovers the grid from positions. `matchByX` pairs points left to right (name, field, interface), so the drop is near-vertical.
  - Networks: every shape has one `THREE.LineSegments` that shares the points' uniforms.
    - Wave: `waveNet`, paths flowing from the horizon toward the viewer (depth 0..1).
    - Other shapes: `neuralNet(shape, 110 neurons, 2 nearest links)`. Depth is the hop count from the cluster's first neuron, packed into 0..0.4.
    - GLSL `pulseHead(phase)` = `fract(uTime*0.28+phase)*1.4-0.2` drives both.
    - Links are split into 5 pieces (`linkGeometry`). Vertices jag (`aJit`/`aSub`) like lightning while a pulse crosses.
    - Links fade in only once both ends have landed (`uMode` +1 arriving, -1 leaving).
  - `SignalCanvas.tsx`: R3F canvas, `breathe()` idle pulse, cursor in world space (radius 0.95). Networks start mid-activity, not dead.
  - `timeline.ts`: `CHAPTER_IDS` is the source: intro, wave, interface, api, data, infra, shipped. `CHAPTERS`, `LAYER_OFFSET` (2) and `WAVE_CHAPTER` (1) derive from it. `chapterPose(i, view)` gives each chapter's resting pose; `Drive` is `{s, from, to}`. `FORMATION_SIDE` = `[0,0,1,1,1,1,0]`. Morph window `W` = 0.077. Text windows 0.004–0.043.
  - `useChapterSnap.ts` (tests in `useChapterSnap.test.ts`): `useChapterSnap(sectionRef, lenis, enabled)` returns `goTo(chapter)`. Pure helpers `nextStop` and `settleStop` are tested.
  - `src/components/site/wheel.ts`: `interceptWheel(fn)` registers the hook. `capWheelDelta` calls it, then `preventDefault` and returns false to swallow the event.
  - `SignalHero.tsx`: DOM layer. Sticky stage, chapter copy, layer cards, wave manifesto, stack outline.
- Wave pose: x 0, Y_H -0.37 × view height, rotX 0.35, scale min(3.2, 1.12 × w/4.4). Mobile: `MOBILE_Y_H` -0.3, `MOBILE_FIT` 1.35, rotX 0.5.
- Hero section height is `450vh` (about 4.5 screens of scroll).
- Scroll progress (0..1) is read in rAF/`useFrame` only. Never in React state.
- Stack copy comes from `src/content/profile.ts`. `stackLayers[].points` (capability bullets) is validated in `profile.schema.ts` with default `[]`.
- Ambient sub-page backgrounds are a separate feature: `docs/specs/ambient-scene.md`.

## Core Flows
1. **Load:** points swarm inward from a loose cloud over 2.8 s, each with its own lag. The name glyph forms last.
2. **Intro → Wave:** the name's points drop into a perspective dotted field that runs past both screen edges across the bottom third. The drop is near-vertical.
3. **Wave → Interface:** points lift and thin mid-flight, then condense into the right column. Each point regathers on its own stagger, so the formation never slides.
4. **Interface → API → Data → Infrastructure:** the formation holds the right column and the text stays on the left. `ROT_Y` is constant per layer.
   - Each layer card shows its title, tech tags and 3 capability bullets.
   - Cards rise 24px from below on enter and leave 24px upward (windows 0.004–0.043).
   - Inside a card: eyebrow and title first, tags at d 0.3, bullets at 0.45 + 0.1j.
   - Data copy shows SQL and NoSQL breadth in the text. Tags are not highlighted (D10).
5. **Shipped (finale):** the formation returns to the left and the CTAs appear.
6. **Wave manifesto:** "Nobody sees the stack. They feel it…", with `feel` and `one` accented. Words reveal through ScrollWords in driven mode (`docs/specs/scroll-words.md`).
   - Below it, a 4-column grid of layers: number, title →, two techs. Each item is a button that calls `goTo` for its chapter.
   - Desktop places the block at padding-top 16svh; mobile at 14svh.
7. **Idle:** `breathe()` scales the formation by 1 ± 1.2% on `sin(t*0.9)`. The 404 scene uses the same pulse.
8. **Cursor:** acts in world space within radius 0.95, on the formation only. It never changes scroll or chapter state.
9. **Navigation:** the chapter rail (01–05, right edge) and the stack outline (desktop, four layers, `goTo(j + LAYER_OFFSET)`) both call `goTo`. They never call `lenis.scrollTo` directly.
10. **Wheel snap (hero only):**
    - One gesture moves exactly one chapter: a gap over 160ms, or a fresh push over 2× the decaying delta. The move uses `lenis.scrollTo` over 1.05s with easeInOutCubic.
    - A fling (over 900px in the first 220ms) hands the wheel back to Lenis, which scrolls freely.
    - After any scroll stops (touch, keys, scrollbar, fling), the snap settles after 140ms. A nudge over 4% of vh completes one step. A smaller nudge springs back. A fling settles on the nearest chapter.
    - Snap tracks a `busyUntil` timestamp, not `onComplete`, because Lenis drops `onComplete` when a scroll is interrupted (`docs/memory/fixes.md`).

## Edge Cases
- Reduced motion or no WebGL: static posters, and chapter snap is disabled. The manifesto renders statically, without the layer grid.
- Outside the hero section, the wheel snap does nothing.
- The stack outline is hidden below the desktop breakpoint. Cards and bullets still render on mobile.
- Empty `stackLayers[].points` renders the card without bullets. The layout does not break.
- Scroll-linked state goes through the frame loop only. Scrolling never re-renders React.
- The only horizontal motion is the hover nudge on "→" (`group-hover:translate-x-1`). It is user-triggered and allowed.
- No autonomous left/right travel anywhere (D8, kept in D9 and D10). The wave runs wider than the screen, but its motion is vertical or along z.
- The wave's edge fade sits off-screen (|x| 2.8..3.15), so no fade line is visible.
- Mobile wave dots are a fixed size, so phones get the same texture as desktop.
- The 404 page uses the same engine: points form "404", then breathe.

## Autonomous UX Polish
- The stack outline and chapter rail double as navigation through the same snap. The active row uses the signal colour and `aria-current="step"`. Colour transition is 200 ms.
- Networks start mid-activity rather than dead, so the scene reads as alive before the first scroll.
- Rail clicks use the same snap as the wheel, so they never fight it.
- The manifesto layer grid doubles as navigation: hover colour and a 200 ms arrow nudge.
- Layer cards use staggered line reveals (see Core Flows 4).
- Fixed dot size on mobile keeps the wave texture consistent.
- Cursor parallax adds depth at no scroll cost.
- Hover arrow nudges on links give direction feedback without autonomous motion.
