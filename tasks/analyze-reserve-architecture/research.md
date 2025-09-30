# Research

## Repository Patterns

- `reserve/` is a standalone Vite + React Router app with TanStack Query and Suspense integration (`reserve/app/providers.tsx`, `reserve/app/routes.tsx`).
- The directory uses a feature-sliced structure (`app`, `features`, `entities`, `shared`, `pages`) and co-locates UI, model, api, hooks under `features/reservations/wizard`.
- Shared utilities wrap primitives from the parent Next.js codebase (`reserve/shared/utils/booking.ts` re-exports from `@/components/reserve/helpers`).
- Alias configuration in `reserve/vite.config.ts` maps `@reserve` to the reserve app root and `@` to the monorepo root, enabling cross-app imports.
- Env configuration is centralized in `reserve/shared/config/env.ts`, parsed with `zod` and backed by `NEXT_PUBLIC_*` variables.
- Testing footprint includes Vitest unit tests and Playwright e2e specs under `reserve/tests`.

## Coupling & Integration Observations

- The reserve SPA depends on root-level modules like `@/lib/analytics`, `@/lib/enums`, `@/components/ui/label`, inheriting implementation details from the Next.js app.
- Shared UI components (e.g., `reserve/shared/ui/Field.tsx`) compose parent design system primitives and rely on `bookingHelpers` exported from the Next.js layer.
- API layer (`reserve/shared/api/client.ts`) assumes JSON payloads and globally scoped `fetch`, with custom abort + timeout handling tied to `env.API_TIMEOUT_MS`.
- `useReservationWizard` orchestrates navigation/state, accesses browser APIs (`localStorage`, `navigator.vibrate`) with guards, and triggers analytics side effects from the parent app.
- Routing uses nested children under `/reserve`, with lazy loading for pages, and fallback route for `*`.

## Potential Architectural Considerations to Investigate

- Evaluate the degree of coupling introduced by importing parent app modules via the `@` alias (shared helpers, analytics, enums) and its impact on deployability/ownership boundaries.
- Assess duplication vs. reuse decisions between the reserve SPA and the main Next.js application, especially around adapters, booking helpers, and UI primitives.
- Inspect data fetching boundaries for consistency (error normalization, caching strategy, invalidation patterns) and whether they align with back-end contract changes.
- Review local state management in the wizard reducer for scalability (e.g., exposure of `ApiBooking` types, cross-step dependencies, side effects inside hooks).
- Examine env/config handling to ensure parity with production settings and resilience when embedded into the main site.

## Open Questions

- What is the intended ownership boundary between the reserve SPA and the Next.js app—are cross-imports acceptable or should the reserve app be isolated?
- Are there architectural guidelines for evolving beyond the reservation wizard (additional routes/features) that the current structure might constrain?
