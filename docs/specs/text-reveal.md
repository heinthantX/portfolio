# Text reveal

Opt-in, per-block reveal for prose and cards below the hero, plus word-by-word section and page titles. Hero and about are not affected.

## Architecture

- **Opt-in region:** a wrapper with `data-paras` turns the feature on for everything inside it. Home sections after the hero are wrapped in `data-paras`. Sub-routes (`work`, `notes`, `uses`, `contact`, `resume`) mark their regions the same way.
- **Targets inside a region:** `p`, `li`, `h2`-`h4`, `blockquote`, `pre`, `figure`, `table`, `img`, `hr`, any `[data-block]` (a whole row or card), and `[data-reveal="headline"]` (SectionHeading).
- **Mechanism:** `src/components/site/text-reveal.tsx` observes targets with an `IntersectionObserver` and plays each reveal with the Web Animations API (`el.animate`, fill both). No CSS `animation-timeline`/`view()` and no CSS keyframes drive reveals.
- **Block variants:**
  - Default `data-block`: the whole block fades and rises once on entry.
  - `data-block="stagger"`: the container stays still. Each `[data-part]` descendant is its own observed target and rises (fade, 22px, blur 6px) when it enters the viewport; parts entering together cascade by the 80ms batch step. Used by the home rows What I do, Experience, Featured work, How I work, Stack and Latest notes. Contact CTA is unchanged.
  - `[data-block="stagger"]` is excluded from the generic hide rule. Under `.paras-armed`, `globals.css` hides `[data-block="stagger"] [data-part]` instead of the container.
- **Section titles:** `Sheet` wraps string titles in `ScrollWords mode="in"`, so every home section title reveals word by word on scroll. The "SHEET 02 / 08" label is a `data-block`.
- **ScrollWords modes** (`src/components/site/scroll-words.tsx`):
  - `mode="load"`: subpage titles, revealed word by word after a 0.5s delay.
  - `mode="in"`: words flip in with the same keyframes as `word-in`, via WAAPI, 700ms each. The first word starts 150ms after the block. Step is `min(45ms, 1s / word count)`. The enclosing reveal target (e.g. `[data-reveal="headline"]`) plays it when it enters view. `text-reveal.tsx` drives it; there is no CSS animation.
- **Arming before paint:** an inline `ARM_SCRIPT` in the `<head>` of `src/app/layout.tsx` adds `html.paras-armed` before first paint. `globals.css` hides targets only under that class, so no-JS and pre-hydration HTML show everything.
- **Late mounts:** a `MutationObserver` picks up blocks rendered later (work filter results, Suspense boundaries).
- **Smooth scroll per route:** `RouteFeel` in `src/components/site/smooth-scroll.tsx` sets Lenis. Home uses `lerp` 0.09 and `wheelMultiplier` 0.9. Other routes use `lerp` 0.18 and `wheelMultiplier` 1.

## Core Flows

1. **Cold load on a sub-route:** the head script arms the page. Above-the-fold blocks wait 450ms so the view-transition snapshot (about 0.7s) is not already covering them. They then reveal in batches with an 80ms stagger.
2. **Scrolling down a home section:** each target is observed. When it enters the viewport its reveal plays once and it is unobserved. Stagger parts are observed individually, so the lower half of a tall card animates when you reach it, not when the card's top enters. A section title plays its `mode="in"` word flip on entry.
3. **Route change:** the page-switch view transition runs. Blocks on the new route follow the cold-load flow.
4. **Filter or Suspense content:** the MutationObserver registers new targets. They reveal as they enter the viewport. Nothing waits for a route change.
5. **Page titles on sub-routes:** `ScrollWords mode="load"` reveals word by word after a 0.5s delay.
6. **Hydration fallback:** if JS never hydrates, a 4s timer removes `paras-armed`, so content is visible.

## Edge Cases

- **React StrictMode double effect:** the first run marks targets pending, the cleanup disconnects the observer, and the second run must re-observe anything not yet "in". Skipping it leaves content hidden forever.
- **Reduced motion:** `ARM_SCRIPT` does not add `paras-armed`, so nothing is hidden and nothing animates.
- **No JS:** the class is never added, so all content is visible.
- **Animation bookkeeping:** the `reveals` WeakMap stores an `Animation[]` per target. `cancel(el)` cancels all of them. Reveal state lives in this module, never in DOM attributes: writing attributes to not-yet-hydrated nodes caused a hydration mismatch.
- **Print:** `src/app/resume/print.css` forces everything under `.paras-armed [data-paras]` visible, so the resume prints in full.
- **Hot route change mid-reveal:** the observer is torn down with the component, and running animations are cancelled. No stale "in" state leaks across routes.

## Autonomous UX Polish

- Reduced-motion bypass: no hidden state and no animation when the user prefers reduced motion.
- No-JS fallback: content is visible without JavaScript and before hydration.
- Print stylesheet forces revealed blocks visible, so the resume prints in full.
- Per-route scroll feel: home stays heavier for the cinematic hero. Sub-routes are lighter because trackpad scrolling felt heavy there.
- Vertical-only motion: every reveal rises or fades in place, so nothing moves sideways (see the no-sideways-motion convention).
