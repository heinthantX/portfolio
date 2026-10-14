# To confirm before going live

Everything marked `[MOCK]` or `[CONFIRM]` in one list. Edit `src/content/profile.ts` for profile items and the MDX files for projects and notes. See `docs/EDITING.md` for how.

## Profile (`src/content/profile.ts`)

- [ ] **Location**: currently "Bangkok time (UTC+7)". Pick the city/country to show, or keep only the time zone.
- [ ] **Tagline**: "From the interface to the infrastructure." [MOCK]
- [ ] **Bio**: the two paragraphs are a draft [MOCK]. Rewrite in your own voice.
- [ ] **Availability**: "Open to full-stack and platform roles." [MOCK]. Set `open: false` to show a grey dot.
- [ ] **Email**: `hello@example.com` is a placeholder.
- [ ] **GitHub / LinkedIn**: labels and links are `[MOCK]` placeholders.
- [ ] **Experience**: three `[MOCK] Company` / `[MOCK] 20XX–20XX` entries. Fill them in or delete them. Keep bullets generic: no employer or client names, no internal details.
- [ ] **/now** items are `[MOCK]`.
- [ ] **/uses → Hardware** is `[CONFIRM]`.

## Projects (`content/work/`)

All of these have `mock: true`. They show up in `pnpm dev` with a "Sample" badge and are **hidden in production builds**.

- [ ] `realtime-order-tracker.mdx`: replace with a real project or delete.
- [ ] `offline-field-notes.mdx`: replace or delete.
- [ ] `link-shortener-analytics.mdx`: replace or delete.
- [ ] `zero-downtime-deploy-pipeline.mdx`: replace or delete.
- [ ] `this-portfolio.mdx` is real (`mock: false`). Read it once and adjust the wording.

## Notes (`content/notes/`)

All six are `mock: true` drafts, hidden in production.

- [ ] `offline-first-sync.mdx`
- [ ] `rbac-hard-to-misuse.mdx`
- [ ] `k6-load-testing.mdx`
- [ ] `zero-downtime-postgres-migrations.mdx`
- [ ] `small-team-kubernetes.mdx`
- [ ] `scroll-driven-3d-hero.mdx`: about this site. Check it against the real code, then set `mock: false`.

## Services

- [ ] **Email provider** for the contact form: `src/features/contact/send.ts` only logs today. Pick one (e.g. Resend) and add its API key as an env var.
- [ ] **Site URL**: set `NEXT_PUBLIC_SITE_URL` when deploying (used by the sitemap, RSS, OG and JSON-LD).
- [ ] **Hosting**: nothing has been deployed or pushed. Vercel or the Docker image both work (see README).
- [ ] **Burmese locale** (stretch): wanted or not?
