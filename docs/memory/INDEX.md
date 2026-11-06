# Memory index

| Topic | Rule (≤15 words) | File#anchor |
|---|---|---|
| Motion: no sideways travel | No ping-pong or sway left/right. Hero text blocks may slide in from the side (D12). Page switches slide vertically (D19). Cursor parallax and hover nudges are allowed. | conventions.md#motion-no-sideways-travel |
| Text reveal mechanism | Reveals are opt-in via `data-paras`, driven by JS IntersectionObserver and WAAPI, not CSS `view()` timelines. Arm in head before paint. Above-the-fold waits 450ms. | architecture.md#text-reveal-uses-js-intersectionobserver-not-css-animation-timeline |
| Home reveals replay | On home, a reveal resets once the target scrolls fully past the bottom edge, so it replays on the next scroll down. Sub-routes reveal once. | architecture.md#home-reveals-replay-on-scroll-back |
| Reveal targets: no translate | Reveal targets never use `translate-*` utilities; WAAPI's fill overrides them. Use margins instead. | conventions.md#reveal-targets-never-use-translate-utilities |
| Nav arrow state | The nav arrow and preview card share one `data-hover` state. Never style the arrow from CSS `:hover`/`:focus-visible`. | conventions.md#nav-arrow-state-comes-from-data-hover |
| Edit globals.css in place | `sed -i ''` replaces the inode and the Next dev watcher serves stale CSS. Edit in place. | conventions.md#edit-globalscss-in-place |
| Experience dots offset | `translate-x-1/2` lost to WAAPI's translate fill, so dots sat 5px off the line. Fixed with `-ml-[4.5px]`. | fixes.md#experience-timeline-dots-sat-5px-off-the-line-2026-10-25 |
| Nav card stuck with no arrow | Card followed React state, arrow followed CSS `:hover`; a missed mouseleave desynced them. Fixed with `data-hover` and a pointer-away close. | fixes.md#nav-preview-card-stuck-open-with-no-arrow-2026-10-25 |
| Home row stagger | `data-block="stagger"`: the container stays still and each `[data-part]` reveals on its own viewport entry (tall rows animated off-screen otherwise). Replaces the left slide, which is removed. | architecture.md#stagger-replaces-the-left-slide-for-home-rows |
| One Lenis feel | Every route uses lerp 0.2 and wheelMultiplier 1. No per-route tuning. | architecture.md#one-lenis-feel-on-every-route |
| Hero wheel pace | Hero wheel: fast gestures step one chapter, slow ones scrub; no free-scroll mode. | architecture.md#hero-wheel-speed-threshold-instead-of-free-mode |
| Wheel hold | Slow wheel gesture holds 1.2s after it stops; 8 shrinking deltas (inertia) finish at once. | architecture.md#slow-wheel-holds-before-finishing |
| Hero guide quiet clock | Hero guide: 4.5s quiet before first play, then 15s quiet; any chapter; input aborts. | architecture.md#hero-guide-quiet-clock |
| Text reveal: head arm | Add `html.paras-armed` in the head script before first paint. Arming after hydration hides painted text. | fixes.md#text-reveal-armed-after-hydration-made-painted-text-vanish-2026-10-24 |
| Text reveal: view transition | Load-time reveals played behind the ~0.7s view-transition snapshot. Delay them 450-500ms. | fixes.md#load-time-reveals-played-behind-the-view-transition-snapshot-2026-10-24 |
| Text reveal: StrictMode | Re-observe anything not yet "in" on the second effect run. Otherwise it stays hidden. | fixes.md#strictmode-double-effect-left-reveals-hidden-forever-2026-10-24 |
| Scroll state | Scroll progress lives in rAF/useFrame, never in React state. | conventions.md#scroll-state-stays-out-of-react |
| Typecheck on fresh checkout | Run `pnpm exec next typegen` before `pnpm typecheck`. | conventions.md#typecheck-needs-typegen-on-a-fresh-checkout |
| Chapter indices | Derive chapter constants from `CHAPTER_IDS`. Layer j is chapter `j + LAYER_OFFSET`, never `j + 1`. | conventions.md#chapter-indices-come-from-chapter_ids |
| Formation moves | Blend each point between its own world-space endpoints in the shader. Never move a group transform: it slides the whole formation. | conventions.md#formation-moves-are-per-point |
| Scroll-linked text | Use ScrollWords, not per-word JS. Accent matching strips case and punctuation on both sides. Blur only at ≥768px. | conventions.md#scroll-linked-text-uses-scrollwords |
| Chapter jumps | Chapter jumps call `goTo` from `useChapterSnap`, never `lenis.scrollTo` directly. | conventions.md#chapter-jumps-go-through-goto |
| Skill tags | Show skill breadth in copy. Never highlight individual tags. Write MySQL, not MariaDB. | conventions.md#show-skill-breadth-in-copy-not-in-highlights |
| E2E on prod server | Kill the port before rebuilding while `next start` runs. Rebuild before e2e after UI changes (`reuseExistingServer`). Otherwise stale chunks or markup load. | conventions.md#e2e-against-the-prod-server-kill-the-port-first |
| Mobile menu | Below `md` the nav is a hamburger at far right with a top-right dropdown panel. Off-home: House icon in the header plus a Home text link in the panel. Closed panel is `inert`. | conventions.md#mobile-menu-is-a-header-dropdown-not-a-bottom-sheet |
| Nav current page underline | Current page rests as an underline window of the single nav string, not an arrow. | conventions.md#nav-current-page-rests-as-an-underline |
| Nav hover outlines | Hover outlines come from the single nav string, never per-link boxes. | conventions.md#nav-hover-outlines-come-from-the-nav-string |
| Nav string timing | Nav string and card timing come from `--string-ms`/`--string-ease` on `.main-nav`; never hard-code. | conventions.md#nav-string-timing-shares-css-custom-properties |
| String retreat delay | Retreat waits RETREAT_MS=400 (dive delay plus pull-back) so the line never leaves a box. | conventions.md#string-retreat-delay-retreat_ms |
| getComputedStyle units | getComputedStyle may return `450ms` as `.45s`; parse the unit. | fixes.md#getcomputedstyle-returns-450ms-as-45s-2026-11-07 |
| Nav hover arrow z-index | Put `z-index` on the arrow svgs inside `.nav-shot` (isolation: isolate), never on the `.shot-arrow` wrapper. A wrapper z-index traps the front layer behind the label. | conventions.md#nav-arrow-z-index-goes-on-the-svgs-not-the-wrapper |
| Command menu placeholder | Keep "Type a command or search..." unchanged. The e2e tests rely on it. | conventions.md#command-menu-placeholder-is-a-test-contract |
| Wheel interception | Lenis `virtualScroll` returning false skips Lenis but not native scroll. The interceptor must call `event.preventDefault()`. | fixes.md#lenis-virtualscroll-returning-false-does-not-stop-native-scroll |
| Snap completion | Lenis drops a `scrollTo` `onComplete` when the scroll is interrupted. Track a `busyUntil` timestamp instead. | fixes.md#lenis-drops-scrollto-oncomplete-when-interrupted |
| Wheel: trackpad push | A new push is a delta of 20+ and more than 3x the trough after the peak. Never compare to the previous delta: a swipe's ramp-up reads as a push. | fixes.md#trackpad-push-misread-from-the-previous-delta |
| Snap easing | Snap steps use ease-out. easeInOut barely moves in its first 200ms and reads as lag on a swipe. | fixes.md#snap-easeinout-reads-as-lag-on-a-swipe |
| R3F Clock patch | `@react-three/fiber` 9.8.x constructs a deprecated `THREE.Clock`. Keep the pnpm patch; re-check or drop it on upgrade. | fixes.md#r3f-98x-constructs-a-deprecated-threeclock |
| Tab in Radix Dialog | Tab handlers need `stopPropagation` as well as `preventDefault`, or FocusScope wraps focus off the input. | fixes.md#tab-inside-a-radix-dialog-moves-focus-off-the-input |
| shadcn data-* variants | `data-selected:` (and similar shadcn variants) match only `="true"`; set the attribute to "true", not "". | fixes.md#shadcn-data-selected-needs-true-2026-10-24 |
| Nav preview card on tab return | Mouse clicks blur the nav link, and window blur closes the card. Focus returning to a clicked link otherwise reopens it with no `mouseleave`. | fixes.md#nav-preview-card-stuck-open-after-returning-to-the-tab-2026-10-25 |
| Hero snap on touch | `pointercancel` fires when the browser takes over a touch scroll. Treat it as pointerup, and ignore touch pointers for `pressed`. | fixes.md#hero-chapters-never-snapped-on-phones-pointercancel-2026-10-24 |
