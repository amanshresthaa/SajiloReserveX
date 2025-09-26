# Implementation Plan

## 1. Re-state objectives & scope

- **Goal**: Refactor `/reserve` booking flow into a maintainable, feature-sliced React (Router) app with robust API layer, modern routing, strict typing, performance & DX guardrails.
- **Constraints**: Current flow lives inside Next.js App Router; data served from `/app/api/bookings`. Tooling baseline: TypeScript (non-strict), ESLint minimal, no tests. We must plan a migration path without breaking existing booking experience.

## 2. Break down problem into sub-programs (multi-angle)

1. **Architecture definition** — Compare three perspectives:
   - _Greenfield SPA_: carve `/reserve` into standalone Vite + React Router app served via Next proxy route. Pros: clean separation; Cons: deployment complexity.
   - _Hybrid within Next_: restructure under `/reserve` while keeping Next’s App Router but adopting feature slice & React Query. Pros: fewer infra changes; Cons: coupling to Next data APIs.
   - _Incremental extraction_: create `/reserve` directory using feature-sliced structure while progressively moving components from `components/reserve`. Start with providers/router collocated; keep Next wrapper short-term. Pros: lower risk. **Chosen**: incremental extraction to `/reserve` workspace (allows eventual standalone build while reusing Next for hosting). Validate by mapping module boundaries & ensuring Next dynamic imports remain functional during transition.
2. **API layer uplift** — Evaluate options:
   - Continue using Fetch wrappers.
   - Introduce Axios + interceptors.
   - Leverage `@tanstack/react-query` + `ky` light client. **Chosen**: native `fetch` with wrapper + TanStack Query for caching; optional adapter to reuse Next fetch caching. Must add Zod-based validation.
3. **Routing strategy** — Options:
   - Next App Router data routes.
   - React Router data routers inside `/reserve` mount. **Chosen**: React Router v6.4 Data Router hosted inside `/reserve/app/router.tsx`, wrapped by Next page. Allows Suspense boundaries, loaders/actions, and code splitting via `lazy` with Vite-friendly semantics.
4. **State management** — Evaluate storing all state in React Query vs local reducers vs context/store (Zustand). Decision: form data (stepper) managed via dedicated feature hook (`useReservationWizard`) with context provider + reducer shaped per step; server data through React Query. Minimizes re-renders via selectors + stable context boundaries.
5. **Testing & DX** — Option sets: Vitest vs Jest, MSW vs custom fetch mocks. Choose Vitest + React Testing Library (align with Vite), MSW for API mocks, Playwright for e2e.

## 3. Migration phases (mapped to required deliverables)

1. **Tooling foundation**
   - Harden TypeScript (`strict: true`, drop `allowJs`) with incremental fixes via `tsconfig.reserve.json` initially if needed.
   - Configure ESLint (typescript-eslint, react, import/order, jsx-a11y), Prettier, lint-staged, Husky.
   - Add testing stack scaffolding (Vitest config, MSW, Playwright skeleton) and CI pipeline templates.
2. **Create `/reserve` workspace skeleton**
   - Introduce target structure: `reserve/app`, `reserve/shared`, `reserve/entities`, `reserve/features`, `reserve/pages`.
   - Set up React Router root (lazy routes, loaders/actions, error & suspense boundaries, layout).
   - Provide bridging Next page: `app/reserve/page.tsx` mounts new app via `<ReserveApp />` (hydration safe).
3. **API layer extraction**
   - Build `/reserve/shared/api/client.ts` (fetch wrapper + interceptors, typed responses, error normalization).
   - Create `/reserve/entities/reservation` domain: Zod schema, adapters, selectors.
   - Add TanStack Query provider in `reserve/app/providers.tsx`, queries/mutations for reservations (list & create).
4. **Feature refactors**
   - `features/reservations/wizard`: encapsulate step flow; decompose large components into container hook + presentational components per step.
   - Move helpers into domain-specific modules; ensure forms follow a11y requirements (focus management, inline errors, consistent keyboard support).
   - Implement optimistic mutation & invalidation (React Query) for create/update reservation.
   - Add error boundary & suspense around wizard routes.
5. **Routing enhancements**
   - Map routes: `/reserve` (list + wizard), `/reserve/:id`, `/reserve/new` etc. Use loaders for data prefetch, actions for mutations.
   - Implement route guards (auth, if needed) placeholder with TODO & typed context.
6. **Performance & accessibility**
   - Memoization audit: component split prevents unnecessary renders; use `React.memo` for presentational blocks.
   - Add virtualization for lists (if list view introduced) using `react-window` stub.
   - Ensure focus traps, skip links, keyboard navigation, `aria-live` for toasts.
   - Implement web vitals reporting + bundle analyzer command.
7. **Testing & documentation**
   - Unit tests for hooks (wizard reducer, API adapters).
   - Integration test for `/reserve/new` route (React Testing Library + MSW).
   - Playwright smoke for create/edit/cancel flows.
   - Update README + CONTRIBUTING + ADR + Definition of Done checklists.

## 4. Verification gates per phase

- **Type safety**: run `pnpm typecheck` (tsc --noEmit) after each module group; ensure zero implicit `any` in exposed APIs.
- **Lint**: `pnpm lint` for ESLint/Prettier compliance.
- **Tests**: `pnpm test` (Vitest), `pnpm test:e2e` (Playwright) nightly.
- **Build**: `pnpm build` for Vite bundle + Next integration smoke.
- **Bundle analysis**: `pnpm analyze` using `rollup-plugin-visualizer` or `size-limit`.
- **Performance**: measure TTI via Lighthouse before/after; track React Query cache hits via devtools; capture network call counts with Chrome DevTools throttled run.

## 5. Risk mitigation & fallback

- Stage migration behind feature flag (`NEXT_PUBLIC_RESERVE_V2`). Continue serving legacy flow while new app incubates.
- Provide adapter layer to call existing Next API endpoints; if endpoints change, update normalization centrally.
- Rollout plan: release new flow to internal QA, then % traffic, monitored via analytics + error logging.

## 6. Deliverable mapping

- Architecture proposal will detail before/after structure (ASCII diagrams) + rationale.
- Refactor plan enumerates 6–8 PRs with scope, risks, Definition of Done.
- Code examples: highlight `useReservation` query, `useCreateReservation` mutation with optimistic update, sample route config, component before/after diff.
- Docs: README sections for setup/scripts, CONTRIBUTING checklist, DoD per PR.
