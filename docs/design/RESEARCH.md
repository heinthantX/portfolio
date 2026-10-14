# Portfolio Design & Technology Research

> Research brief: Award-winning developer portfolios, scroll-driven 3D WebGL experiences, technical engineering aesthetics, and state of the front-end/3D graphics stack (October 2026).
> Target persona: Full-Stack & DevOps Engineer (React/Next.js, React Native, NestJS, Go, Postgres, Redis, Docker, Kubernetes, CI/CD).
> Visual benchmark: Awwwards Site of the Day caliber combined with senior systems engineering credibility.

---

## 1. Bruno Simon — https://bruno-simon.com
Screenshot: refs/01-bruno-simon.png

### What makes it work
- **Gamified spatial storytelling:** Transforms the portfolio into a physical 3D playground where visitors pilot an RC truck across an isometric terrain to inspect projects displayed on physical billboards, containers, and road signs.
- **Flawless physics and tactile response:** Real-time collision physics (via Cannon-es), vehicle suspension damping, and interactive bowling pins/bricks that react dynamically to user input.
- **Seamless discoverability without barriers:** While the 3D world encourages exploration, a clean top-level 2D overlay navigation bar allows instant, friction-free jumping directly to specific projects, skills, or contact info.

### Idea to borrow
- **Physical interactivity for technical concepts:** Treat technical infrastructure (Docker containers, database cylinders) as tangible, reactive 3D objects with physical weight and snap animations (e.g., a "Ship it again" trigger that drops containers onto an infrastructure grid).
- **Graceful overlay navigation:** Always provide a rapid 2D overlay menu and keyboard shortcuts alongside the spatial 3D experience so recruiters can jump straight to technical credentials.

### Tech
- Three.js, Cannon-es physics, custom GLSL shaders, WebGL, Vanilla JS.

---

## 2. Jesse Zhou — https://jesse-zhou.com
Screenshot: refs/02-jesse-zhou.png

### What makes it work
- **Architectural spatial framing:** Renders an isometric software engineer's room with baked lighting, dual monitor workstations, a server rack, and technical books.
- **Choreographed camera transitions:** Clicking on navigation items glides the 3D camera smoothly from an overview angle down to a macro focus on the workstation monitor (projects), whiteboard (about), or desk drawers (skills).
- **Unified 3D-to-2D interface:** Screen surfaces inside the 3D scene seamlessly host real HTML text and interactive terminal interfaces.

### Idea to borrow
- **Camera easing between system layers:** Use scroll progression to shift the camera focus between different layers of the technical stack (Interface at the top, API in the center, Infrastructure at the base).
- **Embedded terminal prompt on the workstation screen:** Place a live interactive terminal prompt inside the hero scene that responds to shell commands (`whoami`, `cat stack.json`, `kubectl get pods`).

### Tech
- React Three Fiber, Drei, Three.js, Tailwind CSS, GSAP.

---

## 3. Henry Heffernan — https://henryheffernan.com
Screenshot: refs/03-henry-heffernan.png

### What makes it work
- **Interactive vintage OS simulation:** A fully rendered retro CRT computer workstation in 3D that powers up upon interaction, booting into an interactive graphical desktop operating system.
- **Deep mechanical tactile polish:** Features custom mechanical keyboard sound design, CRT screen curvature, scanline post-processing, and draggable desktop windows.
- **Authentic engineering Easter eggs:** Includes a functional terminal shell, text editors with real code snippets, and nostalgic diagnostic utilities that showcase obsessive attention to detail.

### Idea to borrow
- **Tactile control-room sound design:** Provide optional, subtle mechanical switch sounds and terminal key clicks with an unobtrusive audio toggle in the header.
- **Interactive diagnostic utilities:** Expose a system status HUD or diagnostic modal displaying live uptime, container build hashes, and system latency.

### Tech
- Three.js, WebGL, Howler.js, custom CSS window manager.

---

