# Research

## Build failure summary

- `npm run build` fails due to ESLint errors triggered during `next build`.
- Historical issues (already resolved):
  - `app/reserve/[reservationId]/page.tsx`: default import conflict (`import/no-named-as-default`).
  - `reserve/app/__tests__/router.test.tsx`: import order and `typeof import()` types.
  - `reserve/pages/RouteError.tsx`: incorrect import ordering.
- Current lint errors:
  - `reserve/features/reservations/wizard/model/reducer.ts`: `import/order` wants `@reserve/shared/utils/booking` before `@shared/config/booking`.
  - `reserve/features/reservations/wizard/model/schemas.ts`: same ordering rule.
  - `reserve/shared/utils/booking.ts`: needs type-only import usage, ordering adjustment, and removal of unused `BookingType`.

## Existing patterns

- Reservation detail client module (`app/reserve/[reservationId]/ReservationDetailClient.tsx`) exports both a named function and a default export. Downstream code can safely switch to named import.
- Test files rely on `vi.importActual` with manual casting for compatibility with lint rules.
- UI and model modules typically order imports with local `@reserve/...` utilities before shared config.
- Shared booking utilities mostly provide pure helpers; type re-exports should use `import type` to avoid runtime bundling.

## Constraints

- ESLint rules are enforced during build; fixes must keep types intact and respect existing module contracts.
- Changes should remain type-safe and avoid altering runtime behavior.
- Ensure `reserve/shared/utils/booking.ts` only exports used helpers and uses type-only imports where possible.
