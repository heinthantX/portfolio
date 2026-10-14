# PROGRESS — portfolio build

Spec: `docs/handoffs/2026-10-15-portfolio-build.md`. Times are Asia/Bangkok.

## Status log
- 2026-10-15 01:56 — Run 1 started (Window A). git init, Next 16.4.1 scaffold, deps installed.

- 2026-10-15 02:52 — State: P0, R, P1 done; P3 pages except home+404 scene done; P4 SEO plumbing done. In flight: P2a scene core, P3 home sections. NEXT: when both land → run gates, wire src/app/page.tsx (StackHero with hero text + About block fading in during RUN, then <HomeSections/>), 404 scene variant in not-found.tsx (stack-404-slot), hero poster script (scripts/hero-poster.mjs, Playwright swiftshader, dark+light at progress 1), resume.pdf, View Transition theme switch, then P5 e2e/axe/LHCI/Docker.

- 2026-10-15 03:12 — Committed 5b59471 (home hero + sheets; Lenis scroll fix; hydration fix via CSS scroll reveals). Owner asked (03:10) for more motion: D6. In flight: sonnet A hero scene fixes (scratchpad sonnet-scene-fix.md), sonnet B ambient backgrounds (sonnet-ambient.md), agy cursor 20261015-031051-65856-1440 (agy-cursor.md). NEXT: verify each in Chrome + scratchpad shoot-hero.mjs, commit, then 404 scene, posters, resume.pdf, P5.

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
- [ ] P2a layers/objects/labels, packets, containers
- [ ] P2b 5-phase scroll timeline, Ship it again, tilt, hover
- [ ] P2c fallbacks, perf tiers, 404 variant, hero posters
### P3 Pages
- [~] P3 (02:48: work, notes, RSS, résumé page, uses, contact, ⌘K, 404 shell done; home sections in flight; resume.pdf + 404 scene pending) all §6 pages, contact Server Action, /resume + PDF, ⌘K, 404
### P4 SEO + polish
- [~] P4 (02:52: metadataBase, OG image, sitemap, robots, JSON-LD done; responsive pass, motion tuning, design QA, View-Transition theme switch pending) metadata, OG, sitemap/robots/RSS, JSON-LD, responsive, design QA
### P5 Quality
- [ ] P5 e2e + axe + visual, LHCI, Docker check, reviews + fixes
### P6 Demo + handover
- [ ] P6 demo video, README, final summary

## Stretch backlog (Window A only)
- [ ] S0 creative iteration loop
- [ ] S1 React Flow diagrams
- [ ] S2 scene polish + explore mode
- [ ] S3 /lab headline variants
- [ ] S4 Storybook
- [ ] S5 my locale (flag off) [CONFIRM]
- [ ] S6 Umami behind flag
- [ ] S7 2 more notes + /now

## Open questions for the owner
- (none yet)

## In flight (run 1, 02:29) — if resumed after a compact, check these with agy-job status/result
- lab prototypes: blueprint 20261015-022144-49104-14107, cluster 20261015-022145-49126-8172 (src/app/lab/*)
- P3 u1 articles 20261015-022844-72485-29996, u2 resume+uses 20261015-022844-72502-21336, u3 contact 20261015-022903-73419-20582, u4 cmdk+404 20261015-022844-72559-30847
- covers: background bash writing docs/design/covers-src/*.png (12 images)
- Prompts for all jobs: scratchpad p3-*.txt / lab-*.txt (session-local)
- P2a scene core 20261015-024230-4252-28264 (src/features/stack-scene, prompt scratchpad p2a.txt)
- P3 home sections 20261015-024909-20520-14396 (src/components/home, prompt scratchpad p3-home.txt)
