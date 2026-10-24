# To confirm before going live

Everything marked `[MOCK]` or `[CONFIRM]` in one list. Edit `src/content/profile.ts` for profile items and the MDX files for projects and notes. See `docs/EDITING.md` for how.

## Profile (`src/content/profile.ts`)

- [ ] **Location**: currently "Bangkok time (UTC+7)". Pick the city/country to show, or keep only the time zone.
- [ ] **Stack layer bullets** (`stackLayers[].points`): 3 capability lines per layer on the home hero, written for the MVP. Reword to match real work.
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

- [ ] **Email delivery** for the contact form: Resend is wired in `src/features/contact/send.ts`. Add `RESEND_API_KEY`, `CONTACT_TO_EMAIL` and (after verifying your domain in Resend) `CONTACT_FROM_EMAIL` to the host's env. Without them, production shows visitors a mailto link instead.
- [ ] **Site URL**: set `NEXT_PUBLIC_SITE_URL` when deploying (used by the sitemap, RSS, OG and JSON-LD).
- [ ] **Hosting**: nothing has been deployed or pushed. Vercel or the Docker image both work (see README).
- [ ] **Burmese locale** (stretch): wanted or not?

- [ ] `profile.intro` (hero description, added 03:25): "I design, build and run web and mobile products end to end: typed APIs, solid data models, fast interfaces, and the pipelines that ship them." Reword if it does not sound like you.
