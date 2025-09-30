# Research

## Build failure summary

- `npm run build` fails due to ESLint errors triggered during `next build`.
- Reported issues:
  - `app/reserve/[reservationId]/page.tsx`: default import of `ReservationDetailClient` conflicts with named export usage, violating `import/no-named-as-default`.
  - `reserve/app/__tests__/router.test.tsx`: import order (`import/order`) and `typeof import()` usage flagged by `@typescript-eslint/consistent-type-imports`.
  - `reserve/pages/RouteError.tsx`: `import/order` expects `@reserve/shared/ui/icons` before `@shared/config/env`.

## Existing patterns

- Reservation detail client module (`app/reserve/[reservationId]/ReservationDetailClient.tsx`) exports both a named function and a default export. Downstream code can safely switch to named import.
- Other test files rely on `vi.importActual` without additional typing; casting post-import keeps type safety without violating `consistent-type-imports`.
- UI modules in `reserve/pages` generally group `@reserve/...` imports before `@shared/...` based on lint rules.

## Constraints

- ESLint rules are enforced during build; fixes must keep types intact and respect existing module contracts.
- No API or runtime behavior changes required—only import declarations and order adjustments.
