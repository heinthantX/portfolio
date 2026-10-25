# Memory index

| Topic/Domain | 1-Line Core Rule / Decision | Detail File | Updated |
|---|---|---|---|
| Motion: no sideways travel | No ping-pong or sway left/right. Hero text blocks may slide in from the side (D12). Page switches slide vertically (D19). Cursor parallax and hover nudges are allowed. | docs/memory/conventions.md | 2026-10-24 |
| Text reveal mechanism | Reveals are opt-in via `data-paras`, driven by JS IntersectionObserver and WAAPI, not CSS `view()` timelines. Arm in head before paint. Above-the-fold waits 450ms. | docs/memory/architecture.md | 2026-10-25 |
| Home reveals replay | On home, a reveal resets once the target scrolls fully past the bottom edge, so it replays on the next scroll down. Sub-routes reveal once. | docs/memory/architecture.md | 2026-10-25 |
| Reveal targets: no translate | Reveal targets never use `translate-*` utilities; WAAPI's fill overrides them. Use margins instead. | docs/memory/conventions.md | 2026-10-25 |
| Nav arrow state | The nav arrow and preview card share one `data-hover` state. Never style the arrow from CSS `:hover`/`:focus-visible`. | docs/memory/conventions.md | 2026-10-25 |
| Edit globals.css in place | `sed -i ''` replaces the inode and the Next dev watcher serves stale CSS. Edit in place. | docs/memory/conventions.md | 2026-10-25 |
| Experience dots offset | `translate-x-1/2` lost to WAAPI's translate fill, so dots sat 5px off the line. Fixed with `-ml-[4.5px]`. | docs/memory/fixes.md | 2026-10-25 |
| Nav card stuck with no arrow | Card followed React state, arrow followed CSS `:hover`; a missed mouseleave desynced them. Fixed with `data-hover` and a pointer-away close. | docs/memory/fixes.md | 2026-10-25 |
| Home row stagger | `data-block="stagger"`: the container stays still and each `[data-part]` reveals on its own viewport entry (tall rows animated off-screen otherwise). Replaces the left slide, which is removed. | docs/memory/architecture.md | 2026-10-25 |
| Per-route Lenis feel | Home uses lerp 0.09 and wheelMultiplier 0.9. Other routes use lerp 0.18 and wheelMultiplier 1. | docs/memory/architecture.md | 2026-10-24 |
| Text reveal: head arm | Add `html.paras-armed` in the head script before first paint. Arming after hydration hides painted text. | docs/memory/fixes.md | 2026-10-24 |
| Text reveal: view transition | Load-time reveals played behind the ~0.7s view-transition snapshot. Delay them 450-500ms. | docs/memory/fixes.md | 2026-10-24 |
| Text reveal: StrictMode | Re-observe anything not yet "in" on the second effect run. Otherwise it stays hidden. | docs/memory/fixes.md | 2026-10-24 |
| Scroll state | Scroll progress lives in rAF/useFrame, never in React state. | docs/memory/conventions.md | 2026-10-24 |
| Typecheck on fresh checkout | Run `pnpm exec next typegen` before `pnpm typecheck`. | docs/memory/conventions.md | 2026-10-24 |
| Chapter indices | Derive chapter constants from `CHAPTER_IDS`. Layer j is chapter `j + LAYER_OFFSET`, never `j + 1`. | docs/memory/conventions.md | 2026-10-24 |
| Formation moves | Blend each point between its own world-space endpoints in the shader. Never move a group transform: it slides the whole formation. | docs/memory/conventions.md | 2026-10-24 |
| Scroll-linked text | Use ScrollWords, not per-word JS. Accent matching strips case and punctuation on both sides. Blur only at ≥768px. | docs/memory/conventions.md | 2026-10-24 |
| Chapter jumps | Chapter jumps call `goTo` from `useChapterSnap`, never `lenis.scrollTo` directly. | docs/memory/conventions.md | 2026-10-24 |
| Skill tags | Show skill breadth in copy. Never highlight individual tags. Write MySQL, not MariaDB. | docs/memory/conventions.md | 2026-10-24 |
| E2E on prod server | Kill the port before rebuilding while `next start` runs. Rebuild before e2e after UI changes (`reuseExistingServer`). Otherwise stale chunks or markup load. | docs/memory/conventions.md | 2026-10-25 |
| Mobile menu | Below `md` the nav is a hamburger at far right with a top-right dropdown panel. Off-home: House icon in the header plus a Home text link in the panel. Closed panel is `inert`. | docs/memory/conventions.md | 2026-10-25 |
| Nav current-page arrow | Retracts fully (head, line, tail) while another link is hovered; label colour stays. | docs/memory/conventions.md | 2026-10-25 |
| Nav hover arrow z-index | Put `z-index` on the arrow svgs inside `.nav-shot` (isolation: isolate), never on the `.shot-arrow` wrapper. A wrapper z-index traps the front layer behind the label. | docs/memory/conventions.md | 2026-10-25 |
| Command menu placeholder | Keep "Type a command or search..." unchanged. The e2e tests rely on it. | docs/memory/conventions.md | 2026-10-24 |
| Wheel interception | Lenis `virtualScroll` returning false skips Lenis but not native scroll. The interceptor must call `event.preventDefault()`. | docs/memory/fixes.md | 2026-10-24 |
| Snap completion | Lenis drops a `scrollTo` `onComplete` when the scroll is interrupted. Track a `busyUntil` timestamp instead. | docs/memory/fixes.md | 2026-10-24 |
| Wheel: trackpad push | A new push is a delta of 20+ and more than 3x the trough after the peak. Never compare to the previous delta: a swipe's ramp-up reads as a push. | docs/memory/fixes.md | 2026-10-24 |
| Wheel: free handback | Lenis keeps `targetScroll` near the animated position during `scrollTo`. Credit the swallowed delta explicitly when handing back. | docs/memory/fixes.md | 2026-10-24 |
| Snap easing | Snap steps use ease-out. easeInOut barely moves in its first 200ms and reads as lag on a swipe. | docs/memory/fixes.md | 2026-10-24 |
| R3F Clock patch | `@react-three/fiber` 9.8.x constructs a deprecated `THREE.Clock`. Keep the pnpm patch; re-check or drop it on upgrade. | docs/memory/fixes.md | 2026-10-24 |
| Tab in Radix Dialog | Tab handlers need `stopPropagation` as well as `preventDefault`, or FocusScope wraps focus off the input. | docs/memory/fixes.md | 2026-10-24 |
| shadcn data-* variants | `data-selected:` (and similar shadcn variants) match only `="true"`; set the attribute to "true", not "". | docs/memory/fixes.md | 2026-10-24 |
| Nav preview card on tab return | Mouse clicks blur the nav link, and window blur closes the card. Focus returning to a clicked link otherwise reopens it with no `mouseleave`. | docs/memory/fixes.md | 2026-10-25 |
| Hero snap on touch | `pointercancel` fires when the browser takes over a touch scroll. Treat it as pointerup, and ignore touch pointers for `pressed`. | docs/memory/fixes.md | 2026-10-24 |
