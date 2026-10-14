# PROGRESS — portfolio build

Spec: `docs/handoffs/2026-10-15-portfolio-build.md`. Times are Asia/Bangkok.

## Status log
- 2026-10-15 01:56 — Run 1 started (Window A). git init, Next 16.4.1 scaffold, deps installed.

- 2026-10-15 02:52 — State: P0, R, P1 done; P3 pages except home+404 scene done; P4 SEO plumbing done. In flight: P2a scene core, P3 home sections. NEXT: when both land → run gates, wire src/app/page.tsx (StackHero with hero text + About block fading in during RUN, then <HomeSections/>), 404 scene variant in not-found.tsx (stack-404-slot), hero poster script (scripts/hero-poster.mjs, Playwright swiftshader, dark+light at progress 1), resume.pdf, View Transition theme switch, then P5 e2e/axe/LHCI/Docker.

- 2026-10-15 03:12 — Committed 5b59471 (home hero + sheets; Lenis scroll fix; hydration fix via CSS scroll reveals). Owner asked (03:10) for more motion: D6. In flight: sonnet A hero scene fixes (scratchpad sonnet-scene-fix.md), sonnet B ambient backgrounds (sonnet-ambient.md), agy cursor 20261015-031051-65856-1440 (agy-cursor.md). NEXT: verify each in Chrome + scratchpad shoot-hero.mjs, commit, then 404 scene, posters, resume.pdf, P5.
- 2026-10-15 03:22 — Owner (03:14) rejected the slab-stack hero → D7 "Signal" particle-morph hero, text flowing with the formation. Old scene-fix agent stopped + reverted. In flight: sonnet "Signal" (scratchpad sonnet-signal.md; builds src/features/signal-scene, rewires page.tsx + not-found, deletes stack-scene), sonnet ambient backgrounds (sonnet-ambient.md), agy cursor 20261015-031051-65856-1440. resume.pdf done (print header bug fixed). NEXT: verify all three in Chrome, commit, posters, P5.
- 2026-10-15 03:45 — Committed: ambient backgrounds c0e5b17, hero intro text (profile.intro), wheel-delta cap + softer Lenis (high-sensitivity mice; verified 1500px flick → 120px glide), cursor ce309ca (native pointer kept per owner "cursor feels heavy"; ring follower; /work 60 fps median 16.7 ms), ambient mask behind content column (owner: readability). Owner asks sent to Signal agent: intro description, damped hero progress, text scrims + points thinning behind text. Signal agent still running. NEXT: verify Signal in Chrome (dark/light/mobile/404, reload mid-page, big wheel flicks, FPS), commit, posters, P5.
- 2026-10-15 04:00 — Signal hero committed 797018b + polish (verified in Chrome: all 6 chapters, text opposite the formation, 60 fps during transitions, light ink stipple, mobile, 404). Cursor: owner wants custom cursor (not native) but light → dot updates in the same event (pointerrawupdate), ring eases fast (b5bb02b). NEXT: hero posters (scripts/hero-poster.mjs, now final), work-this-portfolio cover, docs (SPEC/README mention stack-scene → update to Signal), then P5 e2e/axe/LHCI/Docker/review.
- 2026-10-15 03:58 — Posters (3D-only crop) + this-portfolio cover committed; About sheet spans the width. In flight: agy e2e 20261015-035501-84691-13732 (scratchpad agy-e2e.md; port 3100 prod build), Docker build (bg, log scratchpad docker-build.log; colima started), reviews: ecc code-reviewer (sonnet) + agy review 20261015-035735-90231-11880 (review-brief.md). NEXT: merge review findings, fix, LHCI, docker run :3001 smoke, P6 demo video + README.
- 2026-10-15 04:03 — Docker: image builds (361MB), runs non-root uid 1001, healthy; all routes 200 on :3901 except /opengraph-image 500 (standalone misses geist TTFs → fix #6). Port 3001/3000 have VS Code/ssh forwards (426) — use 3901 for docker smoke. Claude review: 15 findings (contact send fake, XFF spoof, log PII, no headers, mermaid loose/theme, hero rAF, shapes memo, rail aria-current, cursor idle rAF, rss url, dockerignore, CI perms). In flight: sonnet fixes (scratchpad sonnet-fixes.md), agy e2e retry 20261015-040041-95467-691, agy review retry 20261015-040041-95499-32067 (first attempts: network timeout / missing --yolo). playwright webServer env CONTACT_TEST_HOOKS=1. Known, not fixing now: reduced-motion/no-JS users get the scroll layout until hydration (review #9).
- 2026-10-15 04:12 — Committed 0553279 (all 15 review fixes + Suspense shells; typecheck/biome/49 tests green) and 3ba4678 (README with Mermaid + env docs; lhci → :3200 over /, /work, /contact). Chrome: contact validation + success ("Message sent") OK; cursor dot+ring settle on pointer. In flight: docker rebuild (bg, scratchpad docker-build2.log), agy e2e 20261015-040041-95467-691 (untracked e2e/*.spec.ts are its output, smoke.spec.ts deleted), agy review 20261015-040041-95499-32067. NEXT: docker smoke :3901 (OG 200, headers, contact fail-closed → mailto), run e2e myself, lhci, demo video, final summary.
- 2026-10-15 04:25 — Docker rebuilt + smoke OK on :3901 (all routes 200, 404 → 404, /opengraph-image 200 image/png, all 6 security headers); contact fail-closed in prod shows mailto (Chrome). Demo video committed f59b9b3 (public/media/demo.mp4 59 s 4.3 MB + demo-poster.avif; scripts/demo-video.mjs). README deploy section. agy review merged: 9 of 15 already fixed; fixed 7 (cmdk title inside DialogContent), 10 (what-i-do hover rAF on demand), 11 (TOC visible set), 12+13 (deleted /lab prototypes) → 5f3ea0f; skipped 15 (one rect read per pointermove, no DOM writes). `.next/types` is stale (lab routes) until the next build — typecheck errors only there. agy e2e still running (Playwright on :3100). NEXT: e2e result → run it myself, fix APP BUGs; pnpm build + typecheck; lhci; final summary.

- 2026-10-15 05:05 — Core P0–P6 done. e2e green (95), 4 app bugs it found fixed (h1 on /work + /notes, ⌘K group keywords, contrast of decorative text; hidden slug = 200+noindex accepted per Next docs). LHCI pass. Ambient three.js starts after load (perf 84→90). NEXT (stretch, Window A until 07:00): S0 creative pass; regenerate stock covers after 06:40 when the agy image quota resets.

## Notes for the next run
- agy image quota (gemini-3.1-flash-image) exhausted at 02:30; resets ~06:37 Bangkok. Missing covers: cap-frontend, cap-mobile, cap-backend, cap-devops, work-offline-field-notes, work-link-shortener-analytics, work-zero-downtime-deploy-pipeline, og-background. Prompts in DECISIONS/CREDITS; rerun after 06:40, then `node scripts/optimize-media.mjs`.
- Owner requirements added mid-run: theme = OS on first visit, two-state toggle (D2); animations/3D must adapt to dark vs light mood (D4). Read DECISIONS.md D2–D4 before P2.
- Owner is asleep from 02:15: act fully autonomously (pre-approvals in §2 still bound the scope). Autocompact at 350k context: keep this file current after every step.
- Next.js 16.4: read `node_modules/next/dist/docs/` before writing Next code (cacheComponents is on).
- Background agy jobs: `agy-job` / `/antigravity:status`.
- agy: no Pro model on this plan (`Gemini 3.1 Pro` gone; `Gemini 4 Argon` listed but "Unavailable" as of 02:06). Use `--model "Gemini 3.8 Flash (High)"` for pro-tier work; switch to Argon once `agy models` lists it. Always pass `--timeout 30m` (default 5m kills big jobs).

## Core backlog
### R Research + brainstorm
- [x] R1 (02:05; 13/20 screenshots captured) Research → docs/design/RESEARCH.md + refs screenshots
- [x] R2 (02:18) Concept panel (4 panelists × 3 concepts)
- [x] R3 (02:21) Key-frame images for top 5 concepts
- [x] R4 (02:25; Blueprint 24 vs Cluster 21) Judge → DECISIONS.md
- [x] R5 (02:45; Blueprint wins, Cluster merged into INFRA) /lab prototypes top 2 → pick
- [x] R6 (02:47) docs/design/SPEC.md
### P0 Scaffold + DevOps tooling
- [x] P0a git init, Next app, deps (01:58)
- [x] P0b (02:06) Biome, lefthook, Vitest, Playwright configs + scripts
- [x] P0c (02:06) Dockerfile + compose, GH Actions, Renovate, .editorconfig, README skeleton
### P1 Design system + content
- [x] P1a (02:25) tokens, fonts, dot grid, layout shell, header/footer, theme toggle
- [x] P1b (02:27) shadcn/ui base components restyled, useReveal
- [x] P1c (02:27) profile.ts + zod; Velite collections + mock filter
- [x] P1d (02:18) content: 4 mock case studies, real portfolio case study, 6 notes
- [x] P1e (02:31) TODO-CONFIRM.md, docs/EDITING.md
- [x] P1f (02:52; 4 AI + 4 concept frames + 4 CC0 stock duotoned; regenerate stock ones after 06:40 if quota allows) cover + OG images (agy image-generator)
### P2 3D scene
- [x] P2a (03:50; replaced by D7 "Signal" particle morph, src/features/signal-scene) layers/objects/labels, packets, containers
- [x] P2b (03:50; 6 chapters, eased progress, cursor repel; chapter rail replaces Ship it again per D7) scroll timeline, tilt, hover
- [x] P2c (04:00) fallbacks, perf tiers, 404 variant, hero posters
### P3 Pages
- [x] P3 (03:53: home, resume.pdf, 404 scene done; earlier 02:48: work, notes, RSS, résumé page, uses, contact, ⌘K, 404 shell done; home sections in flight; resume.pdf + 404 scene pending) all §6 pages, contact Server Action, /resume + PDF, ⌘K, 404
### P4 SEO + polish
- [x] P4 (05:02; responsive + design QA in Chrome dark/light/mobile, View-Transition theme switch, h1 per page, contrast fixes) metadata, OG, sitemap/robots/RSS, JSON-LD, responsive, design QA
### P5 Quality
- [x] P5 (05:00; e2e 95 passed/3 skipped desktop-only, axe 0 serious/critical both themes, LHCI all 3 URLs pass (perf ≥0.8; LCP warn ~3.3 s simulated), Docker smoke OK, Claude + agy reviews fixed) e2e + axe + visual, LHCI, Docker check, reviews + fixes
### P6 Demo + handover
- [x] P6 (05:05; public/media/demo.mp4, README with Mermaid/env/deploy, summary below) demo video, README, final summary

## Stretch backlog (Window A only)
- [ ] S0 creative iteration loop
- [ ] S1 React Flow diagrams
- [ ] S2 scene polish + explore mode
- [ ] S3 /lab headline variants
- [ ] S4 Storybook
- [ ] S5 my locale (flag off) [CONFIRM]
- [ ] S6 Umami behind flag
- [ ] S7 2 more notes + /now

## Final summary (core done 05:05, Window A)
**What works** (all local commits on `main`, nothing pushed or deployed):
- Home: "Signal" particle hero (6 chapters, text opposite the formation, chapter rail), sheets below it; dark/light from the OS on first visit, 2-state toggle with a View-Transition; 3D mood follows the theme.
- Ambient 3D background on every route (starts after load), custom cursor, CSS scroll reveals, Lenis with a wheel cap for high-sensitivity mice.
- Pages: /work (+ case studies), /notes (+ RSS), /resume (+ public/resume.pdf), /uses, /contact (Server Action, zod, rate limit, Resend), ⌘K menu, 404 with the same particle engine.
- SEO: metadata, OG image, sitemap, robots, JSON-LD. Security headers.
- Quality: 49 unit tests, 95 e2e (pages, content, contact, ⌘K, theme, hero, axe both themes), LHCI budgets, Docker standalone image (non-root, healthcheck), CI workflow (not pushed).
- Demo: public/media/demo.mp4 (59 s). Try it: `pnpm dev` → http://localhost:3000.

**Mock / placeholder**: all profile copy, email, GitHub/LinkedIn, experience, 4 of 5 case studies and all 6 notes (hidden in production builds). Full list: `content/TODO-CONFIRM.md`.

**Known limits**: reduced-motion/no-JS visitors see the tall hero layout until hydration; hidden slugs return 200 + noindex (Next 16 streaming); simulated mobile LCP ~3.3 s (real desktop 0.1 s); rate limit is per process.

## Open questions for the owner
1. Confirm the hero intro text (`profile.intro`) and the rest of the copy in `content/TODO-CONFIRM.md`.
2. Add `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` on the host so the contact form delivers.
3. Replace the `[MOCK]` email and GitHub/LinkedIn links in `src/content/profile.ts`.
4. Pick a host (Vercel or the Docker image) and set `NEXT_PUBLIC_SITE_URL`.

## In flight (run 1, 02:29) — if resumed after a compact, check these with agy-job status/result
- lab prototypes: blueprint 20261015-022144-49104-14107, cluster 20261015-022145-49126-8172 (src/app/lab/*)
- P3 u1 articles 20261015-022844-72485-29996, u2 resume+uses 20261015-022844-72502-21336, u3 contact 20261015-022903-73419-20582, u4 cmdk+404 20261015-022844-72559-30847
- covers: background bash writing docs/design/covers-src/*.png (12 images)
- Prompts for all jobs: scratchpad p3-*.txt / lab-*.txt (session-local)
- P2a scene core 20261015-024230-4252-28264 (src/features/stack-scene, prompt scratchpad p2a.txt)
- P3 home sections 20261015-024909-20520-14396 (src/components/home, prompt scratchpad p3-home.txt)
