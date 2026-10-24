# Text reveal

Opt-in, per-block reveal for prose and cards below the hero, plus word-by-word page titles on sub-routes. Hero and about are not affected.

## Architecture

- **Opt-in region:** a wrapper with `data-paras` turns the feature on for everything inside it. Home sections after the hero are wrapped in `data-paras`. Sub-routes (`work`, `notes`, `uses`, `contact`, `resume`) mark their regions the same way.
- **Targets inside a region:** `p`, `li`, `h2`-`h4`, `blockquote`, `pre`, `figure`, `table`, `img`, `hr`, any `[data-block]` (a whole row or card), and `[data-reveal="headline"]`.
- **Mechanism:** `src/components/site/text-reveal.tsx` observes targets with an `IntersectionObserver` and adds an "in" state. It does not use CSS `animation-timeline`/`view()`.
- **Slide variant:** `data-block="slide"` slides in from the left once on entry (What I do and Experience rows on home). It is a one-shot entry, not a sway.
- **Arming before paint:** an inline `ARM_SCRIPT` in the `<head>` of `src/app/layout.tsx` adds `html.paras-armed` before first paint. `globals.css` hides blocks only under `.paras-armed`, so no-JS and pre-hydration HTML show everything.
- **Keyframes:** `para-in` (fade and rise) and `para-slide` (left-entry) in `src/app/globals.css`.
- **Page titles:** `ScrollWords` with `mode="load"` (`src/components/site/scroll-words.tsx`) splits the title into words and reveals them on load.
- **Late mounts:** a `MutationObserver` picks up blocks rendered later (work filter results, Suspense boundaries).
- **Smooth scroll per route:** `RouteFeel` in `src/components/site/smooth-scroll.tsx` sets Lenis. Home uses `lerp` 0.09 and `wheelMultiplier` 0.9. Other routes use `lerp` 0.18 and `wheelMultiplier` 1.

## Core Flows

1. **Cold load on a sub-route:** the head script arms the page. Above-the-fold blocks wait 450ms so the view-transition snapshot (about 0.7s) is not already covering them. They then reveal in batches with an 80ms stagger.
2. **Scrolling down a home section:** each target is observed. When it enters the viewport it gets the "in" state once and is then unobserved.
3. **Route change:** the page-switch view transition runs. Blocks on the new route follow the cold-load flow.
4. **Filter or Suspense content:** the MutationObserver registers new targets. They reveal as they enter the viewport. Nothing waits for a route change.
5. **Page titles:** `ScrollWords mode="load"` reveals word by word after a 0.5s delay.
6. **Hydration fallback:** if JS never hydrates, a 4s timer removes `paras-armed`, so content is visible.

## Edge Cases

- **React StrictMode double effect:** the first run marks targets pending, the cleanup disconnects the observer, and the second run must re-observe anything not yet "in". Skipping it leaves content hidden forever.
- **Reduced motion:** `ARM_SCRIPT` does not add `paras-armed`, so nothing is hidden and nothing animates.
- **No JS:** the class is never added, so all content is visible.
- **Print:** `src/app/resume/print.css` forces everything under `.paras-armed [data-paras]` visible. Reveals run through the Web Animations API (`el.animate`, fill both) and a module WeakSet, never DOM attributes: writing attributes to not-yet-hydrated nodes caused a hydration mismatch.
- **Hot route change mid-reveal:** the observer is torn down with the component. No stale "in" state leaks across routes.

## Autonomous UX Polish

- Reduced-motion bypass: no hidden state and no animation when the user prefers reduced motion.
- No-JS fallback: content is visible without JavaScript and before hydration.
- Print stylesheet forces revealed blocks visible, so the resume prints in full.
- Per-route scroll feel: home stays heavier for the cinematic hero. Sub-routes are lighter because trackpad scrolling felt heavy there.
