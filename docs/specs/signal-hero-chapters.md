# Signal hero: copy and navigation

Scene engine: `signal-hero.md`. Wheel pace: `signal-hero-pace.md`.

## Architecture
- `SignalHero.tsx`: DOM layer. Sticky stage, chapter copy, layer cards, wave manifesto, stack outline, chapter rail (`RAIL_LABELS`, `group/rail`).
- Text entrance slides (D12): `slideFrom(i)` gives each block its side. Intro, wave and finale return 0 (vertical rise only).
- Layer cards use `(i - LAYER_OFFSET) % 2`: -1 (from the left) for interface and data, +1 (from the right) for api and infra.
- Slide distance is `min(96px, 7% of viewport width)`. Enter and leave offsets are squared on the textState values.
- Displayed progress uses `easeToward` rate 16, was 5 (src: SignalHero.tsx, 2026-11-07).
- Stack copy comes from `src/content/profile.ts`. `stackLayers[].points` is validated in `profile.schema.ts`, default `[]`.

## Core Flows
1. **Interface → API → Data → Infrastructure:** the formation holds the right column; text stays left. `ROT_Y` is constant per layer.
   - Each layer card shows its title, tech tags and 3 capability bullets.
   - Text blocks enter once and leave back to their own side (windows 0.004–0.043, unverified).
   - Intro, wave and finale rise 48px and leave 32px upward (unverified).
   - Layer cards slide from alternating sides. Enter and leave offsets are squared, so blocks settle softly (D12).
   - Word reveal (`[data-w]`) is unchanged.
   - Inside a card: eyebrow and title first, tags at d 0.3, bullets at 0.45 + 0.1j (unverified).
   - Data copy shows SQL and NoSQL breadth in the text. Tags are not highlighted (D10).
2. **Shipped (finale):** the formation returns left and the CTAs appear. Finale text rises from below (vertical only).
3. **Wave manifesto:** "Nobody sees the stack. They feel it…", with `feel` and `one` accented, via ScrollWords driven mode (`scroll-words.md`).
   - Below it, a 4-column layer grid: number, title →, two techs. Each item calls `goTo` for its chapter.
   - Padding-top is 16svh on desktop and 14svh on mobile (unverified).
4. **Navigation:** the chapter rail (desktop, right edge) and the stack outline (desktop, four layers, `goTo(j + LAYER_OFFSET)`) call `goTo`, never `lenis.scrollTo`.
   - Rail: one tick per chapter, seven in total. Mono uppercase labels from `RAIL_LABELS`: "01 INTRO" … "07 SHIPPED".
   - The active label is always visible, in signal colour, on a bg/70 chip (src: SignalHero.tsx, 2026-11-07).
   - Hovering the rail (`group/rail`) shows every label on a bg/70 chip.
   - Keyboard focus on a tick shows that tick's label. Labels only fade; they never slide.
   - Mobile: a bottom tick rail, without labels.

## Edge Cases
- Reduced motion or no WebGL: the manifesto renders statically, without the layer grid.
- The stack outline is hidden below the desktop breakpoint. Cards and bullets still render on mobile.
- Empty `stackLayers[].points` renders the card without bullets.
- Scrolling never re-renders React: scroll state goes through the frame loop only.
- Horizontal motion is limited to the "→" hover nudge (`group-hover:translate-x-1`, user-triggered) and the entrance slides, which play with scroll progress and never loop.

## Autonomous UX Polish
- The stack outline and rail double as navigation through the same snap, so clicks never fight the wheel.
- The rail's active label stays readable without hover, so the current chapter is always named.
- The active stack row uses signal colour and `aria-current="step"`, with a 200 ms colour transition (unverified).
- The manifesto layer grid has hover colour and a 200 ms arrow nudge (unverified).
- Layer cards use staggered line reveals (signal-hero.md Core Flows 1 for the load order).
