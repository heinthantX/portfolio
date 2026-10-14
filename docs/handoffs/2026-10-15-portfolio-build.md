# Handoff: build Hein Thant's portfolio (Next.js + scroll-driven 3D, research-led)

You are the main Claude Code session for an **unattended, long build**. Read this whole file before you touch anything. Progress lives in `docs/handoffs/PROGRESS.md`. Create it on the first run, and on every later run read it first and continue from there.

---

## 1. Goal

Build a professional, production-quality portfolio for **Hein Thant**, a **Full-Stack & DevOps Engineer**: React/Next.js and React Native on the front end; Node.js (NestJS) and Go on the back end; Postgres and Redis for data; Docker, Kubernetes, cloud and CI/CD for running it all.

- **The signature visual:** a scroll-driven 3D hero, chosen by research and brainstorming (§1.5). The baseline candidate is the **"full stack" scene** (§5):
  - A compact block pulls apart into four layers: Interface, API, Data and Infrastructure.
  - Requests flow down through the layers and back up.
  - The infrastructure layer scales out.
  - Everything locks back together as "deployed".
- **The story it tells:** *"From the interface to the infrastructure: I build and ship every layer."*
- **One app:** a single **Next.js** app, with no separate back-end service. The full-stack and DevOps skills are shown through the **content**, plus a clean, well-tooled repo (CI, Docker, tests) that is itself a good example of the owner's work.
- **Maintainable:** use real, well-known frameworks and libraries for the plumbing: rendering loop, scroll, routing, dialogs, toasts, forms. Custom shaders (GLSL/TSL through drei `shaderMaterial` or three's node materials) are welcome where they are the creative core.

---

## 1.5 Creative direction: no limits, research first, brainstorm always

The owner puts **no restrictions on the animation or the website design**. Aim for an **Awwwards "Site of the Day"**-level portfolio that still reads as a serious full-stack & DevOps engineer.

- **Everything in §5 and §8 is a baseline, not a rule.** "The Stack" scene, the palette, the fonts, the layouts and the motion rules are a fallback starting point. If research and brainstorming find something better, replace them.
- **Record every big creative decision** in `docs/design/DECISIONS.md`: what was chosen, the options that lost, and why.

### The only fixed floor (keep these whatever the concept)

- Content is readable without the animation: reduced-motion and no-WebGL fallbacks exist.
- Keyboard and screen-reader accessible (axe 0 serious/critical).
- Works on a mid-range phone.
- Content safety (§7) and the run rules (§2).

### Phase R: research + brainstorm (runs first, in parallel with P0 scaffold)

1. **Research (about 30 min):**
   - **Tools:**
     - `antigravity:research` / agy web search for the wide fan-out
     - WebSearch/WebFetch for checking sources
     - the Claude-in-Chrome browser tools to open and screenshot the strongest references
   - **Sources:** award-winning developer portfolios and 3D/WebGL sites (Awwwards, FWA, CSS Design Awards, Codrops demos, the three.js and R3F showcases, Bruno Simon-style interactive portfolios), plus the current state of R3F, WebGPU/TSL in three, GSAP, View Transitions and scroll-driven CSS animations.
   - **Output:** `docs/design/RESEARCH.md` with 15–25 references. For each: URL, a screenshot in `docs/design/refs/`, what makes it work, and what to borrow as an **idea** (never copy code or assets).
2. **Brainstorm (about 30 min): a concept panel, at most 4 agents in parallel.**
   - Each panelist independently pitches **3 concepts** for the hero/3D scene **and** the overall site experience. They all get the same brief: this file + `RESEARCH.md`. The panel:
     - an Opus subagent
     - a Sonnet subagent
     - agy `--tier pro`
     - agy with `--model "Claude Sonnet 4.6 (Thinking)"`
   - Each concept includes:
     - a one-line idea
     - how it shows full-stack + DevOps
     - a scroll storyboard (5–7 beats)
     - interactions
     - the tech approach (libraries, shaders)
     - risks: performance, mobile, build time
3. **Visualize:** for the **top 5** concepts, generate 2 key-frame images each with agy's `image-generator`, saved to `docs/design/concepts/`. Look at them yourself.
4. **Judge (main session):** score each concept from 1 to 5 on:
   - wow / memorability
   - relevance to a full-stack & DevOps engineer
   - feasibility inside this run
   - performance on mobile
   - maintainability

   Concepts may be combined. Write the scores and the winner into `DECISIONS.md`.
5. **Prototype:** build the **top 2** as rough, throwaway scenes on a dev-only `/lab` route (about 45 min each, in parallel). Screenshot them, compare them, and pick the final one. "The Stack" (§5) takes part as one of the candidates unless it scored clearly lower.
6. **Write the final design spec:** update §5 and §8 decisions into `docs/design/SPEC.md` (palette, type, motion language, section layouts). P1 and P2 build from `SPEC.md`. Where `SPEC.md` and this file disagree, `SPEC.md` wins on creative matters, and this file wins on the floor and the run rules.

### Keep brainstorming while building

- **Before each creative unit** (each section, page, transition or micro-interaction), take 2 minutes to list 2–3 options, pick one, and log it in `DECISIONS.md`. Don't just build the first idea.
- **Every 3rd iteration, run a creative review:**
  - screenshot the current site at desktop and mobile
  - compare it against the top references in `RESEARCH.md`
  - write the 3 biggest upgrades into the backlog
- **Things you're free to explore:**
  - custom shaders and post-processing
  - page transitions (View Transitions API or GSAP)
  - a custom cursor
  - sound design (off by default, with a toggle)
  - WebGPU with a WebGL fallback
  - physics (`@react-three/rapier`)
  - interactive mini-games or easter eggs (for example a terminal in `⌘K` that answers `whoami`, `ls projects`, `kubectl get skills`)
  - anything else that makes the site memorable and fits the owner's profile

---

## 2. Run rules: usage budget and stopping

The owner wants this run to **use up all of their remaining Claude weekly limit**. After that, **one more 5-hour session is optional**: use it only if the core build is not finished.

- The weekly limit resets **Thu 15 Oct 2026, 07:00 Asia/Bangkok**.
- **Window A: now → the weekly limit runs out, or 07:00 Bangkok, whichever comes first.**
  - Use it fully. Work in big parallel batches.
  - If the core backlog (P0–P6) finishes early, go straight to the **Stretch backlog** (§10) and keep going until the limit runs out.
- **Window B (optional): one 5-hour session after 07:00 Bangkok.**
  - Start it **only if** some core units (P0–P6) are still unchecked.
  - Do only those remaining core units. **No stretch work in Window B.**
  - Stop as soon as the core is done, or at **12:00 Bangkok**, whichever comes first.
  - **Never start a second 5-hour session.**
- **Check the time with `TZ=Asia/Bangkok date`** at the start of every iteration to know which window you're in. You can't see the quota yourself. If requests start failing on a usage limit, the session stops on its own, and `PROGRESS.md` must already let it resume cleanly.
- **Each iteration:**
  1. read `PROGRESS.md`
  2. pick the next unchecked unit(s)
  3. build them
  4. verify them
  5. commit locally
  6. tick them off in `PROGRESS.md`, with the time
  7. schedule the next wakeup at 60s
- **When stopping for good** (core done in Window B, or 12:00 reached): write the final summary in `PROGRESS.md`, then end the `/loop` with `ScheduleWakeup` `stop: true`.

### Pre-approved by the owner (don't stop to ask)

- **ECC routing:** this file is the spec, so run it as `ecc:orch-build-mvp`.
  - **Gate 1** (plan approval): approved. This document is the plan.
  - **Gate 2** (commit approval): approved for **local commits only**, on branch `main` in this new repo.
- `git init`, installing npm packages, building and running the Docker image locally, and generating images with agy.

### Still forbidden without asking (stop and write the question into `PROGRESS.md`)

- `git push`, creating a GitHub repo, deploying (Vercel or anything else), DNS changes, buying domains, signing up for an email service.
- Writing any employer, client or real project detail into the site. See §7 "Content safety".

---

## 3. Model routing (Claude conducts, Gemini builds)

Follow `~/.claude/CLAUDE.md` "Cross-model task routing". In short:

| Work | Who |
|---|---|
| Plan, architecture, splitting units, final review, running the gates | Main session (Opus). Never delegated |
| Spec'd implementation: components, pages, content, tests, config | `antigravity:antigravity-delegate` (Agent call with `model: "haiku"`), `--tier flash` |
| Tricky 3D/scroll-timeline logic, or flash failed once | same, `--tier pro` |
| Subtle TS/R3F typing, or agy failed twice | `sonnet-implementer` |
| Searching or reading many files to a digest | `Explore` |

- **Parallel by default:** send independent units as one batch of delegates. Keep each workflow under 5 agents.
- **Every delegate prompt** includes: exact files, the behavior wanted, the acceptance command that must pass, and what not to touch. Pass `--dir /Users/heinthant/Development/__portfolio`.
- **Never trust agy's "green".** Run the gates yourself (§9) and read the diff. agy has been seen stubbing deps to fake a pass. Revert anything like that.
- **Review phase:** `ecc:orch-review` plus `antigravity:review`. Merge both lists, then fix.
- **Library docs:** use Context7 (`resolve-library-id` → `query-docs`) before writing code against any library below. APIs change between majors.

### Media generation with agy (tested 2026-10-15)

- **Images: work.** agy's built-in `image-generator` subagent makes high-quality images. Call it like this:
  ```bash
  cd /Users/heinthant/Development/__portfolio && agy --dangerously-skip-permissions --print-timeout 300s \
    -p "Use the image-generator subagent to create <description>. Save it as <abs path>.png. Reply with the path only."
  ```
  Note: `--dangerously-skip-permissions` must come **before** `-p`, or `-p` swallows it as the prompt.
- **Video: not available** (agy replied `NO_VIDEO_TOOL`). For video, record the finished site with Playwright `recordVideo`. `ffmpeg` is installed, so convert to `.mp4`/`.webm` and make a poster frame.
- **After generating:** open every generated image yourself (Read tool) and check it fits the palette (§8.2). Convert to AVIF/WebP with `sharp`, keep each one under 300 KB, and put it in `public/media/`. Record each prompt in `public/media/CREDITS.md`.
- **Shared style line** for every image prompt: *"Dark graphite background, isometric technical illustration, thin precise lines, soft amber (#E8A33D) light accents, subtle depth of field, minimal, no text, no logos, no people, no UI screenshots."*
- **Images to generate:**
  1. **One cover per capability area** (7). Each is an abstract isometric object for its area: layered panels for Front end; a phone with a sync arc for Mobile & offline; a node graph for APIs; stacked disks for Data; a lock-and-grid for Security; container blocks on a grid for DevOps; a waveform/graph for Observability.
  2. **One cover per mock project** (4), in the same style.
  3. **OG image background:** 1200×630, the same style, empty space on the left for text.
- **Not AI-generated:**
  - The **hero poster** (the reduced-motion / no-WebGL fallback) is a **screenshot of the real 3D scene** in its final "deployed" state, in both dark and light themes, taken with Playwright (Chromium with `--use-angle=swiftshader` or `--enable-unsafe-swiftshader` so WebGL renders headless). Only if headless WebGL can't render, generate a poster with agy in the shared style instead.
  - The **404 visual** is the same scene with one layer missing (§5).

---

## 4. Stack

Pin exact versions. Use the latest stable at build time, checked with Context7 and `npm view`. Local tools present: Node 22, pnpm, Docker, ffmpeg.

- **Framework:**
  - **Next.js (App Router), TypeScript `strict`**, pnpm
  - React Server Components by default. Client components only where needed (3D, scroll, forms, command palette).
  - `output: "standalone"` so the app runs in Docker.
- **Styling:** **Tailwind CSS v4** with design tokens as CSS variables (§8.2). `next-themes` for dark (default) / light.
- **UI primitives:** **shadcn/ui** (Radix), `lucide-react` icons, `sonner` toasts, `cmdk` command palette.
- **3D:**
  - `three`
  - `@react-three/fiber`
  - `@react-three/drei`: `RoundedBox`, `Edges`, `Instances`/`Instance`, `Text` (troika, using the Geist Mono font file), `QuadraticBezierLine`/`Line`, `Environment`, `ContactShadows`, `PerformanceMonitor`, `AdaptiveDpr`
  - `@react-three/postprocessing` (subtle bloom on the amber packets only)
  - `maath` for easing/damping helpers
- **Scroll:**
  - `gsap` + `ScrollTrigger` through `@gsap/react` (`useGSAP`)
  - `lenis` (`lenis/react`) for smooth scrolling, synced to ScrollTrigger
- **Content:** typed MDX collections with **Velite** (zod schemas) for projects and notes. If Velite doesn't fit, use Content Collections. Code blocks: `rehype-pretty-code` (Shiki).
- **Contact form:**
  - `react-hook-form` + `zod`, submitted through a **Server Action**.
  - The same zod schema validates on the client and the server.
  - Honeypot field, plus a simple per-IP rate limit kept in memory (mark it with `// ponytail: in-memory, per-instance; move to Upstash/Redis if deployed with >1 instance`).
  - Sending goes through one `sendContactMessage()` function that **only logs** for now. The real provider (e.g. Resend) is **[CONFIRM]** later.
- **SEO:** Next Metadata API, `next/og` OG images, `sitemap.ts`, `robots.ts`, JSON-LD `Person` + `WebSite`, RSS feed for notes.
- **Repo tooling:** this is the DevOps showcase, so do it properly.
  - **Biome** for lint + format, `lefthook` pre-commit (lint + typecheck on staged files)
  - **Vitest** + Testing Library for units
  - **Playwright** for e2e, visual snapshots, the hero poster, the demo video and the résumé PDF
  - `@axe-core/playwright` for accessibility
  - **Lighthouse CI** with budgets
  - **GitHub Actions** workflow: install → lint → typecheck → test → build → e2e → Lighthouse, with pnpm caching. Write it, don't push.
  - **Dockerfile:** multi-stage, standalone output, non-root user, small image. Plus `docker-compose.yml` for a one-command local prod run.
  - `renovate.json` for dependency updates, and `.editorconfig`.

---

## 5. Baseline 3D concept: "The Stack"

This is the **fallback concept** and one candidate in the Phase R brainstorm (§1.5). If another concept wins, write its spec in `docs/design/SPEC.md` and build that instead. Keep the same engineering rules: the timeline is separate from the components, instancing, performance tiers, fallbacks, labels from `profile.ts`, and a 404 variant.

### Objects

Four layers, each a thin `RoundedBox` slab (about 4 × 0.25 × 4 units) with crisp `Edges` in `--line` color and a dark, slightly glossy `MeshPhysicalMaterial` (low roughness, a little clearcoat). Each layer carries simple, **instanced** objects that say what it is:

| Layer (top → bottom) | Objects on it | Label (drei `Text`, Geist Mono) |
|---|---|---|
| **Interface** | 6–8 thin floating panels in a layout grid (like cards on a screen), plus one phone-shaped panel | `INTERFACE · React · Next.js · React Native` |
| **API** | 8–10 small octahedron nodes joined by thin lines (a route graph) | `API · NestJS · Go · REST · GraphQL` |
| **Data** | 3 cylinders (primary + 2 replicas) joined by a thin line, plus a small cube for the cache | `DATA · Postgres · Redis` |
| **Infrastructure** | a grid plate with container cubes (`Instances`, starting at 3) | `INFRA · Docker · Kubernetes · CI/CD` |

- **Packets:** small glowing amber spheres (one `InstancedMesh`) that travel along curves from the Interface down to the Data layer and back up (request → response). Their positions come from a time value plus the scroll progress, not React state.
- **Status line:** a mono `Text` under the stack that changes with the phase: `building…` → `routing requests` → `scaling 3 → 12` → `deployed ✓` (the check mark uses `--ok`).

### Scroll timeline (hero → about), scrubbed and reversible

1. **0–15%, Assembled:** the four layers sit tight together as one block, turning slowly in a 3/4 view. Packets are idle. The headline is readable.
2. **15–40%, Exploded view:** the layers separate vertically, like an exploded engineering drawing. The camera eases to show all four. Labels fade in one by one, top to bottom.
3. **40–65%, Request flow:** packets run down through the layers and back up. Each node lights amber as a packet passes it. The About text sits beside the stack.
4. **65–85%, Scale out:** the infrastructure layer's containers grow from 3 to 12 (staggered pop-in on the grid). A burst of packets flows through and is absorbed smoothly.
5. **85–100%, Deployed:** the layers come back together. A single soft green ring pulses once around the base. The status reads `deployed ✓`.

### Interaction

- **"Ship it again" button:** replays phases 4–5 (scale out → deploy) outside of scroll. The scroll position stays where it is.
- **Pointer:** a small parallax tilt toward the cursor on desktop. Off on touch.
- **Hover a layer** (desktop, in the exploded phase only): that layer brightens its edges and its label goes to full opacity. This is purely visual; no tooltips.

### Performance

- Load the canvas with `next/dynamic` (`ssr: false`) only after the hero text paints.
- `frameloop="demand"` when the hero is off-screen.
- Use instancing for every repeated object. `PerformanceMonitor` lowers DPR and packet count on weak devices.
- Mobile: DPR ≤ 1.5, about 12 packets, at most 8 containers, no bloom. Desktop: about 40 packets, 12 containers.

### Fallbacks

- `prefers-reduced-motion` → no animation. Show the hero poster (the screenshot of the "deployed" state, §3), plus simple fades on sections.
- No WebGL → the same poster.
- Must never block reading the content.

### 404 variant

`<StackScene variant="not-found" />` shows the exploded stack with the **API layer missing**: a dashed outline sits where it should be, and the status line reads `404 · layer not found`. Its button "Restore" goes home. It uses the same poster fallback rules.

### Code layout

- Put all scene code in `src/features/stack-scene/`:
  - `StackScene.tsx`
  - `Layer.tsx`
  - `layers.ts` (data only: names, labels, object counts)
  - `Packets.tsx`
  - `Containers.tsx`
  - `useStackTimeline.ts`
  - `materials.ts`
- Keep the GSAP timeline separate from the R3F components. The timeline only writes to a progress ref; components read it in `useFrame` and ease toward it with `maath`.
- The layer labels and tech names come from `profile.ts` (§7), so changing your stack updates the scene.

---

## 6. Pages and sections

1. **`/` home:** hero (3D), about, "what I do", experience, featured work, "how I work", stack, latest notes, contact.
2. **`/work`:** all projects, filterable by tag (front end / back end / DevOps / mobile).
3. **`/work/[slug]`:** case study from MDX: problem → constraints → architecture → what I built → results → stack.
4. **`/notes` + `/notes/[slug]`:** technical writing (MDX), with RSS.
5. **`/resume`:** the profile as a one-page résumé, with a print stylesheet and a "Download PDF" link. The PDF is generated at build time by a Playwright `page.pdf()` script into `public/resume.pdf`.
6. **`/uses`:** tools and setup, including the AI-assisted workflow (Claude Code conducting, Gemini/agy implementing, human-verified gates).
7. **`/contact`:** the form, with success, error and rate-limit states.
8. **`not-found`:** the 404 scene variant (§5).
9. **Global:**
   - header with a theme toggle
   - `⌘K` command palette to jump to pages, projects and notes
   - footer
   - a skip-link, and visible focus styles everywhere

---

## 7. Content

The owner has **no public side projects yet**, and all their real work so far was done **for employers**. So:

- **Do not describe any real company, client or project.** No company names, product names, features, architecture or numbers from work.
- Present the owner through **capability areas** in general terms, plus **mock projects** that make the layout look finished.
- **Don't read other repos** under `~/Development` for content. Everything here is generic or mock on purpose.

### One place to edit personal details (the owner will fill these in later)

- Put **all** personal data in one typed file: `src/content/profile.ts`. It covers name, title, tagline, bio, location, availability, contact links, capabilities, experience, stack groups (which also feed the 3D layer labels), "how I work" principles and `/uses` items. Validate it with a zod schema at build time.
- Every page, the 3D labels, the résumé, the JSON-LD, the OG images, the footer and the RSS feed read from this file. No personal text is hard-coded in components.
- Projects and notes are MDX files in `content/{work,notes}/`, with one example of each that shows every frontmatter field.
- Write `docs/EDITING.md`: a short guide on how to change the profile, add a project, add a note, switch a mock item to real (`mock: false`), regenerate the résumé PDF and hero poster, and swap a cover image (including the agy command).

### Identity (starting values in `profile.ts`)

- **Name:** Hein Thant
- **Title:** Full-Stack & DevOps Engineer
- **Tagline [MOCK]:** "From the interface to the infrastructure."
- **Location:** "Bangkok time (UTC+7)" **[CONFIRM: city/country to show]**
- **Availability [MOCK]:** "Open to full-stack and platform roles."
- **Contact:** placeholder `hello@example.com`, GitHub `[MOCK handle]`, LinkedIn `[MOCK]`.
- **Bio [MOCK, refine]:** "Full-stack engineer who likes the hard parts: data models that stay correct, permissions that stay tight, apps that keep working offline, and services that stay fast under load. I ship end to end, from Postgres and APIs to React and React Native, to the containers, clusters and CI pipelines they run on."

### "What I do": capability areas (generic, no project details)

Write these as skills, never as "at Company X I built Y".

| Area | Stack row | One-line pitch [MOCK wording] |
|---|---|---|
| Front end | React, Next.js, TypeScript, Tailwind | Fast, accessible interfaces that feel finished |
| Mobile & offline | React Native, offline-first sync | Apps that keep working without a network |
| Back-end & APIs | Node.js, NestJS, Go, REST, GraphQL | Typed, well-tested APIs with clear contracts |
| Data | Postgres, Drizzle, Prisma, Redis | Schemas and migrations that are safe to evolve |
| Security & access | Auth, RBAC, scoped queries | Permission models that are hard to get wrong |
| DevOps & cloud | Docker, Kubernetes, Azure, DigitalOcean, IaC, GitHub Actions | Shipping and running services reliably |
| Observability & performance | Prometheus, logging, k6, Locust, caching | Finding the real limit, then raising it |

### Experience

- A timeline with **[MOCK]** entries: "Full-Stack Engineer, [Company], [years]", with 2–3 generic bullets each that reuse the capability wording above.
- Keep the company and years as visible `[MOCK]` placeholders in `profile.ts`, so the owner can fill them in or delete them.

### Work

- **Mock projects (4)** that show the full range. Each gets a full case study in the §6 shape, including an **architecture diagram** (see the stretch item about React Flow; until then, a Mermaid diagram rendered at build time):
  1. "Realtime order tracker": Next.js + NestJS websockets + Postgres + Redis
  2. "Offline field-notes app": React Native + a sync API
  3. "Link shortener with analytics": Go + Redis + a Next.js dashboard
  4. "Zero-downtime deploy pipeline": Docker + Kubernetes + GitHub Actions + Terraform, with blue-green rollout and rollback
- **Real project:** "This portfolio": a short, honest case study about how this site is built (the 3D stack scene, content model, CI, Docker, Lighthouse budgets). `mock: false`.
- **Mock content rules:**
  - Every mock project and mock note has `mock: true` in its frontmatter.
  - In **production builds**, filter out `mock: true` items. In **dev**, show them with a small "Sample" badge.
  - This keeps the deployed site honest while the layout stays fully designed.
  - If filtering leaves a section empty in production, hide that section quietly.

### Notes (MDX posts, all `mock: true` drafts, about 600–900 words each)

General engineering topics only. No stories from work.

1. "Offline-first apps: the sync problems nobody warns you about"
2. "Designing RBAC that is hard to misuse"
3. "Load testing an API with k6: finding the real ceiling"
4. "Zero-downtime Postgres migrations"
5. "A small-team Kubernetes setup that doesn't need a platform team"
6. "Building a scroll-driven 3D hero with React Three Fiber and GSAP" (about this site; this one can be `mock: false` once checked)

### `content/TODO-CONFIRM.md`

List every `[MOCK]` / `[CONFIRM]` item in one place, so the owner can review it in one sitting: contact links, location, bio, experience entries, mock projects to replace, notes to rewrite or delete, and the email provider.

### Content safety (hard rules)

- **No** employer, client, product or partner names, and nothing that hints at them.
- **No** internal IPs, hostnames, cluster names, connection strings, env names or customer data.
- **No** made-up numbers presented as real metrics. Mock case studies may use numbers only inside `mock: true` files.

---

## 8. Design system

These are **baseline defaults**. Phase R (§1.5) may change any of them; the result goes in `docs/design/SPEC.md`, with the reasons in `DECISIONS.md`. Use the taste-skill `design-taste-frontend` skill as one more reviewer, not as the authority.

### 8.1 Mood

- **A calm engineering control room at night:** graphite surfaces, precise thin lines, one warm signal color. Think technical drawing plus a status board, not a gaming site.
- A hiring manager should feel "senior, careful, ships real systems" within 5 seconds.
- **One accent only:** signal amber (`--accent`). It's for packets, links, focus rings, active states and the primary button. Never use it for large fills or body text.
- **Green (`--ok`)** appears only for the "deployed" state and form success. It is never decoration.
- **Clichés to avoid unless the concept turns them into something new on purpose:** purple/blue SaaS gradients, glassmorphism, neon cyberpunk, matrix-style code rain, a laptop-mockup hero, and centered-everything layouts.

### 8.2 Tokens

Use CSS variables in `globals.css`, exposed to Tailwind v4 through `@theme`. Write colors in OKLCH and tune them until every text/background pair passes **WCAG AA** (checked with axe). The 3D materials read the same tokens (through a small `useThemeColors()` hook), so the scene follows the theme.

| Token | Dark (default) | Light |
|---|---|---|
| `--bg` | graphite `#0B0D10` | cool paper `#F5F6F8` |
| `--surface` | `#12161B` | `#ECEEF2` |
| `--line` (hairlines, 3D edges) | `#232A33` | `#D5DAE1` |
| `--text` | `#E6EAF0` | `#0F1217` |
| `--muted` | `#8B95A3` | `#545D6A` |
| `--accent` (signal amber) | `#E8A33D` | `#A8650F` (darker for contrast) |
| `--accent-strong` (accent text on bg) | `#F2B55A` | `#8F560C` |
| `--ok` | `#4CC38A` | `#1F8A55` |
| `--danger` | `#E5484D` | `#C62A2F` |

- **Spacing:** 4 px base scale. Sections are separated by `clamp(6rem, 12vw, 10rem)`.
- **Radius:** 4 px on cards, buttons and inputs; 2 px on images. Pills only for tags.
- **Borders:** 1 px `--line` hairlines do the structure work instead of shadows.
- **Background:** a faint **blueprint dot grid** (CSS `radial-gradient`, 24 px spacing, about 6% opacity) that fades out toward the edges with a mask. It must cost no JavaScript.

### 8.3 Type

Self-host through `next/font` (the `geist` package or `next/font/google`; check with Context7).

- **Display + body:** *Geist* sans. Headlines are heavy (600–700) with tight tracking (−0.03em).
- **Mono:** *Geist Mono* for eyebrows, tags, dates, the 3D labels, status lines and code.
- **Fluid scale** with `clamp()`:
  - display `clamp(3rem, 8vw, 7rem)`, h1 `clamp(2.5rem, 5vw, 4.5rem)`, h2 `clamp(1.75rem, 3vw, 2.75rem)`, h3 1.375rem
  - body 1.0625rem with line-height 1.65, small 0.875rem
- **Measure:** body text at most 68ch. Use `text-wrap: balance` on headings.
- **Eyebrows:** mono, uppercase, 0.75rem, letter-spacing 0.12em, `--muted`, written like a path: `01 / what-i-do`.

### 8.4 Layout

- 12-column grid, max width 1280 px, side gutters 16 / 24 / 40 px (mobile / tablet / desktop).
- Asymmetric: text usually spans 5–7 columns, with the image or 3D offset. Leave real empty space.
- **Breakpoints to check:** 360, 768, 1280, 1920. No horizontal scroll at 360.

### 8.5 Section layouts

| Section | Layout |
|---|---|
| **Hero** | Left 6 cols: eyebrow (`full-stack & devops engineer`), display name, the tagline, two buttons ("View work" primary, "Get in touch" secondary), and an availability line with a small `--ok` dot. Right: the sticky 3D stack scene, bleeding to the viewport edge, with its mono status line. A small mono "scroll" cue with a 1 px accent line at the bottom. |
| **About** | Appears beside the stack during the request-flow phase (§5, 40–65%). Two short paragraphs plus a one-line pull quote. |
| **What I do** | A **numbered list**, not a card grid. Each capability is one full-width row (`01  Front end  ·  React, Next.js, …  →`) split by hairlines. On hover/focus, the row's generated cover fades in beside the cursor (desktop) or inline (mobile), and the number turns amber. |
| **Experience** | A two-column timeline: the left column holds years in mono, the right holds the role, company and 2–3 bullets. A 1 px accent line connects the entries and draws in on scroll, like a pipeline with a dot per stage. |
| **Featured work** | Large alternating rows: a cover image (16:10, with a 1 px frame that turns amber on hover) next to the title, a one-line outcome, mono tags and "Read case study →". |
| **How I work** | 4 short principles in a 2×2 grid. Each gets a big mono numeral (`01`) and 2 sentences. |
| **Stack** | Grouped rows that mirror the 3D layers (Interface / API / Data / Infrastructure / Tools) of mono text chips. Icons are optional (`@icons-pack/react-simple-icons`), monochrome and in `--muted`. |
| **Notes** | A list (not cards): date in mono, title, reading time. Hover underlines in amber. |
| **Contact** | A big headline ("Let's ship something that holds up."), the form on the right, and email/GitHub/LinkedIn links on the left. |
| **Footer** | Hairline on top, a small 4-layer stack glyph (inline SVG), links, "Built with Next.js, React Three Fiber and GSAP", and the source link. |

- **Case study page:** a full-width cover, then a sticky table of contents on the left (desktop) with the article on the right. Use a meta row (Role / Timeline / Stack / Links) in mono, an architecture diagram, callout blocks for "Constraint" and "Result", a scroll-linked reading-progress hairline, and "Next project" at the end.
- **Résumé page:** single column, high-density but calm. It must print cleanly on A4 and Letter (no 3D, no dot grid, black on white, accent only as thin rules).

### 8.6 Components

Use **shadcn/ui**, copied into `src/components/ui` and restyled with the tokens above. Don't build dialogs, popovers or toasts from scratch.

- **Button:** primary (amber fill, `--bg` text), secondary (1 px line, amber on hover), ghost. Each has a loading state with a spinner and stays the same width while loading.
- **Link:** underline drawn left-to-right in amber on hover.
- **Tag** (mono chip), **Badge** ("Sample" for `mock: true`), **SectionHeading** (eyebrow + title), **Kbd**, **StatusDot** (`--ok` / `--muted`).
- **Command palette:** shadcn `Command` in a `Dialog`, opened with `⌘K`/`Ctrl K` and a header button. Style it like a terminal prompt (`>` prefix, mono input).
- **Toast:** shadcn `Sonner`, for the form result.
- **Form fields:** shadcn `Form` + `react-hook-form` + zod, with inline errors under each field.
- **Every interactive element** has hover, `focus-visible` (2 px amber ring, 3 px offset), active and disabled states.

### 8.7 Motion

- **Tokens:** durations 150 / 250 / 450 ms. Easing `cubic-bezier(0.2, 0.7, 0.2, 1)` for enter, `cubic-bezier(0.4, 0, 1, 1)` for exit.
- **Reveal:** fade + 16 px rise, 60 ms stagger, once per element, through one shared `useReveal` hook built on ScrollTrigger. No per-component animation code.
- **Baseline signature moments** (Phase R may add more or replace them):
  1. the 3D hero scene
  2. accent lines drawing in (experience pipeline, image frames, section dividers)
  3. the hover cover reveal in "What I do"
- **Rule of thumb, not a ban:** every motion should have a reason. Bold effects (page transitions, a custom cursor, scroll-jacked sections, text effects, physics) are fine when they serve the concept and feel polished.
- **`prefers-reduced-motion`:** everything becomes simple fades or nothing. This part is fixed.

### 8.8 Design QA (part of the P4 and P5 gates)

- Take Playwright screenshots of every page at 360 / 768 / 1280 / 1920, in dark and light mode, and save them to `docs/screenshots/`. Look at each one and fix spacing, alignment and contrast problems before ticking the unit.
- Screenshot the hero at each of the 5 scene phases (§5), desktop and mobile. Fix anything ugly, not just anything broken.
- Check that there's one primary button per screen view, and no amber except the allowed uses.

---

## 9. Verification gates (Claude runs them, never agy)

A unit is done only when all of these pass in a clean state:

- **Static:** `pnpm lint` (Biome), `pnpm typecheck` (`tsc --noEmit`), `pnpm test` (Vitest), `pnpm build`.
- **E2E (from P3 on):** Playwright against `next start`:
  - every page loads, including the 404 scene variant
  - the contact form shows success, validation-error and rate-limited states
  - `⌘K` opens and navigates
  - "Ship it again" replays the scale-out and deploy without moving the scroll position
  - reduced-motion shows the poster instead of the canvas
  - axe shows 0 serious/critical issues
  - a production build contains no `mock: true` items
- **Lighthouse CI on `/`** (mobile preset):
  - Performance ≥ 80 (may drop to 70 if the chosen concept truly needs it; record why in `DECISIONS.md`), Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95
  - LCP < 2.5 s; the 3D must not be the LCP element
- **Docker:** `docker build` succeeds and the container serves `/` on port 3000.
- **Profile wiring:** a test proves that changing one value in `profile.ts` (e.g. the title or a layer's tech list) changes the hero, the 3D label data, the footer, the metadata and the résumé.
- **Diff review** before each commit: no stubs, no `any` without a reason, no skipped tests, no secrets.

---

## 10. Phased backlog

Copy this into `PROGRESS.md` as checkboxes. Estimates are wall-clock with parallel delegates.

### Core (R + P0–P6): finish in Window A if possible; Window B exists only for leftovers

- **R Research + brainstorm (about 2.5 h including the `/lab` prototypes; runs in parallel with P0):** all 6 steps of §1.5. P1's visual units and P2 start only after `SPEC.md` exists. Non-visual units (P0, content writing, `profile.ts`, Server Action, tooling) don't wait.
- **P0 Scaffold + DevOps tooling (about 40 min)**
  - `git init`, the Next app, Biome, lefthook, Vitest, Playwright
  - Dockerfile + compose, the GitHub Actions workflow, Renovate, `.editorconfig`, README skeleton
- **P1 Design system + content (about 75 min)**
  - tokens, fonts, dot grid, layout shell, header/footer, theme toggle
  - shadcn/ui init + restyled base components (§8.6), the `useReveal` hook (§8.7)
  - `profile.ts` + zod schema, Velite collections with the `mock` flag + production filter
  - all §7 content: 4 mock case studies, the real portfolio case study, 6 notes
  - `TODO-CONFIRM.md`, `docs/EDITING.md`
  - cover and OG image generation with agy (§3), in parallel with the code units
- **P2 3D stack scene (about 2 h)**
  - layers + objects + labels, packets, containers, the 5-phase scroll timeline, "Ship it again", pointer tilt, layer hover
  - fallbacks, performance tiers, the 404 variant, the hero poster screenshots
  - use `--tier pro` for the timeline and packet units
- **P3 Pages (about 75 min):** every page in §6, including the contact Server Action, `/resume` + PDF script, `⌘K` and the 404.
- **P4 SEO + polish (about 45 min):** metadata, OG images, sitemap/robots/RSS, JSON-LD, the responsive pass, motion tuning, design QA (§8.8).
- **P5 Quality (about 60 min):** Playwright e2e + axe + visual snapshots, Lighthouse CI budgets, the Docker check, then design QA again. Run `ecc:orch-review` + `antigravity:review`, then fix the merged findings.
- **P6 Demo + handover (about 30 min):**
  - Playwright scroll recording → `ffmpeg` → `public/media/demo.mp4` + poster
  - final `README.md` (how to run, a Mermaid diagram of the app structure, deploy options such as Vercel or the Docker image on any host; **do not deploy**)
  - `PROGRESS.md` summary: what's done, what's mock, the open questions

### Stretch backlog (Window A only, in this order, until the weekly limit runs out)

0. **Creative iteration loop (repeat until the limit runs out):** after items 1–7 below, or earlier when a creative review (§1.5) finds a big upgrade, run:
   1. research one area in depth (hero, transitions, a section, micro-interactions, the 404, `⌘K`)
   2. brainstorm 3 options
   3. prototype the best one on `/lab`
   4. compare screenshots
   5. keep it if it's clearly better; otherwise revert it and log why

   Each round must leave every §9 gate green.
1. **Interactive architecture diagrams** in case studies with React Flow (`@xyflow/react`): read-only, themed with the tokens, nodes styled like the 3D layers. They replace the Mermaid diagrams.
2. **Scene polish pass:** fine-tune timing curves, label legibility, and mobile framing. Add an optional "explore" mode where dragging rotates the exploded stack (drei `PresentationControls`), desktop only.
3. **A second visual pass:** a dev-only `/lab` page with 3 alternative hero headline/tagline layouts, so the owner can pick one.
4. **Storybook** for the UI components, with the dark and light themes.
5. **Burmese (`my`) locale** with `next-intl` for the home and about pages. **[CONFIRM: wanted?]** Build it behind a flag, off by default.
6. **Self-hosted, privacy-friendly analytics** ready to switch on (e.g. Umami script tag behind an env flag, off by default).
7. **More mock content:** 2 more notes in the same rules (§7), and a `/now` page driven by `profile.ts`.

---

## 11. Done means

- `pnpm dev` runs the site, and `docker compose up` runs the production build. Everything works locally.
- All §9 gates pass. The last commit on `main` is clean.
- `PROGRESS.md`, `content/TODO-CONFIRM.md` and `docs/EDITING.md` tell the owner exactly what to review next and how to add their real details.
- Design QA screenshots are in `docs/screenshots/`.
- Nothing was pushed, deployed or published.
