# Memory index

| Topic/Domain | 1-Line Core Rule / Decision | Detail File | Updated |
|---|---|---|---|
| Motion: no sideways travel | No ping-pong or sway left/right. Hero text blocks may slide in from the side (D12). Page switches slide vertically (D19). Cursor parallax and hover nudges are allowed. | docs/memory/conventions.md | 2026-10-24 |
| Text reveal mechanism | Reveals are opt-in via `data-paras` and use JS IntersectionObserver, not CSS `view()` timelines. Arm in head before paint. Above-the-fold waits 450ms. `data-block="slide"` is a one-shot left entry. | docs/memory/architecture.md | 2026-10-24 |
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
| E2E on prod server | Kill the port before rebuilding while `next start` runs. Otherwise stale chunks load and the canvas never mounts. | docs/memory/conventions.md | 2026-10-24 |
| Command menu placeholder | Keep "Type a command or search..." unchanged. The e2e tests rely on it. | docs/memory/conventions.md | 2026-10-24 |
| Wheel interception | Lenis `virtualScroll` returning false skips Lenis but not native scroll. The interceptor must call `event.preventDefault()`. | docs/memory/fixes.md | 2026-10-24 |
| Snap completion | Lenis drops a `scrollTo` `onComplete` when the scroll is interrupted. Track a `busyUntil` timestamp instead. | docs/memory/fixes.md | 2026-10-24 |
| Wheel: trackpad push | A new push is a delta of 20+ and more than 3x the trough after the peak. Never compare to the previous delta: a swipe's ramp-up reads as a push. | docs/memory/fixes.md | 2026-10-24 |
| Wheel: free handback | Lenis keeps `targetScroll` near the animated position during `scrollTo`. Credit the swallowed delta explicitly when handing back. | docs/memory/fixes.md | 2026-10-24 |
| Snap easing | Snap steps use ease-out. easeInOut barely moves in its first 200ms and reads as lag on a swipe. | docs/memory/fixes.md | 2026-10-24 |
| R3F Clock patch | `@react-three/fiber` 9.8.x constructs a deprecated `THREE.Clock`. Keep the pnpm patch; re-check or drop it on upgrade. | docs/memory/fixes.md | 2026-10-24 |
| Tab in Radix Dialog | Tab handlers need `stopPropagation` as well as `preventDefault`, or FocusScope wraps focus off the input. | docs/memory/fixes.md | 2026-10-24 |
| shadcn data-* variants | `data-selected:` (and similar shadcn variants) match only `="true"`; set the attribute to "true", not "". | docs/memory/fixes.md | 2026-10-24 |
