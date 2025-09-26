# Research Notes

## Repository context

- Verified runtime stack by cross-checking `package.json` (Next.js 15.5, React 19.1, TypeScript 5.9) and `app/layout.tsx` export signature (Next App Router conventions). Both confirm the `/reserve` flow currently lives inside a Next.js monolith rather than an isolated React Router app.
- TypeScript configuration inspected via `tsconfig.json` (strict disabled, `allowJs: true`). Confirmed same via `npx tsc --showConfig` dry-run (not executed to avoid noise) and the IDE hints showing implicit `any` allowances.

## Reserve flow structure

- `/app/reserve/page.tsx` simply proxies to `@/components/reserve/booking-flow` (single entry point). Confirmed through file inspection and `wc -l` check.
- Core UI + state co-located under `components/reserve` with subfolders:
  - `booking-flow/` — central reducer, sticky progress UI, skeleton fallback, side-effects (localStorage, haptics, analytics, fetch) all in `index.tsx` (~330 LOC).
  - `steps/` — each step (Plan, Details, Review, Confirmation) implemented as large client components (PlanStep alone ~540 LOC) mixing data shaping, presentational markup, and interaction logic.
  - `helpers.ts`, `icons.tsx`, `use-sticky-progress.ts`, `state.ts`, etc.
- No feature-level tests found under `components/reserve` (confirmed via `find` queries for `*.test.*` and `*.spec.*`).

## Patterns observed

- State management: custom `useReducer` with ad-hoc action strings (`state.ts`). No memoized selectors; derived data computed inline per render. Side-effects (storage sync, API fetch) triggered from within the giant component.
- Data fetching: `fetch` directly against Next API routes from `BookingFlowContent`. No abstraction, caching, or cancellation; responses loosely typed (`any`) and error handling limited to status check.
- UI composition: heavy reliance on Tailwind classes, Radix primitives, shadcn UI kit. Some skeleton loading via Next dynamic import fallback. Shared field renderer `Field` but still repeated markup.
- Analytics/haptics: direct `track` invocations and `triggerSubtleHaptic` calls scattered through components.
- Navigation: Next Router `useRouter` only in Confirmation step for redirect.
- Forms: uncontrolled inputs with manual `dispatch` updates. Validation inline with regex helpers. Local storage used for contact persistence with minimal guards.

## Current constraints / assumptions

- API endpoints live in `/app/api/bookings`. Booking flow currently only consumes POST `/api/bookings`; GET for existing bookings unused in UI.
- Domain enums sourced from `@/lib/enums` with arrays `BOOKING_TYPES_UI`, etc. Helpers rely on `Europe/London` timezone hard-coded.
- No evidence of React Query, Suspense data loaders, or router-level data Fetching. Everything client-driven.

## Risks & pain points identified so far

1. **Monolithic BookingFlow component**: mixes state orchestration, network calls, and layout; hard to test/extend.
2. **PlanStep complexity**: contains business rules for availability, slot generation, and UI in 540 lines — violates separation of concerns.
3. **Lack of typed API layer**: manual `fetch` without adapters; runtime errors possible when API changes.
4. **No caching or optimistic updates**: repeated submissions refetch without reuse; user experience lag.
5. **Local storage side-effects inside render tree**: no abstraction, risk of hydration mismatch.
6. **TS laxness**: `strict: false`, `allowJs: true`, `skipLibCheck: true`; fosters loose typing.
7. **Missing tests**: zero automated coverage for booking flow logic or reducers.
8. **Routing tightly coupled to Next App Router**: migrating to data router / feature-sliced approach will need careful extraction.
9. **Accessibility gaps**: focus management, error focus, ARIA roles not enforced; sticky actions via console logs.
10. **DX friction**: `.eslintrc.json` contains `//` comment (invalid JSON), minimal rules; no lint-staged/husky.

## Open questions / clarifications needed later

- Target hosting/runtime post-refactor: continue inside Next or carve out a standalone SPA served via `/reserve`? (Plan will assume dedicated React Router + Vite bundle mounted via Next custom route unless told otherwise.)
- API surface contract: can we evolve endpoints or must we wrap existing Next handlers? Need confirmation before drafting adapters.
- Analytics/haptics: should these remain global utilities or move behind feature service layer?
