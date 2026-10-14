# Editing the site

All personal text lives in one file, and projects and notes are MDX files. You never need to touch a component to change content.

## Change your profile

Edit `src/content/profile.ts`. It is checked by a zod schema (`profile.schema.ts`) when the site builds, so a missing field fails the build with a clear message.

It feeds the hero, about, "what I do", experience, stack, the 3D scene's layer labels (`stackLayers`), the footer, the résumé, `/uses`, `/now`, metadata, OG images, JSON-LD and RSS.

## Add a project

1. Copy `content/work/realtime-order-tracker.mdx` (it uses every frontmatter field) to `content/work/<slug>.mdx`.
2. Set `slug` to the file name, then fill in `title`, `summary` (max 200 chars), `outcome`, `date`, `tags` (`front-end`, `back-end`, `devops`, `mobile`), `stack`, `role`, `timeline`, `links`, `featured` and `order`.
3. Set `mock: false` for a real project. `mock: true` items show only in `pnpm dev`, with a "Sample" badge.
4. Keep the body headings: Problem, Constraints, Architecture, What I built, Results, Stack. A fenced `mermaid` block becomes the architecture diagram. `> **Constraint:** …` and `> **Result:** …` become callouts.

## Add a note

Copy any file in `content/notes/` and change the frontmatter. Reading time is computed for you, and the RSS feed (`/notes/rss.xml`) picks the note up on the next build.

## Switch a sample to real

Change `mock: true` to `mock: false` in its frontmatter. Production builds hide every `mock: true` item, and a section that ends up empty hides itself.

## Swap a cover image

Covers live in `public/media/` as `.avif` (under 300 KB). Each prompt is in `public/media/CREDITS.md`. To make a new one with agy:

```bash
agy --dangerously-skip-permissions --print-timeout 300s \
  -p "Use the image-generator subagent to create <description>. Dark graphite background, isometric technical illustration, thin precise lines, soft amber (#E8A33D) light accents, subtle depth of field, minimal, no text, no logos, no people, no UI screenshots. Save it as $PWD/docs/design/covers-src/<name>.png. Reply with the path only."
node scripts/optimize-media.mjs   # PNG -> AVIF in public/media
```

## Regenerate the résumé PDF

```bash
pnpm build && pnpm start &   # serve the production build
node scripts/resume-pdf.mjs  # writes public/resume.pdf
```

## Regenerate the hero poster

The reduced-motion / no-WebGL poster is a screenshot of the real 3D scene:

```bash
pnpm build && pnpm start &
node scripts/hero-poster.mjs  # writes public/media/hero-poster-{dark,light}.avif
```

## Checks before you commit

`pnpm lint && pnpm typecheck && pnpm test && pnpm build`, then `pnpm e2e`. The pre-commit hook runs lint and typecheck for you.
