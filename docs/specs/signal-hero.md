# Signal hero

Scene engine only. Copy and navigation: `signal-hero-chapters.md`. Wheel pace: `signal-hero-pace.md`. First-visit guide: `hero-guide.md`. Rationale: `docs/design/DECISIONS.md` (D7–D11, D16–D18, D23–D25).

## Architecture
- One GPU particle system, about 16k points (unverified), in `src/features/signal-scene/`.
- `SignalPoints.tsx`: geometry and shader. Owns the intro swarm (`uIntro`, `INTRO_S` 2.8 s (unverified), per-point lag) and the morph.
- Each point blends its two endpoint world poses (`uMatA`/`uMatB`, `uScaleAB`) on its own stagger.
- Wave dots keep a fixed size (`mix(sc, 0.95, wv)`). `uWaveA`/`uWaveB` swell the field in place; crests roll along z only.
- `uDissolve` lifts and thins points as they leave the wave.
- `aNodeA`/`aNodeB` mark neurons: they glow, flash as the current reaches them, and stray points crackle.
- `dripRef` prop feeds the hero guide's drip term (`hero-guide.md`).
- `shapes.ts` (tests `shapes.test.ts`): `shapes.wave(n)` is a grid on the XZ plane, wider than the screen: `WAVE_FAR` 3.1, `WAVE_NEAR` 2.1, `WAVE_RATIO` 3.4 (unverified).
- `waveCells(field)` recovers the grid from positions. `matchByX` pairs points left to right, so the drop is near-vertical.
- `data(n)`: Schema Crystal (D16). Tilted 4x4x4 cube lattice, rigid on the left; right edges break into fragments that become six document cards, plus a cache ring with three dots.
- `infra(n)`: Harbor Cloud (D18), an unlabelled cartoon diagram. A scalloped VPC cloud with a satellite dish (CDN) on top.
- Below the cloud: a lighthouse gateway, three container ships (the smallest is the sidecar), a deploy crane, three barrels (DB), a buoy (cache), and a monitoring tower.
- Networks: each shape has one `THREE.LineSegments` sharing the points' uniforms.
  - Wave: `waveNet`, paths flowing from the horizon toward the viewer (depth 0..1).
  - Other shapes: `neuralNet(shape, 110 neurons, 2 nearest links)`. Depth is hop count from the first neuron, packed into 0..0.4 (unverified).
  - GLSL `pulseHead(phase)` = `fract(uTime*0.28+phase)*1.4-0.2` drives both (unverified).
  - Links split into 5 pieces (`linkGeometry`); vertices jag (`aJit`/`aSub`) while a pulse crosses.
  - Links fade in only once both ends have landed (`uMode` +1 arriving, -1 leaving).
- `SignalCanvas.tsx`: R3F canvas, `breathe()` idle pulse, cursor in world space (radius 0.95, unverified). Networks start mid-activity.
- `timeline.ts`: `CHAPTER_IDS` is the source: intro, wave, interface, api, data, infra, shipped. `CHAPTERS`, `LAYER_OFFSET` (2) and `WAVE_CHAPTER` (1) derive from it (unverified).
- `chapterPose(i, view)` gives each chapter's resting pose; `Drive` is `{s, from, to}`. `FORMATION_SIDE` `[0,0,1,1,1,1,0]`; `SIDE_X` 0.235 (infra 0.19); morph window `W` 0.077 (unverified).
- Wave pose: x 0, `Y_H` -0.37 × view height, rotX 0.35, scale min(3.2, 1.12 × w/4.4) (unverified).
- Mobile: `MOBILE_Y_H` -0.3, `MOBILE_FIT` 1.35, rotX 0.5 (unverified). `fillWaveBottom` (D17) grows scale so the near row reaches the bottom edge.
- Hero section height `450vh` (unverified).
- Scroll progress (0..1) is read in rAF or `useFrame` only, never React state.
- Dependency patch `patches/@react-three__fiber@9.8.1.patch` swaps the deprecated `THREE.Clock` (D11). Re-check on `@react-three/fiber` upgrade.

## Core Flows
1. **Load:** points swarm inward from a loose cloud over 2.8 s, each with its own lag. The name glyph forms last.
2. **Intro → Wave:** the name's points drop into a perspective dotted field that runs past both screen edges across the bottom third. The drop is near-vertical.
3. **Wave → Interface:** points stream mid-flight, then condense into the right column. Each point regathers on its own stagger; the formation never slides.
   - **Chapter stream (D23):** morphs run points along noise currents in ribbons, with gold packets (3.5%, unverified). Enveloped to 0 at rest.
   - **Stream strength:** `flowStrength` is 1 for intro → wave, 0.42 elsewhere (unverified).
   - **Scroll energy:** `streamEnergy` → `uEnergy` and `streamLag` → `uLag` stir and string out the stream. Holding mid-morph keeps it drifting.
   - **In-flight cursor:** in-flight points take a stronger cursor push and swirl (desktop).
   - **Chapter travel (D24, trial):** between chapters the formation flies a curved Bézier (`routeControl`) while morphing. Rest poses are unchanged. Pinned: `backup/hero-stream-pinned`.
   - **Hand-off (D25):** on `/` the hero draws on the home-stream canvas. After `shipped` (rest at 92.5%, unverified), points dissolve into the page stream (`home-stream.md`).
4. **Idle:** `breathe()` scales the formation by 1 ± 1.2% on `sin(t*0.9)`. The 404 scene uses the same pulse (unverified).
5. **Cursor:** acts in world space within radius 0.95, on the formation only. It never changes scroll or chapter state.

## Edge Cases
- Reduced motion or no WebGL: static posters. Chapter snap is off (`signal-hero-pace.md`).
- The wave runs wider than the screen, but its motion is vertical or along z.
- The wave's edge fade sits off-screen (|x| 2.8..3.15), so no fade line shows (unverified).
- The 404 page uses the same engine: points form "404", then breathe.
- No autonomous left/right travel (D8, kept in D9 and D10).

## Risks & checks
- Scene risks this sync (drip term, progress easing) are in `hero-guide.md` and `signal-hero-pace.md`.

## Autonomous UX Polish
- Networks start mid-activity, so the scene reads as alive before the first scroll.
- Fixed dot size on mobile keeps the wave texture the same as desktop.
- Cursor parallax adds depth at no scroll cost.
