# Signal hero

Rationale and history: `docs/design/DECISIONS.md` (D7 concept, D8 motion rules, D9 wave chapter and per-point morph, D10 networks, chapter snap and reveals, D11 speed-aware snap and the R3F clock patch, D12 text entrance slides and chapter pace).

## Architecture
- One GPU particle system (about 16k points) in `src/features/signal-scene/`.
  - `SignalPoints.tsx`: geometry and shader. Owns the intro swarm (`uIntro`, `INTRO_S` = 2.8 s, per-point lag) and the morph. Each point blends its two endpoint world poses (`uMatA`/`uMatB`, `uScaleAB`) on its own stagger. Wave dots keep a fixed size (`mix(sc, 0.95, wv)`). `uWaveA`/`uWaveB` swell the field in place; crests roll along z only. `uDissolve` lifts and thins points as they leave the wave. Points carry `aNodeA`/`aNodeB` (swapped with the from/to shapes): neurons glow, flash when current reaches them, and stray points crackle.
  - `shapes.ts` (tests in `shapes.test.ts`): `shapes.wave(n)` builds the field as a grid on the XZ plane, wider than the screen: `WAVE_FAR` 3.1 (far row local half-width), `WAVE_NEAR` 2.1, `WAVE_RATIO` 3.4 columns per row. `waveCells(field)` recovers the grid from positions. `matchByX` pairs points left to right (name, field, interface), so the drop is near-vertical. `data(n)` is the **Schema Crystal** (D16): a tilted 4x4x4 cube lattice, rigid on the left, whose right-hand edges break into short fragments that become six document cards (outline, header bar, indented rows, some with a `{` hint), plus a single thin cache ring with three dots. Rigid schema meets flexible documents: SQL and NoSQL in one silhouette. `infra(n)` is the **Harbor Cloud** (D18): an unlabelled cartoon cloud diagram. A scalloped cloud (VPC) with a satellite dish (CDN) on top. Below it a striped lighthouse (gateway/LB) beams to three container ships (pods; the third, smaller one is the sidecar), a quay crane hangs a crate (deploy), three barrels (DB), a buoy (cache), dotted waterlines, and a lookout tower whose flag carries a zig-zag chart (monitoring).
  - Networks: every shape has one `THREE.LineSegments` that shares the points' uniforms.
    - Wave: `waveNet`, paths flowing from the horizon toward the viewer (depth 0..1).
    - Other shapes: `neuralNet(shape, 110 neurons, 2 nearest links)`. Depth is the hop count from the cluster's first neuron, packed into 0..0.4.
    - GLSL `pulseHead(phase)` = `fract(uTime*0.28+phase)*1.4-0.2` drives both.
    - Links are split into 5 pieces (`linkGeometry`). Vertices jag (`aJit`/`aSub`) like lightning while a pulse crosses.
    - Links fade in only once both ends have landed (`uMode` +1 arriving, -1 leaving).
  - `SignalCanvas.tsx`: R3F canvas, `breathe()` idle pulse, cursor in world space (radius 0.95). Networks start mid-activity, not dead.
  - `timeline.ts`: `CHAPTER_IDS` is the source: intro, wave, interface, api, data, infra, shipped. `CHAPTERS`, `LAYER_OFFSET` (2) and `WAVE_CHAPTER` (1) derive from it. `chapterPose(i, view)` gives each chapter's resting pose; `Drive` is `{s, from, to}`. `FORMATION_SIDE` = `[0,0,1,1,1,1,0]`; `SIDE_X` (share of view width right of centre) is 0.235, except infra at 0.19 so the lookout clears the rail labels. Morph window `W` = 0.077. Text windows 0.004–0.043.
  - `useChapterSnap.ts` (tests in `useChapterSnap.test.ts`): `useChapterSnap(sectionRef, lenis, enabled)` returns `goTo(chapter)`. Pure helpers `nextStop` and `settleStop` are tested. Each wheel gesture is classed as slow, swipe or free from its raw delta (Core Flows 10). Pace: `STEP_S` 2s per chapter, `MIN_S` 1s (D15), overridable at build time with `NEXT_PUBLIC_CHAPTER_STEP_S` / `NEXT_PUBLIC_CHAPTER_MIN_S` (positive seconds; bad values fall back to the defaults, and the minimum is capped at the step).
  - `src/components/site/wheel.ts`: `interceptWheel(fn)` registers the hook. `capWheelDelta` calls it, then `preventDefault` and returns false to swallow the event.
  - `SignalHero.tsx`: DOM layer. Sticky stage, chapter copy, layer cards, wave manifesto, stack outline, chapter rail (`RAIL_LABELS`, `group/rail`).
    - Text entrance slides (D12): `slideFrom(i)` gives each block its side. Intro, wave and finale return 0 (vertical rise only). Layer cards use `(i - LAYER_OFFSET) % 2`: -1 (from the left) for interface and data, +1 (from the right) for api and infra. Distance is `min(96px, 7% of viewport width)`. Enter and leave offsets are squared on the textState values.
