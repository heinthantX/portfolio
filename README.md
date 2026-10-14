# Hein Thant — portfolio

Personal site of a full-stack & DevOps engineer. Next.js 16 (App Router), React Three Fiber, GSAP, Velite.

## Run

```bash
pnpm install
pnpm dev            # http://localhost:3000
docker compose up   # production build on :3000
```

## Scripts

| Script | What it does |
|---|---|
| `pnpm lint` / `pnpm format` | Biome check / fix |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest units |
| `pnpm e2e` | Playwright e2e + axe (run `pnpm build` first) |
| `pnpm lhci` | Lighthouse CI budgets |

See `docs/EDITING.md` to change content.
