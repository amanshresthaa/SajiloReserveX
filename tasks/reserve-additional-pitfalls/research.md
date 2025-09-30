# Research – reserve additional pitfalls

## Cache key inconsistencies

- `useReservation` builds keys inline as `['reservation', reservationId]` (`reserve/features/reservations/wizard/api/useReservation.ts:12`).
- Mutation success handler invalidates `['reservations']` and writes directly to `['reservation', id]` (`reserve/features/reservations/wizard/api/useCreateReservation.ts:66-69`). There is no shared helper, so each new feature would have to guess the tuple shape.
- There is no `queryKeys` helper or typed registry under `reserve/shared/api` (confirmed via `rg "queryKey"` limited to the wizard API files).

## Router base-path rigidity

- Route tree is anchored to `/reserve` (`reserve/app/routes.tsx:13`), and the catch-all uses `'*'`, assuming the SPA owns the root path segment.
- Router provider creates a browser router without a `basename` or external configuration (`reserve/app/router.tsx:7-10`). Embedding under a different host path requires code edits.

## Build output collision risk

- Vite build emits to `../.reserve-dist` (`reserve/vite.config.ts:25-28`), a sibling directory shared with the Next.js app. Parallel builds could overwrite `.reserve-dist` or be swept by top-level clean steps.

## Testing gaps on critical seams

- No unit tests cover the shared API client (`reserve/shared/api/client.ts`) or router composition; `rg "apiClient" reserve/tests` returns no matches.
- Existing tests focus on dialogs and adapters, leaving fetch timeout/error normalization unguarded.