- Wave pose: x 0, Y_H -0.37 × view height, rotX 0.35, scale min(3.2, 1.12 × w/4.4). Mobile: `MOBILE_Y_H` -0.3, `MOBILE_FIT` 1.35, rotX 0.5.  `fillWaveBottom` (D17) then grows the scale where the near row would stop short of the bottom edge, keeping the horizon line.
- Hero section height is `450vh` (about 4.5 screens of scroll).
- Scroll progress (0..1) is read in rAF/`useFrame` only. Never in React state.
- Stack copy comes from `src/content/profile.ts`. `stackLayers[].points` (capability bullets) is validated in `profile.schema.ts` with default `[]`.
- Dependency patch: `patches/@react-three__fiber@9.8.1.patch` (pnpm `patchedDependencies` in `pnpm-workspace.yaml`) swaps the deprecated `THREE.Clock` that R3F 9.8.x constructs. Re-check or drop it when upgrading `@react-three/fiber` (D11).
- Ambient sub-page backgrounds are a separate feature: `docs/specs/ambient-scene.md`.

## Core Flows
1. **Load:** points swarm inward from a loose cloud over 2.8 s, each with its own lag. The name glyph forms last.
2. **Intro → Wave:** the name's points drop into a perspective dotted field that runs past both screen edges across the bottom third. The drop is near-vertical.
3. **Wave → Interface:** points stream mid-flight, then condense into the right column. Each point regathers on its own stagger, so the formation never slides.
   - **Chapter stream (D23):** every morph runs points along noise currents in ribbons with gold packets (3.5%), enveloped to 0 at rest. Strength `flowStrength`: 1 intro → wave, 0.42 elsewhere. Scroll speed (`streamEnergy` → `uEnergy`, `streamLag` → `uLag`) stirs and strings it out; holding mid-morph keeps it drifting; in-flight points take a stronger cursor push plus swirl (desktop).
   - **Chapter travel (D24, trial):** between chapters the whole formation flies a curved Bézier route (`routeControl`) while it morphs; rest poses unchanged. Pinned version: `backup/hero-stream-pinned`.
4. **Interface → API → Data → Infrastructure:** the formation holds the right column and the text stays on the left. `ROT_Y` is constant per layer.
   - Each layer card shows its title, tech tags and 3 capability bullets.
   - Text blocks enter once and leave back to their own side (windows 0.004–0.043). Intro, wave and finale rise 48px from below and leave 32px upward. Layer cards slide in from alternating sides, `min(96px, 7% of viewport width)`. Enter and leave offsets are squared, so blocks arrive fast and settle softly (D12).
   - The word reveal (`[data-w]`) is unchanged.
   - Inside a card: eyebrow and title first, tags at d 0.3, bullets at 0.45 + 0.1j.
   - Data copy shows SQL and NoSQL breadth in the text. Tags are not highlighted (D10).
5. **Shipped (finale):** the formation returns to the left and the CTAs appear. The finale text rises from below (vertical only).
6. **Wave manifesto:** "Nobody sees the stack. They feel it…", with `feel` and `one` accented. Words reveal through ScrollWords in driven mode (`docs/specs/scroll-words.md`).
   - Below it, a 4-column grid of layers: number, title →, two techs. Each item is a button that calls `goTo` for its chapter.
   - Desktop places the block at padding-top 16svh; mobile at 14svh.
