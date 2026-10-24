# Site header and mobile menu

## Architecture
- `src/components/site/site-header.tsx` renders the header. `<MobileMenu />` sits after `ThemeToggle`, so the hamburger is the far-right control below `md`.
- `src/components/site/main-nav.tsx` holds the nav links and exports `MobileMenu`. The desktop nav (`md` and up) is unchanged.
- The mobile-only House icon Home link in `MainNav` is removed. Home is now a text link inside the mobile panel.
- `src/app/globals.css` holds the `.mobile-menu` transition rules at the end of the file.
- The panel is `<nav aria-label="Main" id="mobile-menu">`. The hamburger toggles it with `aria-expanded` and `aria-controls="mobile-menu"`.
- Icons come from lucide: `Menu` when closed, `X` when open.

## Core Flows
1. Below `md`, the user taps the hamburger. The panel drops from the top-right corner (`origin-top-right`) with scale, translate and opacity.
2. Off the home route, a Home link leads the list. The current page's link is highlighted.
3. The panel closes on:
   - a route change,
   - any link click,
   - `Esc`,
   - a `pointerdown` outside the header and panel.
4. A closed panel is `inert`, so its links are not focusable or reachable by screen readers.
5. At `md` and up, the panel and the hamburger are hidden and the desktop nav shows.

## Edge Cases
- Reduced motion (`prefers-reduced-motion: reduce`): the panel fades in and out by opacity only. No scale or translate.
- Route change while open: close immediately. Do not keep the stale panel over the new page.
- Resizing from below `md` to `md` and up while open: the panel is hidden by CSS. Its open state is reset on the next close or route change so it does not reopen unexpectedly.
- Focus: opening moves focus into the panel. Closing with `Esc` returns focus to the hamburger.

## Autonomous UX Polish
- Reduced-motion fallback (opacity only).
- `aria-expanded` and `aria-controls` on the hamburger, and `aria-label` on the nav.
- Current-page highlight in the list (`aria-current="page"`).
- Closed panel is `inert`, so keyboard users skip it.
- E2E: the header test in `e2e/pages.spec.ts` opens the menu on a mobile viewport before it checks the links.