## 4. Dennis Snellenberg — https://dennissnellenberg.com
Screenshot: refs/04-dennis-snellenberg.png

### What makes it work
- **Kinetic typography and micro-interactions:** The industry benchmark for freelance creative developer portfolios; features fluid magnetic cursor tracking, elastic button hover states, and smooth typographic roll-overs.
- **Disciplined editorial hierarchy:** Restrained monochrome layout with oversized serif/sans headlines contrasted against structured monospace metadata chips and precise hairline dividers.
- **Zero-lag scroll inertia:** Flawless scroll physics combining momentum scrolling with GSAP ScrollTrigger scrubbing, delivering seamless section pinning and horizontal case-study reveals.

### Idea to borrow
- **Magnetic button physics:** Apply subtle spring-damped magnetic pull to primary action buttons ("View work", "Get in touch") as the cursor enters their boundary.
- **Hairline divider animations:** Draw 1px accent hairline dividers across sections progressively as the user scrolls into view.

### Tech
- GSAP, ScrollTrigger, Locomotive Scroll / Custom Smooth Scroll, Vanilla JS, Barba.js.

---

## 5. Brittany Chiang — https://brittanychiang.com
Screenshot: refs/05-brittany-chiang.png

### What makes it work
- **The gold-standard developer layout:** Split-screen sticky composition featuring a pinned left column (identity, navigation anchors, social links) and a smooth scrolling right feed (bio, experience pipeline, projects).
- **Ambient mouse spotlight illumination:** A subtle radial gradient follows the cursor across dark slate/graphite cards, softly illuminating 1px border lines without distraction.
- **Flawless accessibility and scanability:** Impeccable contrast ratios, semantic section landmarks, accessible keyboard focus rings, and high text legibility optimized for technical hiring managers.

### Idea to borrow
- **Split sticky composition for narrative flow:** Pin the technical identity and sticky 3D stack on one side while long-form architectural case studies scroll on the other.
- **Radial spotlight cursor effect:** A subtle 600px CSS radial-gradient pinned to pointer coordinates that illuminates hairline borders on dark graphite cards.

### Tech
- Next.js, React, Tailwind CSS.

---

## 6. Paco Coursey — https://paco.me
Screenshot: refs/06-paco-coursey.png

### What makes it work
- **Radical craft and interaction minimalism:** Created by the author of `cmdk`; stripped of all visual noise to prioritize instant loading, typographic rhythm, and keyboard-first navigation.
- **Frictionless keyboard shortcuts:** Pressing `⌘K` or single hotkeys navigates essays, projects, and craft experiments instantaneously.
- **Subtle spring-based micro-interactions:** Lists, popovers, and dialogs expand and collapse using fine-tuned physical spring damping with zero visual layout jarring.

### Idea to borrow
- **Keyboard-driven command palette (`⌘K`):** Implement a terminal-styled command palette with quick actions to copy email, inspect tech stack, jump to sections, or trigger scene re-renders.
- **Dense monospace metadata:** Use monospace typography for timestamps, reading times, deployment tags, and commit hashes to establish an engineering tone.

### Tech
- Next.js, React, cmdk, CSS Modules / Tailwind CSS.

---

## 7. Rauno Freiberg — https://rauno.me
Screenshot: refs/07-rauno-freiberg.png

### What makes it work
- **"Invisible details" engineering philosophy:** Interactive essays dissecting tactile UI physics, raymarching, spring elasticity, and audio feedback directly through live interactive widgets.
- **Interactive craft demonstrations:** Rather than claiming expertise, every engineering principle is backed by an interactive canvas or DOM widget embedded directly within the article flow.
- **Restrained dark palette:** High-contrast graphite backgrounds (`#0B0D10`), precise hairlines, and muted secondary labels that command immediate respect from frontend and systems engineers.

### Idea to borrow
- **Interactive system widgets inside case studies:** Embed interactive micro-widgets (such as a simulated load-spiker or database query latency slider) directly inside project breakdowns.
- **Spring-damped active states:** Ensure every clickable surface uses spring-physics damping rather than linear CSS transitions.