7. **Idle:** `breathe()` scales the formation by 1 ± 1.2% on `sin(t*0.9)`. The 404 scene uses the same pulse.
8. **Cursor:** acts in world space within radius 0.95, on the formation only. It never changes scroll or chapter state.
9. **Navigation:** the chapter rail and the stack outline (desktop, four layers, `goTo(j + LAYER_OFFSET)`) both call `goTo`. They never call `lenis.scrollTo` directly.
   - **Chapter rail (desktop, right edge):** one tick per chapter, seven in total. Each tick has a mono, uppercase label from `RAIL_LABELS`: "01 INTRO" … "07 SHIPPED".
     - The active chapter's label is always visible, in signal colour.
     - Hovering the rail (`group/rail`) shows every label on a bg/70 chip.
     - Keyboard focus on a tick shows that tick's label.
     - Labels only fade. They never slide.
   - **Mobile:** the bottom tick rail, without labels.
10. **Wheel snap (hero only):** speed is the raw WheelEvent delta (deltaMode-adjusted) over a 100ms window. It is read before `capWheelDelta` caps each event at 120px (D11).
    - **Slow, under 1800 px/s:** the page follows the hand. Inside the hero, Lenis lerp is 0.16 (base 0.09) and delta gain 1.15. When the gesture is quiet for 160ms, it finishes the chapter in the direction of travel at the same pace: `playSeconds` with `STEP_S` 2s per chapter, minimum 1s (was 3s and 1.5s, before that 2s/0.5s, 1.4s and 1.05s), easeOut. A move under 4% of vh springs back.
    - **Swipe, 1800 px/s or more:** plays exactly one chapter at a fixed pace, never faster for harder swipes. A swipe reaches the next chapter in about 1.7s. `easeSwipe` = 1-(1-t)^2 moves from the first frame. The rest of the gesture is swallowed. A new swipe during a playing chapter queues one more; a reverse swipe turns straight back.
    - **Free scroll:** only for a hard fling (2500+ raw px within the first 250ms) or three swipes within 900ms. A wheel held at swipe speed counts as another swipe every 400ms (`SUSTAIN_MS`), so a long mouse spin goes free. On going free, Lenis is credited the delta the gesture already sent (from + held). After a fling it settles forward to the next chapter in its direction, never back.
    - **Trackpad push:** a new push is a delta that rises to 20 or more and more than 3x the trough reached after the peak. The trough resets on ramp-up, so a swipe's own ramp is not a second push.
    - **Wheel during a glide:** stops the finishing glide in place (`scrollTo` at `animatedScroll`, immediate), then follows. No dip back.
    - **Touch, keys, scrollbar:** `settleStop` runs once scrolling is quiet. Past the nudge, it finishes in the direction of travel.
    - Snap tracks a `busyUntil` timestamp, not `onComplete`, because Lenis drops `onComplete` when a scroll is interrupted (`docs/memory/fixes.md`).

## Edge Cases
- Reduced motion or no WebGL: static posters, and chapter snap is disabled. The manifesto renders statically, without the layer grid.
- Outside the hero section, the wheel snap does nothing.
- A wheel event during a glide or a playing chapter never moves the page twice: the glide stops in place, and the rest of a swipe is swallowed.
- On handback to Lenis, the delta already sent is credited, so a fling keeps its distance.
- The stack outline is hidden below the desktop breakpoint. Cards and bullets still render on mobile.
- Empty `stackLayers[].points` renders the card without bullets. The layout does not break.
- Scroll-linked state goes through the frame loop only. Scrolling never re-renders React.
- Horizontal motion is limited to two cases. The hover nudge on "→" (`group-hover:translate-x-1`) is user-triggered. The text entrance slides (D12) play with scroll progress and never loop on their own.
- No autonomous left/right travel anywhere (D8, kept in D9 and D10). The wave runs wider than the screen, but its motion is vertical or along z.
- The wave's edge fade sits off-screen (|x| 2.8..3.15), so no fade line is visible.
- Mobile wave dots are a fixed size, so phones get the same texture as desktop.
- The 404 page uses the same engine: points form "404", then breathe.

## Autonomous UX Polish
- The stack outline and chapter rail double as navigation through the same snap. The active row uses the signal colour and `aria-current="step"`. Colour transition is 200 ms.
- The rail's active label stays readable without hover, so the current chapter is named at all times. Hover and focus reveal the rest.
- Networks start mid-activity rather than dead, so the scene reads as alive before the first scroll.
- Rail clicks use the same snap as the wheel, so they never fight it.
- The manifesto layer grid doubles as navigation: hover colour and a 200 ms arrow nudge.
- Layer cards use staggered line reveals (see Core Flows 4).
- Fixed dot size on mobile keeps the wave texture consistent.
- Cursor parallax adds depth at no scroll cost.
- Hover arrow nudges on links give direction feedback without autonomous motion.
