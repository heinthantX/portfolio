# Design decisions

Each entry: what was chosen, what lost, why. Newest at the bottom.

## D1 — Hero concept shortlist and scores (2026-10-15 02:25)

Panel: Opus, Sonnet, Gemini 3.8 Flash High (stand-in for agy pro; Gemini 4 Argon unavailable), agy Claude Sonnet 4.6. 12 concepts in `concepts/panel-*.md`. Several overlapped, so they were merged:

| Concept (source) | Wow | Relevance | Feasibility | Mobile perf | Maintain | Total |
|---|---|---|---|---|---|---|
| **Blueprint** — Stack starts as a 2D technical drawing, extrudes into hardware, runs (Opus #3 + §5 + Gemini #1) | 4 | 5 | 5 | 5 | 5 | **24** |
| **Living Cluster** — isometric cluster that schedules, scales, self-heals, rolls out (Sonnet #2, Opus #2 2nd half) | 4 | 4 | 4 | 5 | 4 | **21** |
| **Trace** — one request becomes a 3D trace waterfall (Opus #1, Sonnet #3) | 4 | 4 | 4 | 4 | 4 | 20 |
| **Pipeline Rail** — a commit rides a rail through CI/CD stations (Sonnet #1, Opus #2) | 4 | 5 | 3 | 4 | 3 | 19 |
| Topology / Service Mesh (agy-Sonnet #3, Gemini #2) | 3 | 4 | 4 | 4 | 4 | 19 |
| Control Room incident (agy-Sonnet #1) | 3 | 4 | 4 | 4 | 4 | 19 |
| Telemetry Deck, TE-style console (Gemini #3) | 5 | 3 | 2 | 3 | 2 | 15 |
| Pipeline tube fly-through (agy-Sonnet #2) | 4 | 4 | 2 | 2 | 3 | 15 |

Key frames for the top 5 are in `concepts/{blueprint,cluster,trace,pipeline,deck}-{a,b}.png`.
Notes from looking at them:
- **blueprint-b** (exploded slabs + amber arcs + leader lines) is the strongest single frame and reads as "system" instantly. blueprint-a proves the drawing→hardware idea is visually distinct from every reference.
- **cluster-b** (rollout wave across a pod grid with a green ring) is gorgeous and very DevOps, but alone it under-sells the front end.
- **deck** is the most memorable object but reads "hardware/product designer", not "software engineer", and procedural modelling of dials is a build-time risk.
- **trace-b** is elegant but abstract; needs explanation.

**Decision:** prototype **Blueprint** vs **Living Cluster** on `/lab`. Planned combination if Blueprint wins: borrow the Cluster's rollout wave + click-to-kill self-heal for the Infrastructure layer's scale-out phase, and the Trace idea ("send another request") for the request-flow phase.
Lost: Trace, Pipeline, Deck, Topology, Control Room (lower feasibility or weaker 5-second read as full-stack).
