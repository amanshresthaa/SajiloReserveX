# Implementation Checklist

## Setup

- [x] Confirm Node 20.11.x availability locally and update CI workflow to pin `>=20.9`.
- [x] Capture current git status and note existing untracked task folders.

## Core

- [x] Bump `next`, `react`, `react-dom` to latest using `pnpm add`.
- [x] Update dev deps (`eslint`, `eslint-config-next`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`) via `pnpm add -D`.
- [x] Run `npx @next/codemod@canary upgrade latest` and review resulting diffs.
- [x] Rename `middleware.ts` → `proxy.ts`, updating export signature and retaining logic.
- [x] Reconcile `next.config`/scripts with codemod output (ensure Turbopack compatibility, lint command path).
- [x] Regenerate lockfile (`pnpm install`) if necessary and ensure patched dependencies remain referenced.

## UI/UX

- [ ] Manual sanity check of key routes (e.g., `/`, `/my-bookings` redirect when unauthenticated) after proxy migration.
- [ ] Validate metadata pages (one reservation page, one blog article) render head tags without errors.

## Tests

- [x] Run `pnpm lint`.
- [x] Run `pnpm typecheck`.
- [x] Run `pnpm test`.
- [x] Run `pnpm build`.

## Notes

- Assumptions:
- Deviations:
  - Pending manual Chrome DevTools QA for key routes after upgrade; document in verification.

## Batched Questions (if any)

- None yet
