# Plan – reserve additional pitfalls

## Goal

Address the remaining architectural risks in the reserve SPA: inconsistent query key usage, rigid router mounting, shared build output directory, and missing tests around infrastructure seams.

## Steps

1. **Normalize TanStack Query keys**
   - Create a shared `reserve/shared/api/queryKeys.ts` module exposing typed helpers for reservation detail and list keys.
   - Refactor `useReservation` and `useCreateReservation` to consume the helper and remove inline array literals.
   - Add a small unit test verifying that helpers produce stable tuples and reject missing parameters.

2. **Parameterize router base path**
   - Extend `reserve/shared/config/env.ts` to expose a `ROUTER_BASE_PATH` with fallback `/reserve` using `runtime` helper; update typings accordingly.
   - Update `reserve/app/routes.tsx` to define root-relative paths and rely on `basename` instead of hard-coded `/reserve`.
   - Inject the new `basename` into `createBrowserRouter` via `ReserveRouter`, and ensure downstream navigation utilities continue to work.
   - Document/test the configuration by writing a light unit test that stubs `createBrowserRouter` and asserts the resolved basename.

3. **Isolate Vite build output**
   - Point `vite.config.ts` to a dedicated directory such as `../dist/reserve` and ensure `emptyOutDir` only clears that folder.
   - Consider adding a `build.outDir` env override for future flexibility using `runtime` if required (optional if scope grows).

4. **Backfill infrastructure tests**
   - Add a Vitest suite for `apiClient` covering base URL prefixing, timeout abort, and error normalization.
   - Add a test for the router composition ensuring the basename from env flows into `createBrowserRouter` and the route objects remain intact.

5. **Verification & cleanup**
   - Run unit tests (`pnpm test`).
   - `rg` for `'reservation'` query key literals to confirm only the helper remains.
   - Summarize env changes for deployment (mention new `RESERVE_ROUTER_BASE_PATH`).

## Risks / Questions

- Updating env schema may require adjusting existing tests; ensure defaults keep current behaviour.
- Router basename must stay in sync with host Next.js rewrites; confirm fallback matches existing `/reserve` path.
- Timeout behaviour tests might need fake timers; be careful to restore globals after each test.
