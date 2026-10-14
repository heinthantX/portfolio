# PROGRESS — portfolio build

Spec: `docs/handoffs/2026-10-15-portfolio-build.md`. Times are Asia/Bangkok.

## Status log
- 2026-10-15 01:56 — Run 1 started (Window A). git init, Next 16.4.1 scaffold, deps installed.

## Notes for the next run
- Next.js 16.4: read `node_modules/next/dist/docs/` before writing Next code (cacheComponents is on).
- Background agy jobs: `agy-job` / `/antigravity:status`.

## Core backlog
### R Research + brainstorm
- [ ] R1 Research → docs/design/RESEARCH.md + refs screenshots
- [ ] R2 Concept panel (4 panelists × 3 concepts)
- [ ] R3 Key-frame images for top 5 concepts
- [ ] R4 Judge → DECISIONS.md
- [ ] R5 /lab prototypes top 2 → pick
- [ ] R6 docs/design/SPEC.md
### P0 Scaffold + DevOps tooling
- [x] P0a git init, Next app, deps (01:58)
- [ ] P0b Biome, lefthook, Vitest, Playwright configs + scripts
- [ ] P0c Dockerfile + compose, GH Actions, Renovate, .editorconfig, README skeleton
### P1 Design system + content
- [ ] P1a tokens, fonts, dot grid, layout shell, header/footer, theme toggle
- [ ] P1b shadcn/ui base components restyled, useReveal
- [ ] P1c profile.ts + zod; Velite collections + mock filter
- [ ] P1d content: 4 mock case studies, real portfolio case study, 6 notes
- [ ] P1e TODO-CONFIRM.md, docs/EDITING.md
- [ ] P1f cover + OG images (agy image-generator)
### P2 3D scene
- [ ] P2a layers/objects/labels, packets, containers
- [ ] P2b 5-phase scroll timeline, Ship it again, tilt, hover
- [ ] P2c fallbacks, perf tiers, 404 variant, hero posters
### P3 Pages
- [ ] P3 all §6 pages, contact Server Action, /resume + PDF, ⌘K, 404
### P4 SEO + polish
- [ ] P4 metadata, OG, sitemap/robots/RSS, JSON-LD, responsive, design QA
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