### Tech
- Next.js, React, Framer Motion / Motion, Radix UI.

---

## 8. Emil Kowalski — https://emilkowal.ski
Screenshot: refs/08-emil-kowalski.png

### What makes it work
- **Design engineering benchmark:** Developed by the creator of Sonner (toast notifications); focuses on gestural animations, physics-based springs, and layout animations.
- **Live interactive sandbox documentation:** Interactive canvas widgets and sliders allow users to manipulate animation curves, spring stiffness, and damping live on the page.
- **Crisp typography and spacing:** Generous whitespace, precise typographic scale with `clamp()`, and flawless dark/light theme switching.

### Idea to borrow
- **Interactive parameter controls:** Provide real-time sliders or toggles in case studies (e.g., adjusting replica count to visualize Kubernetes horizontal pod autoscaling).
- **Polished toast feedback via Sonner:** Use lightweight, gestural Sonner toasts for copy-to-clipboard actions and contact form status messages.

### Tech
- Next.js, React, Framer Motion / Motion, Sonner, Tailwind CSS.

---

## 9. Maxime Heckel — https://blog.maximeheckel.com
Screenshot: refs/09-maxime-heckel.png

### What makes it work
- **Interactive 3D shaders embedded in technical essays:** The industry standard for blending rigorous engineering articles with real-time React Three Fiber viewports and custom GLSL/TSL shaders.
- **Scroll-linked shader uniforms:** Canvas viewports seamlessly update lighting parameters, particle distributions, and camera angles based on the reader's scroll position.
- **Deep technical authority:** Demonstrates mathematical and architectural mastery by explaining how custom vertex and fragment shaders operate under the hood.

### Idea to borrow
- **Custom shader materials linked to scroll:** Connect R3F `shaderMaterial` uniforms (time, scroll progress, packet velocity) directly to ScrollTrigger's scrub position.
- **Interactive 3D inspection inside case studies:** Include interactive 3D architecture diagrams in project case studies where users can rotate and inspect individual distributed system nodes.

### Tech
- Next.js, React Three Fiber, Drei, Three.js, Stitches / Tailwind CSS.

---

## 10. Basement Studio — https://basement.studio
Screenshot: refs/10-basement-studio.png

### What makes it work
- **Dark brutalist engineering aesthetic:** Heavy typography, custom ASCII/mono badges, metallic textures, and industrial control-room styling.
- **High-octane WebGL choreography:** 3D models and typography exploding, rotating, and morphing locked to smooth scroll scrub.
- **Irreverent technical Easter eggs:** Sound effects, terminal mode toggles, retro CRT filters, and hidden developer consoles.

### Idea to borrow
- **Industrial telemetry HUD framing:** Frame the 3D canvas with monospace coordinate trackers, render status badges, and deployment state indicators (`STATUS: DEPLOYED ✓`, `FPS: 60`, `LATENCY: 12ms`).
- **Exploded mechanical separation:** Pull layered 3D components apart along an axis on scroll and snap them back together upon deployment completion.

### Tech
- Next.js, Three.js, React Three Fiber, GSAP ScrollTrigger, Lenis.

---

## 11. Teenage Engineering — https://teenage.engineering
Screenshot: refs/11-teenage-engineering.png

### What makes it work
- **Industrial blueprint minimalism:** Strict modular grid layouts, schematic line drawings, and exploded technical diagrams of hardware products.
- **Iconic restraint in color:** High-contrast monochromatic palette with a single unmistakable signal accent (warm safety orange / amber).
- **Tactile hardware typography:** Technical specifications, precise component callouts, and clean dimension lines evoking aerospace engineering manuals.

### Idea to borrow
- **Blueprint dot-grid and schematic hairlines:** Use a faint 24px blueprint dot-grid background paired with 1px hairlines and dimensional callouts (`4 × 0.25 × 4 units`).
- **Single signal amber accent:** Restrict accent color strictly to warm signal amber (`#E8A33D`) for packets, focus rings, and active states—never for large decorative fills.

