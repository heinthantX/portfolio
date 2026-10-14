# Concept panel: Opus

### 1. Trace

- **Idea:** The camera follows one request from a phone tap to Postgres and back, and the trip resolves into a 3D distributed-trace waterfall.
- **Shows full-stack + DevOps by:** Each span is a layer Hein owns (RN client, edge, NestJS/Go, Redis, Postgres) ending on the observability view seniors debug with.
- **Scroll storyboard:**
  1. 0–12%: A hairline phone silhouette and one amber tap ripple. Status: `trace 7f3a… started`.
  2. 12–30%: The camera rides the packet through an edge gateway ring, and a span bar extrudes behind it.
  3. 30–50%: The API route graph lights one path. The packet forks into parallel spans (auth + handler).
  4. 50–68%: A Redis cube misses (one flicker), then a Postgres B-tree lights level by level. The About text appears.
  5. 68–85%: The response returns and the spans close. The camera pulls out, and the trip flattens into a waterfall.
  6. 85–100%: The waterfall settles on the grid: `200 OK · trace complete` with an `--ok` tick.
- **Interactions:**
  - Hover/focus a span to raise it and show its stack (from `profile.ts`).
  - "Send another request" replays the trip down a different route.
  - Easter egg: `curl -I` in ⌘K returns `418 I'm a teapot`.
- **Site experience:**
  - Graphite, with amber kept for the live packet and active span. Each section header has a span bar that fills as you read.
  - Mono trace IDs as eyebrows (`span 03 / experience`).
  - View Transitions stretch clicked cards into the page header.
- **Tech approach:** R3F + drei `Instances`, a `CatmullRomCurve3` camera rail sampled from the progress ref, a `shaderMaterial` for span fill with a soft leading edge, and selective bloom on the packet (desktop only).
- **Risks:** performance **low**, mobile **med** (camera motion vs text legibility, so a shorter rail on mobile), build time **med** (the rail plus the waterfall morph).
- **Key-frame prompts:**
  - A single amber packet streaking through a graphite void past wireframe octahedron nodes, trailing an extruding translucent bar, hairline technical-drawing style.
  - An isometric 3D trace waterfall of thin graphite slabs in staggered rows, one amber leading edge and a small green "200 OK" tick.

### 2. Green Pipeline

- **Idea:** Scroll is a CI/CD run: one commit becomes a container, passes the gates and rolls out across a self-healing cluster.
- **Shows full-stack + DevOps by:** A cutaway of the artifact shows the app layers (UI/API/data), and the second half is pure ops: gates, canary, rolling update, self-healing.
- **Scroll storyboard:**
  1. 0–15%: An amber commit node on a thin git line. `a1c9e2f feat: hello`.
  2. 15–32%: Voxels assemble into a container cube with three visible internal slices.
  3. 32–48%: The cube passes three hairline gate frames (`lint`, `test`, `scan`).
  4. 48–66%: A 12-node cluster grid appears and a canary pod gets an amber halo. The About text appears.
  5. 66–84%: A rolling-update wave sweeps the grid. One pod blinks `--danger` and is rescheduled.
  6. 84–100%: A green pulse runs along the git line: `deployed ✓ 12/12 ready`.
- **Interactions:**
  - Click/tap a pod to kill it and watch it recover.
  - "Ship it again" pushes a new hash and replays beats 2–6.
  - Easter egg: `kubectl get pods` in ⌘K lists the site's sections as pods; `kubectl delete pod about` scrolls to About.
- **Site experience:**
  - Each section is a pipeline stage (`stage 3/6 · experience`) with a 1 px progress line.
  - Motion is mechanical: short eased snaps, never floaty.
  - Page transitions use a 300 ms hairline "build" sweep.
- **Tech approach:** drei `Instances` for voxels and pods (one draw call each), a vertex shader that lerps per-instance offsets by the progress uniform, `maath` damping, and no post-fx on mobile.
- **Risks:** performance **med** (cap voxels at ~300 on mobile), mobile **low** (a top-down grid suits portrait), build time **med**.
- **Key-frame prompts:**
  - A graphite container cube assembling from floating voxels above a thin amber git line, a cutaway showing three internal slices.
  - A top-down grid of twelve dark server plates with small cubes, an amber wave sweeping across and one red cube being replaced.

### 3. Blueprint (Stack variation)

- **Idea:** "The Stack" begins as a 2D technical drawing on the dot grid, then extrudes off the paper into machined hardware and runs.
- **Shows full-stack + DevOps by:** The §5 four layers, framed by a drawing→build→run arc that mirrors spec→ship→operate.
- **Scroll storyboard:**
  1. 0–15%: An orthographic blueprint (plan + elevation) draws itself.
  2. 15–35%: The camera tilts to perspective and the lines extrude into PBR slabs.
  3. 35–55%: Exploded view with labels on leader lines.
  4. 55–75%: Packet flow, then infra scales 3→12.
  5. 75–90%: Everything collapses back to the blueprint, stamped `REV 26 · deployed`.
  6. 90–100%: The drawing's title block becomes the contact CTA.
- **Interactions:**
  - Drag to snap between top, front and iso views.
  - Hover a layer to show its dimension callout.
  - Easter egg: `D` toggles "draft mode", where the whole site renders as blueprint linework.
- **Site experience:**
  - Sections framed as drawing sheets with title blocks (`SHEET 03 OF 07`).
  - Lines draw in on scroll, with condensed mono callouts.
- **Tech approach:** a `shaderMaterial` with an `uExtrude` uniform plus a fresnel edge, drei `Line` with dash offset, an ortho→perspective camera blend, and §5's instancing unchanged.
- **Risks:** performance **low**, mobile **low**, build time **low** (reuses §5).
- **Key-frame prompts:**
  - A white-on-graphite orthographic blueprint of four stacked slabs with dimension lines, one corner extruding into glossy 3D hardware.
  - Four machined dark slabs in an exploded view, labelled by thin leader lines, amber packets between them, a title block reading "REV 26 · deployed".
