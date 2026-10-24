> **Archived 2026-10-24 (D21).** The site-wide wave (`docs/specs/site-wave.md`) replaced these per-route backgrounds. The code is kept in two places:
> - Git branch `backup/ambient-scene` (commit b998834), the last version of the site that had them.
> - `docs/archive/ambient-scene-src.tar.gz`, a copy of `src/features/ambient-scene/` taken from that commit.
>
> To restore:
> 1. Run `git checkout backup/ambient-scene -- src/features/ambient-scene`, or `tar xzf docs/archive/ambient-scene-src.tar.gz`.
> 2. Mount `<AmbientBackground />` in `src/app/layout.tsx` again.
> 3. Bring back the `.ambient-mask` CSS from that commit's `src/app/globals.css`.

# Ambient scene (sub-page backgrounds)

Rationale: `docs/design/DECISIONS.md` (D6 for the ambient canvas, D8 for vertical-only motion, D10 for firing networks). Hero scene: `docs/specs/signal-hero.md`.

## Architecture
- Source: `src/features/ambient-scene/`.
- `AmbientCanvas.tsx`: one cheap R3F canvas behind sub-pages, one variant per route. No bloom, low contrast.
- `firing.ts`:
  - `createFiring`: a seeded spiking net. Each neuron has a spontaneous rate, a carry chance (a spike passes to neighbours), a refractory period, and a pulse travel time along each link.
  - `nearestLinks`: builds each neuron's links to its nearest neighbours.
- `Synapses.tsx`: CPU-rendered overlay used by every variant. Links are split into 6 pieces that jag around the pulse head. Nodes flash in the accent colour when they fire.
- Variants:
  - **sheets** (`/work`): floating drawing sheets. Sheet corners are linked across sheets.
  - **field** (`/notes`): dot neurons. 30 by default, 14 on low-power devices.
  - **graph** (`/resume`, `/uses`): replaces the old static service graph. The cursor raises the firing rate by up to +1.6/s.
  - **packets** (`/contact`): routes turned upright, so packets rise instead of moving sideways. A corner network sits beside them.
- The CSS dot-grid stays behind the canvas, as in D6.

## Core Flows
1. **Load:** the route picks the variant. The canvas loads lazily, after idle.
2. **Firing:** each neuron spikes spontaneously. A spike carries to its neighbours with the carry chance, then the neuron rests for its refractory period. A pulse takes its travel time to cross a link, and the overlay draws it.
3. **Cursor (graph only):** pointer proximity raises the firing rate by up to +1.6/s. It does not change scroll.
4. **Visibility:** the canvas pauses when the tab is hidden.

## Edge Cases
- Reduced motion does not step the firing simulation. The page shows a static frame.
- Motion is vertical only. Sheets drift vertically, and packets rise (D8).
- Low-power devices run the field with 14 neurons instead of 30.
- Without WebGL, the CSS dot-grid remains. Whether the CPU overlay (`Synapses.tsx`) still draws in that case is **open**: it is CPU-rendered, but the fallback path has not been confirmed in code.

## Autonomous UX Polish
- The cursor excites graph neurons, so the graph responds to the reader.
- Networks start mid-activity rather than dead, so the background reads as alive on arrival.
- Sheet corners link across sheets, so the page reads as one system.