### Tech
- Custom frontend stack, SVG vector animation, canvas graphics.

---

## 12. Linear — https://linear.app
Screenshot: refs/12-linear.app.png

### What makes it work
- **Benchmark for modern software engineering aesthetic:** Deep graphite surfaces (`#0B0D10`), subtle gradients, and razor-sharp 1px hairline borders (`#232A33`).
- **Keyboard-first interaction paradigms:** Global `⌘K` command palette, instant shortcuts, and snappy UI responses.
- **Atmospheric lighting and status indicators:** Faint glowing dots, subtle ambient glows behind cards, and micro-animations on interactive badges.

### Idea to borrow
- **Graphite surface tokens and hairline borders:** Rely on 1px borders in `--line` color to establish visual structure instead of heavy shadows or flat solid fills.
- **Clean status indicators and keyboard badges:** Design status badges and keyboard legends (`Kbd`) with clean monospace styling and subtle glowing indicator dots (`--ok`, `--accent`).

### Tech
- Next.js, React, Tailwind CSS, Framer Motion, WebGL shaders.

---

## 13. Resend — https://resend.com
Screenshot: refs/13-resend.png

### What makes it work
- **Developer infrastructure clarity:** Exploded-view architecture diagrams, clean multi-language code blocks, and real-time deliverability dashboards.
- **Dark technical precision:** Jet-black surfaces with subtle radial background gradients and glowing neon/amber event telemetry lines.
- **Interactive code playground:** Tabbed code interfaces that let developers switch between Node, Go, Python, and cURL instantly.

### Idea to borrow
- **Exploded architectural layer diagrams:** Illustrate full-stack data flow across Interface, API, Queue, and Database layers with animated event packets.
- **Multi-language code tabs:** Provide code snippets in both TypeScript/Node.js and Go for back-end and DevOps case studies.

### Tech
- Next.js, React, Tailwind CSS, Radix UI.

---

## 14. Raycast — https://www.raycast.com
Screenshot: refs/14-raycast.png

### What makes it work
- **Pioneer of the command palette workflow:** Dark graphite cards floating above subtle gradient meshes with keyboard-first navigation.
- **High visual polish on developer tooling:** Crisp monochrome icons, glowing keystroke hints, and sleek extensions showcase.
- **Performance-obsessed feel:** Everything feels instantaneous, razor-sharp, and purpose-built for engineers.

### Idea to borrow
- **Terminal/command-line prompt overlay:** Style the global modal with a terminal prompt (`>`) prefix and categorized command lists (Pages, Projects, Actions, System).
- **High-density keyboard shortcut legends:** Display shortcut hints in modal corners and the footer to encourage keyboard navigation.

### Tech
- Next.js, React, Tailwind CSS, Canvas.

---

## 15. Stripe Press — https://press.stripe.com
Screenshot: refs/15-stripe-press.png

### What makes it work
- **Commercial 3D scroll benchmark:** Interactive 3D physical books with real-time shadow casting, ambient occlusion, and realistic cover textures.
- **Camera and scroll choreography:** Scrolling smoothly rotates the camera around the bookshelf, tilting books forward on hover.
- **Physical tactile simulation:** Drag-to-rotate physics and gentle spring deceleration when releasing books.

### Idea to borrow
- **Camera orbit synced to scroll progression:** Interpolate the 3D camera along a smooth curved spline using GSAP ScrollTrigger and Lenis scrub.
- **PBR physical material properties:** Use `MeshPhysicalMaterial` with subtle roughness and clearcoat properties to give 3D slabs an authentic physical weight.

### Tech
- Three.js, GSAP ScrollTrigger, Custom WebGL shaders.

---

## 16. Aristide Benoist — https://aristidebenoist.com
Screenshot: refs/16-aristide-benoist.png

