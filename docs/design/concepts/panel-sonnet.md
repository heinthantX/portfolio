### The Pipeline Rail
- **Idea:** One glowing commit rides a machined 3D rail through every CI/CD station to production, and the page scrolls along that rail.
- **Shows full-stack + DevOps by:** Stations are real delivery stages: Commit (UI change), Test (API contract), Migrate (Postgres), Build (container), Deploy (cluster). The path from code to live is the story.
- **Scroll storyboard:**
  1. 0-12% Dark rail, one amber "commit" pulse waits; headline readable.
  2. 12-30% Camera follows pulse to Lint/Test gate; gate bars flick green one by one.
  3. 30-50% Pulse splits into 3 and passes the Migrate gate (a cylinder stack that locks, `schema ok`).
  4. 50-70% Build station: a container cube is assembled from layered plates and stamped with a short hash.
  5. 70-88% Registry shelf, then a deploy switch; a blue-green fork, traffic swings to green.
  6. 88-100% Rail ends at a lit "live" platform; camera pulls back to show the whole rail as a map; status reads `deployed ✓`.
- **Interactions:**
  - Click any station to expand a short HTML panel (what I run there).
  - "Break the build" toggle: a gate turns red, the pulse stops, and "Rollback" reverses it.
  - Easter egg: type `git push --force` anywhere; a polite red stamp says `rejected: protected branch`.
- **Site experience:**
  - Graphite and amber, with a 1px rail line continuing down the DOM so sections feel like stations.
  - Geist Mono step labels `01 / lint`, a hash-style section ID, and a sticky mini-map of stations.
  - Section transitions are the camera moving to the next station (View Transitions between pages).
- **Tech approach:** One CatmullRom spline for camera and pulse, driven by a scroll ref (maath damping). Stations are small procedural groups. Gates, cubes and hashes are instanced. Pulse trail uses a tiny custom `shaderMaterial` (fading line). No post-fx on mobile; selective bloom on the pulse for desktop.
- **Risks:** Performance low. Mobile low (portrait camera path needs tuning). Build time medium (five distinct station models).
- **Key-frame prompts:**
  1. Isometric dark graphite CAD rendering of a thin amber light pulse passing through a precision-machined test gate on a glowing rail, soft depth of field, no text.
  2. Wide aerial view of a long graphite rail with five small mechanical stations, ending at a softly lit platform with a green ring, blueprint dot grid.

### Living Cluster
- **Idea:** A top-down isometric Kubernetes-style cluster of tiles that handles traffic, loses a node, heals itself and rolls out a release.
- **Shows full-stack + DevOps by:** Pods are tagged app/api/db/cache, so it reads as full-stack, while autoscaling, self-healing and rolling deploys are the DevOps proof.
- **Scroll storyboard:**
  1. 0-15% Empty grid; nodes rise one by one into a 4x3 cluster.
  2. 15-35% Pods (instanced cubes) schedule onto nodes, colour-coded by layer via edge accents.
  3. 35-55% Traffic arrives from the left edge; load bars climb, lines pulse.
  4. 55-72% Autoscale: pods multiply 6 to 18 and spread across nodes.
  5. 72-88% One node flickers and dies; pods visibly drain and reschedule within a second.
  6. 88-100% Rolling update sweeps left to right, old pods dissolve and new ones snap in; `rollout complete ✓`.
- **Interactions:**
  - Hover a node for a mono tooltip (CPU, pods).
  - Click a node to kill it (live chaos test); the cluster heals.
  - Easter egg: the `⌘K` terminal runs `kubectl get pods` and the real pods in the scene highlight.
- **Site experience:**
  - Dense mono HUD around the canvas (pods, nodes, p95), driven by the scene state.
  - Numbered-list sections keep the editorial layout; amber used only for traffic and focus.
  - Motion is snappy and spring-based; cross-fades between pages.
- **Tech approach:** Orthographic camera, one InstancedMesh for pods, one for node plates, a simple scheduler function in TS that computes pod targets from a progress value. Pod motion eased by maath. Traffic lines use a dash-offset shader. No post-fx.
- **Risks:** Performance low. Mobile low (ortho camera, few draw calls). Build time medium (scheduler logic plus interactions).
- **Key-frame prompts:**
  1. Top-down isometric graphite grid of machined server tiles with small amber cubes arranged on them and thin hairline connections, one tile dimmed.
  2. Same grid mid-rollout: a soft wave of new glowing cubes replacing old ones across tiles, a faint green ring at the edge, no text.

### Trace
- **Idea:** The hero is a distributed trace: one request unfolds into a 3D flame graph whose spans are the site's sections.
- **Shows full-stack + DevOps by:** Each span is a layer (browser, edge, API, cache, DB, queue), and optimizing the slowest span shows performance and observability work.
- **Scroll storyboard:**
  1. 0-15% A single amber line (the request) draws across a dark plane.
  2. 15-35% It unfolds into stacked horizontal bars (spans) rising out of the plane, labelled in mono.
  3. 35-55% Camera tilts down the waterfall; bars time-scrub as the request "executes".
  4. 55-70% A long DB span glows red; a tooltip says `seq scan 480ms`.
  5. 70-85% Add an index: the bar collapses and parallel spans slide left; total drops 640 to 90ms.
  6. 85-100% Bars settle into a clean flat strip that becomes the page nav.
- **Interactions:**
  - Drag a latency slider to stretch spans live.
  - Click a span to jump to the matching section.
  - Easter egg: pressing `k` plays a quick k6 load test, bars vibrate, p99 climbs, then calms.
- **Site experience:**
  - Quiet, typographic, mostly 2D with one strong 3D moment; hairline-heavy layout.
  - The span strip doubles as a reading-progress bar through all pages.
  - Transitions slide spans left, like a trace refreshing.
- **Tech approach:** Instanced bars with per-instance start/duration attributes in a small vertex shader; labels via drei Text. Scroll ref drives time. Selective bloom on the hot span only (desktop).
- **Risks:** Performance low. Mobile low. Build time low (simplest model set), but the idea reads as less "wow" than the others.
- **Key-frame prompts:**
  1. Dark graphite plane with stacked glowing amber horizontal bars forming a flame graph, tilted isometric, thin hairline grid, shallow depth of field, no text.
  2. The same flame graph after optimization: shorter neat bars aligned in a tidy cascade, one small green dot at the end.
