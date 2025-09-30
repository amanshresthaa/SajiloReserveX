# Plan

1. Update `app/reserve/[reservationId]/page.tsx` to import `ReservationDetailClient` via its named export to satisfy `import/no-named-as-default`.
2. Tidy `reserve/app/__tests__/router.test.tsx`:
   - Reorder imports so external modules follow lint expectations (`@testing-library/react` before `react`).
   - Replace the `typeof import('react-router-dom')` annotation with a type-only import namespace and cast the mocked module result to that type.
3. Reorder imports in `reserve/pages/RouteError.tsx`, placing `@reserve/shared/ui/icons` before `@shared/config/env` as required by `import/order`.
4. Run the project lint/build command (`npm run build`) to confirm all ESLint issues are resolved.