### What makes it work
- **Awwwards Site of the Year winner:** Masterclass in minimalist developer portfolio design, quiet confidence, and bespoke WebGL distortion transitions.
- **Typographic rhythm:** Extreme care given to line height, tracking, and editorial layout; motion never overwhelms the content.
- **Kinetic smoothness:** Liquid-smooth momentum scroll and custom WebGL shaders that warp content slightly during rapid navigation.

### Idea to borrow
- **Restraint in motion:** Allow typography and negative space to breathe, positioning the 3D scene as a complementary hero rather than visual clutter.
- **Fluid route transitions:** Maintain continuous spatial context between page transitions using the View Transitions API.

### Tech
- WebGL, Three.js, GSAP, Custom Barba.js transition pipeline.

---

## 17. Guillaume Gouessan — https://guillaumegouessan.com
Screenshot: refs/17-guillaume-gouessan.png

### What makes it work
- **Awwwards SOTD developer portfolio:** Dark, atmospheric WebGL journey with smooth spatial camera transitions through 3D wireframe landscapes.
- **Audio-visual cohesion:** Optional ambient audio and mechanical click feedback synchronized with spatial scene reveals.
- **Technical layout:** Monospace coordinate trackers, FPS monitors, and scene phase telemetry rendered at the edges of the screen.

### Idea to borrow
- **Screen-edge telemetry overlay:** Render real-time coordinates, render phase labels, and active layer telemetry around the perimeter of the 3D canvas.
- **Smooth camera fly-through easing:** Transition smoothly from a wide isometric overview into close-up layer inspections.

### Tech
- Three.js, WebGL, GSAP, Custom Shaders.

---

## 18. Julien Renau — https://julienrenau.com
Screenshot: refs/18-julien-renau.png

### What makes it work
- **Isometric sci-fi tech station:** 3D interactive satellite/server station floating in space with glowing solar panels and telemetry beams.
- **Interactive orbital controls:** Drag to orbit the 3D model with subtle inertia, hovering interactive components highlights schematics.
- **Cohesive technical theme:** Blueprint lines, wireframe meshes, and animated communication packets pulsing through antenna arrays.

### Idea to borrow
- **Isometric perspective:** Utilize an isometric or low-FOV camera setup to achieve an authentic CAD/engineering blueprint look.
- **Communication packet pulses:** Animate glowing packets along curved bezier paths connecting system modules.

### Tech
- Three.js, GSAP, WebGL, Vite / Vanilla JS.

---

## 19. Darkroom Engineering (Lenis) — https://lenis.darkroom.engineering
Screenshot: refs/19-lenis-darkroom.png

### What makes it work
- **The definitive smooth scroll showcase:** Demonstrates normalized, non-locking momentum scroll that pairs flawlessly with GSAP ScrollTrigger.
- **Engineering transparency:** Displays live scroll velocity, delta, and progress metrics directly in the UI.
- **Bulletproof mobile performance:** Uses native scroll tracking without breaking touch inertia, pull-to-refresh, or keyboard accessibility.

### Idea to borrow
- **GSAP Ticker synchronization:** Pipe `lenis.raf` directly into `gsap.ticker` while setting `gsap.ticker.lagSmoothing(0)` to completely eliminate scroll jitter and stutter.
- **Scroll progress hairline:** Display a 1px accent hairline indicator at the top of the viewport reflecting reading and scroll progress.

### Tech
- Lenis (`lenis/react`), GSAP ScrollTrigger, Next.js.

---

## 20. Liveblocks — https://liveblocks.io
Screenshot: refs/20-liveblocks.png

### What makes it work
- **Realtime infrastructure visual storytelling:** Interactive diagrams where simulated user cursors and websocket packets fly between clients, servers, and database storage.
- **Clean technical diagrams:** Node-based architecture drawings styled with modern dark theme, animated bezier paths, and glowing state indicators.
- **High-converting technical authority:** Makes complex backend distributed system concepts (conflict resolution, state synchronization) instantly understandable through visual motion.

