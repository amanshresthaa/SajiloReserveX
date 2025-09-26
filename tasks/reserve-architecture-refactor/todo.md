# Implementation TODO

- [x] Set up `/reserve` directory skeleton (app, pages, features, entities, shared, tests).
- [x] Add TypeScript config entry (`tsconfig.reserve.json`) and adjust root config for stricter typing path.
- [x] Configure ESLint/Prettier updates (typescript-eslint presets, jsx-a11y, import/order) and fix invalid comment.
- [x] Add Husky + lint-staged scaffolding for lint/typecheck/test hooks.
- [x] Create React Router root (`reserve/app/providers.tsx`, `reserve/app/router.tsx`, `reserve/app/index.tsx`).
- [x] Bridge Next.js page to new Reserve app behind feature flag.
- [x] Implement shared API client with fetch wrapper, interceptors, and error normalization.
- [x] Define reservation entity schema + adapter (`reserve/entities/reservation`).
- [x] Build TanStack Query hooks (`useReservation`, `useCreateReservation`) and context provider.
- [x] Migrate wizard reducer & steps into feature-sliced structure (container hook + presentational components).
- [ ] Extract helper logic into domain modules (availability/time formatting) and shared utils.
- [x] Add Suspense/Error boundaries and lazy-loaded routes with loaders/actions skeleton.
- [x] Seed testing scaffolding (Vitest config, MSW placeholder, sample unit test).
- [x] Update README and add CONTRIBUTING summary.
- [x] Document Definition of Done and ADR stub references.
