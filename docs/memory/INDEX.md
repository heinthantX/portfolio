# Memory index

| Topic/Domain | 1-Line Core Rule / Decision | Detail File | Updated |
|---|---|---|---|
| Motion: no sideways travel | No autonomous left/right motion. Use vertical, scale or opacity. Cursor parallax and hover nudges are allowed. | docs/memory/conventions.md | 2026-10-24 |
| Scroll state | Scroll progress lives in rAF/useFrame, never in React state. | docs/memory/conventions.md | 2026-10-24 |
| Typecheck on fresh checkout | Run `pnpm exec next typegen` before `pnpm typecheck`. | docs/memory/conventions.md | 2026-10-24 |
| Chapter indices | Derive chapter constants from `CHAPTER_IDS`. Layer j is chapter `j + LAYER_OFFSET`, never `j + 1`. | docs/memory/conventions.md | 2026-10-24 |
| Formation moves | Blend each point between its own world-space endpoints in the shader. Never move a group transform: it slides the whole formation. | docs/memory/conventions.md | 2026-10-24 |
| Scroll-linked text | Use ScrollWords, not per-word JS. Accent matching strips case and punctuation on both sides. Blur only at ≥768px. | docs/memory/conventions.md | 2026-10-24 |
| Chapter jumps | Chapter jumps call `goTo` from `useChapterSnap`, never `lenis.scrollTo` directly. | docs/memory/conventions.md | 2026-10-24 |
| Skill tags | Show skill breadth in copy. Never highlight individual tags. Write MySQL, not MariaDB. | docs/memory/conventions.md | 2026-10-24 |
| E2E on prod server | Kill the port before rebuilding while `next start` runs. Otherwise stale chunks load and the canvas never mounts. | docs/memory/conventions.md | 2026-10-24 |
| Wheel interception | Lenis `virtualScroll` returning false skips Lenis but not native scroll. The interceptor must call `event.preventDefault()`. | docs/memory/fixes.md | 2026-10-24 |
| Snap completion | Lenis drops a `scrollTo` `onComplete` when the scroll is interrupted. Track a `busyUntil` timestamp instead. | docs/memory/fixes.md | 2026-10-24 |