### Idea to borrow
- **Animated packet flows along bezier curves:** Illustrate request/response loops between interface, API, cache, and database layers with glowing amber packets.
- **Clean node-graph visual styling:** Represent API routing and database replicas as structured, connected geometric nodes with live glowing status indicators.

### Tech
- Next.js, React, Tailwind CSS, SVG/Canvas, Framer Motion.

---

## State of the tech (Oct 2026)

### 1. React Three Fiber (R3F) v9 & Drei v10 Status
- **React 19 Alignment:** R3F v9 is the stable production standard built specifically for React 19 compatibility ([pmndrs/react-three-fiber](https://github.com/pmndrs/react-three-fiber)). It introduces improved JSX factory signatures, updated typing, automatic resource disposal, and seamless support for React Server Components (RSC) boundaries.
- **Drei v10 Integration:** `@react-three/drei` v10 provides production-ready primitives (`RoundedBox`, `Edges`, `Instances`, `Text`, `ContactShadows`, `PerformanceMonitor`, `AdaptiveDpr`) optimized for R3F v9 and React 19 ([pmndrs/drei](https://github.com/pmndrs/drei)). An experimental v11-alpha line exists for cutting-edge WebGPU features, but v10 remains the stable choice for production builds.
- **Architecture Rule:** Always load 3D canvas components dynamically (`next/dynamic` with `ssr: false`) to avoid server-side hydration mismatches and prevent 3D assets from blocking initial DOM paint.

### 2. Three.js WebGPURenderer + TSL Readiness & WebGL Fallback
- **Unified WebGPURenderer:** Modern Three.js (r170+) ships with `WebGPURenderer` (imported from `three/webgpu`) as the modern successor to `WebGLRenderer` ([three.js WebGPU docs](https://threejs.org/docs/#api/en/renderers/WebGPURenderer)).
- **Automatic WebGL 2 Fallback:** `WebGPURenderer` automatically probes browser and hardware support on initialization:
  - If WebGPU is supported, it initializes the high-performance WebGPU backend.
  - If WebGPU is unsupported, it automatically falls back to the **WebGL 2** backend without requiring duplicate application code.
- **TSL (Three Shading Language):** Custom shaders written with TSL (from `three/tsl`) are cross-compiled automatically—compiling to **WGSL** on WebGPU backends and transpiling to **GLSL** on WebGL 2 fallbacks ([threejs.org/examples/webgpu](https://threejs.org/examples/?q=webgpu)).
- **Production Caveats:**
  - WebGL 2 is the architectural floor; legacy WebGL 1 devices will not initialize.
  - Compute shaders do not fall back to WebGL 2 (compute shaders only execute when the native WebGPU backend is active). For portfolio rendering, standard node materials and geometry transforms work identically across both.

### 3. GSAP 3.15 ScrollTrigger (Free & Open Access)
- **100% Free Commercial Licensing:** Following Webflow's acquisition of GreenSock, GSAP has made its entire library—including all previously paid "Club GSAP" bonus plugins (**ScrollTrigger**, **ScrollSmoother**, **SplitText**, **MorphSVG**, **DrawSVG**, **Flip**, **Observer**)—100% free for all commercial and personal development without paywalls, club tiers, or private token requirements ([gsap.com/pricing](https://gsap.com/pricing/)).
- **Public NPM Distribution:** All plugins are installed directly via public npm (`npm i gsap`) without private token management ([github.com/greensock/GSAP](https://github.com/greensock/GSAP)).
- **React Hook Integration:** The official `@gsap/react` package exposes the `useGSAP` hook, which provides automatic animation cleanup, context scoping, and memory leak prevention during Next.js App Router navigations.

### 4. Lenis Smooth Scroll
- **Current Standard:** Maintained by Darkroom Engineering under the official package names `lenis` and `lenis/react` ([lenis.darkroom.engineering](https://lenis.darkroom.engineering)), superseding deprecated `@studio-freight` scopes.
- **Synchronization with GSAP ScrollTrigger:**
  - Render with `<ReactLenis root autoRaf={false}>`.
  - Drive Lenis's frame updater directly from GSAP's ticker: `gsap.ticker.add((time) => lenisRef.current?.lenis?.raf(time * 1000))`.
  - Disable GSAP lag smoothing: `gsap.ticker.lagSmoothing(0)` to prevent stuttering frame bursts during scroll acceleration.
  - Notify ScrollTrigger of scroll events: `lenisRef.current?.lenis?.on('scroll', ScrollTrigger.update)`.
  - Import global styles: `import 'lenis/dist/lenis.css'` to ensure proper touch handling and prevent layout shift.
- **Accessibility & Touch:** Lenis preserves native trackpad momentum, touch gestures, and keyboard navigation while strictly adhering to `prefers-reduced-motion` settings.

### 5. View Transitions API in Next.js App Router
- **Native React 19 Integration:** React 19 introduces native `<ViewTransition>` components, supported experimentally in Next.js App Router via `experimental: { viewTransition: true }` in `next.config.ts` ([nextjs.org docs on viewTransition](https://nextjs.org/docs/app/api-reference/next-config-js/viewTransition)).
- **Shared Element Morphing:** Assigning matching `name` attributes (e.g., `<ViewTransition name={`work-cover-${slug}`}>`) allows elements on the `/work` grid to smoothly morph into the hero banner of `/work/[slug]`.
- **Progressive Enhancement:** Browsers that do not yet support View Transitions gracefully fall back to standard instant client-side routing with zero runtime breakage. Custom animation curves and durations can be tuned using standard CSS pseudo-elements `::view-transition-old(root)` and `::view-transition-new(root)`.

### 6. CSS Scroll-Driven Animations Browser Support
- **W3C Specification:** Native CSS scroll timelines (`animation-timeline: scroll()` and `view-timeline`) allow animations to be driven by scroll position directly on the compositor thread ([W3C Scroll-driven Animations](https://www.w3.org/TR/scroll-animations-1/)).
- **Browser Compatibility Breakdown (Oct 2026):**
  - **Chromium / Edge:** Fully supported since Chrome 115 (mid-2023), executing off-the-main-thread with zero frame drops ([developer.chrome.com](https://developer.chrome.com/docs/css-ui/scroll-driven-animations)).
  - **Apple Safari:** Fully supported across modern macOS and iOS releases (Safari 26+ and Safari Technology Preview) ([caniuse.com/css-scroll-timeline](https://caniuse.com/css-scroll-timeline)).
  - **Mozilla Firefox:** Under active implementation; enabled in Firefox Nightly but remains behind experimental flags (`layout.css.scroll-driven-animations.enabled`) in stable releases.
- **Architecture Decision:** Use CSS scroll-driven animations via `@supports (animation-timeline: scroll())` for lightweight CSS indicators (such as reading progress bars), while relying on GSAP ScrollTrigger + Lenis for complex multi-layer 3D timeline orchestration to guarantee 100% cross-browser feature parity.

---

## Patterns that recur in winners

1. **Decoupled Scroll Pipeline:** Winners strictly separate the GSAP scroll timeline from React component rendering state. ScrollTrigger writes normalized progress (0.0 to 1.0) to a mutable ref or shader uniform; R3F components sample this ref in `useFrame` and smoothly ease toward it using `maath/damping`, guaranteeing 60–120 FPS without triggering React re-renders.
2. **Restrained Monochromatic Palette with One Signal Accent:** Top portfolios establish an engineering control-room mood using deep graphite backgrounds (`#0B0D10`), dark slate card surfaces (`#12161B`), and subtle hairlines (`#232A33`). A single warm signal color (amber `#E8A33D`) is reserved strictly for interactive packets, active links, and focus rings—never for large decorative fills.
3. **PBR Materials and Sharp Edge Geometry:** Rather than flat cartoon low-poly visuals, winning 3D engineering scenes use `MeshPhysicalMaterial` with subtle roughness and clearcoat paired with `EdgesGeometry` / drei `Edges`. This creates the crisp, tangible appearance of precision-machined hardware slabs and CAD blueprints.
4. **Instanced Rendering for Scalability:** All repeated 3D objects (data packets, microservice nodes, container blocks, database cylinders) are rendered via `InstancedMesh` or `@react-three/drei`'s `<Instances>` / `<Instance>`. This collapses draw calls from hundreds down to under 20, preserving buttery performance on mid-range mobile GPUs.
5. **Asymmetric 12-Column Grid & Monospace Telemetry:** Layouts balance large bold sans display titles (tight tracking, heavy weight) against high-density monospace eyebrows, telemetry data, and dimension tags. Generous whitespace and asymmetric column spans let the 3D scene breathe without overcrowding editorial text.
6. **Zero-Friction Fallbacks & Sub-2.5s LCP:** Award-winning sites treat 3D as progressive enhancement. If a user has `prefers-reduced-motion` enabled or lacks WebGL support, the site immediately serves a crisp, pre-rendered static poster screenshot of the final deployed state. The 3D canvas is loaded asynchronously with `next/dynamic`, ensuring text paints immediately and LCP remains under 2.5 seconds.
7. **Keyboard-First Navigation & Easter Eggs:** Portfolios that leave lasting impressions incorporate a global command palette (`⌘K`) modeled after a terminal prompt. Providing actionable commands (`whoami`, `cat stack.json`, `kubectl get skills`, `replay scene`) demonstrates genuine engineering pedigree.
8. **Adaptive Performance Tiers:** Sites that win Awwwards SOTD run smoothly across diverse hardware by employing `<AdaptiveDpr>`, `<PerformanceMonitor>`, and setting R3F's `frameloop="demand"` when the canvas is scrolled out of the viewport. Heavy post-processing bloom and dense particle counts are automatically throttled on mobile devices.
9. **Interactive System Sandboxes:** Rather than passive case studies, winners embed interactive micro-interactions (e.g., a "Ship it again" replay button, architecture diagram toggles, or live latency sliders) that allow technical recruiters to actively test and explore the engineer's systems.
10. **Tactile Micro-Interactions & Accessible Focus:** Every interactive element features custom spring-damped hover states, prominent focus-visible rings (2px amber with 3px offset for WCAG AA compliance), and snappy audio or visual feedback that makes the interface feel alive.

---

## Clichés to avoid

1. **Purple/Blue SaaS Gradients & Frosted Glassmorphism:** Generic blur-heavy gradient meshes and thick frosted glass cards have become the visual hallmark of drop-shipped templates and generic AI wrappers. They immediately undermine credibility for a serious systems/DevOps engineer.
2. **Matrix Green Code Rain & Neon Cyberpunk:** Hacker tropes featuring falling green ASCII characters, scanning laser lines, and glitch shaders feel juvenile and clichéd. An engineering portfolio should feel like a calm, modern engineering control room, not an arcade game.
3. **Floating Laptop & Phone Mockups:** Angled 3D mockups of MacBooks or iPhones floating in empty space with generic dashboard screenshots add zero architectural insight. Replace them with exploded-view system diagrams, data flow pipelines, and interactive 3D components that represent actual infrastructure.
4. **Aggressive Scroll-Jacking without Momentum:** Forcibly overriding browser scroll containers with rigid JavaScript step locks or abrupt page-snapping frustrates users, disrupts trackpad gestures, and causes immediate bounces. Scroll choreography must remain smooth, scrubbed, and non-blocking via Lenis.
5. **Bloated 3D Assets & Blocking Loading Spinners:** Forcing visitors to sit through a multi-second loading screen while downloading 20MB+ uncompressed GLTF models and 4K textures destroys Core Web Vitals and crashes mobile tabs. All 3D assets should be lightweight procedural geometry, instanced primitives, and SVGs keeping initial bundles well under 300 KB.
