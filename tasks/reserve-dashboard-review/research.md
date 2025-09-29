# Research Notes — /reserve & /dashboard Audit

## Task Outline & Subtasks

- **Map Architecture Boundaries**: Identify how the `/reserve` Vite app plugs into the Next.js shell and how `/dashboard` is composed within the `(authed)` segment. Primary view: treat them as two distinct delivery surfaces sharing APIs and UI primitives. Alternative view: confirm whether `/reserve` is merely a wrapper around legacy components. _Verification_: cross-read `README.md`, `app/reserve/page.tsx`, and `reserve/app/routes.tsx` to confirm the feature-flag swap and independent router stack.
- **Catalogue Feature Flow for Reservations**: Decompose the reservation wizard into state, API, and UI layers plus supporting entities. Primary view: feature-sliced architecture (entities → features → pages). Alternative view: ensure there is no parallel legacy flow under `components/reserve`. _Verification_: directory walk (`ls reserve`), inspect reducers/hooks (`reserve/features/reservations/wizard`), and adapter/tests to validate normalization.
- **Catalogue Dashboard Capabilities**: Document how `/dashboard` lists and mutates bookings, including TanStack Query hooks and dialogs. Primary view: client-only page powered by `/api/bookings`. Alternative view: check for server components or other data loaders. _Verification_: inspect `app/(authed)/dashboard` files, related hooks/components, and vitest coverage.
- **Trace Shared Services & Data Contracts**: Understand API handlers, Supabase access, and DTO transformations that underpin both surfaces. Primary view: `/api/bookings` + `server/bookings.ts` provide shared contract. Alternative view: check for separate Vite-only endpoints or mocks. _Verification_: read `app/api/bookings/{route.ts,[id]/route.ts}`, compare with `hooks/useBookings.ts` and `reserve/shared/api/client.ts`, and confirm with unit tests in `reserve/tests/unit/my-bookings-api.test.ts`.
- **Assess Testing, Tooling, and TODO Debt**: Determine coverage touchpoints for these areas and note explicit TODOs/stubs. Primary view: vitest suite inside `reserve/tests`. Alternative view: look for Playwright specs or Jest leftovers. _Verification_: run `find reserve/tests`, review representative specs, search repo for TODO/FIXME with `rg`.

## Key Observations & Evidence

### Dual-Surface Architecture

- `README.md` documents that `/reserve` is delivered by a feature-sliced React app mounted via a feature flag while legacy flow lives under `components/reserve` (README.md, lines 3-33). Confirmed by `app/reserve/page.tsx` choosing between `BookingFlowPage` and `<ReserveApp />` when `NEXT_PUBLIC_RESERVE_V2` is true (app/reserve/page.tsx:1-11 via `nl`).
- The Vite sub-app under `reserve/` mirrors feature-sliced practices: `app/`, `entities/`, `features/`, `pages/`, `shared/`, `tests/` (verified with `ls reserve`). `reserve/app/router.tsx` instantiates a React Router tree from `reserveRoutes` (reserve/app/router.tsx:1-10). Routes include `/reserve`, `/reserve/new`, detail pages, and a catch-all (reserve/app/routes.tsx:11-39).
- `ReserveRootLayout` wraps the router outlet with `ReserveProviders` (QueryClientProvider) and a skip link (reserve/pages/RootLayout.tsx:5-16). This ensures accessibility and shared TanStack Query configuration (`reserve/app/providers.tsx`).

### Reservation Wizard Stack

- State management uses a reducer with rich domain modeling (`reserve/features/reservations/wizard/model/reducer.ts`:1-203) and normalized booking state. It interfaces with hooks like `useReservationWizard` (reserve/features/reservations/wizard/hooks/useReservationWizard.ts`:1-213) to manage sticky footer actions, localStorage for remembered contacts, optimistic submission, and React Router navigation to `/thank-you`.
- API interactions rely on `useCreateReservation` (reserve/features/reservations/wizard/api/useCreateReservation.ts`:1-74) which enforces idempotency keys, normalizes responses via adapters, and invalidates TanStack Query caches. `useReservation` fetches individual bookings with defensive error handling (reserve/features/reservations/wizard/api/useReservation.ts`:1-33).
- Data normalization occurs via Zod schemas in `reserve/entities/reservation` with adapters converting snake_case API payloads to camelCase domain objects (reserve/entities/reservation/adapter.ts`:1-49`).
- UI is modular: `ReservationWizard.tsx` orchestrates step components (reserve/features/reservations/wizard/ui/ReservationWizard.tsx`:1-71). `PlanStep.tsx` handles availability logic, tooltips, and service messages (reserve/features/reservations/wizard/ui/steps/PlanStep.tsx`). Remaining steps manage details form (react-hook-form + zod), review, and confirmation states.
- Tests exist for dialogs, adapters, API route queries, and e2e flows (`reserve/tests/unit/*.test.tsx`, `reserve/tests/e2e/*.spec.ts`). Notably `reserve/tests/unit/my-bookings-api.test.ts` exercises `/api/bookings?me=1` behavior (lines 1-116) bridging wizard submissions with dashboard retrieval.

### Dashboard Surface

- `/dashboard` is a client component page that composes `BookingsTable`, `EditBookingDialog`, and `CancelBookingDialog` (app/(authed)/dashboard/page.tsx:1-96). It memoizes filters, paginates locally, and interacts with TanStack Query via `useBookings`.
- `BookingsTable.tsx` renders status filters, loading skeletons, and accessible table semantics (components/dashboard/BookingsTable.tsx:1-115). It handles empty/error states with Radix-based alerts and `Pagination` component (components/dashboard/Pagination.tsx).
- Mutations use dedicated hooks: `useCancelBooking` dispatches DELETE requests, emits analytics, invalidates cache, and surfaces toast feedback (hooks/useCancelBooking.ts:1-36). `useUpdateBooking` performs PUT updates with idempotent toast and analytics instrumentation (hooks/useUpdateBooking.ts:1-34).
- Dialogs enforce validation: `EditBookingDialog` wraps react-hook-form + zod to validate datetime ranges, maintain dirty state, and show server-driven copy (components/dashboard/EditBookingDialog.tsx:1-152). `CancelBookingDialog` maps error codes to friendly text and manages optimistic closure (components/dashboard/CancelBookingDialog.tsx:1-87).
- Layout provides top-level call-to-action linking back to `/reserve` and accessible focus management (`app/(authed)/dashboard/layout.tsx`:1-24).
- Unit tests for the dialogs reside in the reserve test workspace to ensure consistent coverage (e.g., reserve/tests/unit/EditBookingDialog.test.tsx, CancelBookingDialog.test.tsx). Coverage of list table interactions is absent.

### Shared API & Data Contract

- `hooks/useBookings.ts` builds URLSearchParams from filters, ensures query key stability, and fetches `/api/bookings` with `fetchJson` ensuring normalized error handling (hooks/useBookings.ts:1-82). It keeps previous data during pagination for smoother UX.
- `app/api/bookings/route.ts` exposes GET (my bookings and lookup) and POST endpoints with extensive Zod validation, idempotency normalization, Supabase interactions, loyalty program integration, waiting list fallback, and analytics logging (file >400 lines). `myBookingsQuerySchema` powers the `me=1` path used by the dashboard (lines ~23-58). Responses adapt Supabase rows into `BookingDTO` (lines ~107-162) matching hook expectations.
- `app/api/bookings/[id]/route.ts` handles PUT/DELETE: `dashboardUpdateSchema` enables simplified update payload (lines ~19-35). Handler resolves booking by id, revalidates table availability, logs audit events, and triggers email notifications before returning JSON (rest of file). DELETE leverages `softCancelBooking`, sends cancellation email, and emits analytics.
- `server/bookings.ts` centralizes business logic: helper functions for availability windows, audit snapshots, waitlist management, normalization, overlapping checks, etc. (server/bookings.ts:1-400+). Booking status enums align with UI filters ensuring cohesion.

### Tooling, Config, and Debt Signals

- Environment toggles include `NEXT_PUBLIC_RESERVE_V2`, `NEXT_PUBLIC_RESERVE_API_BASE_URL`, and `NEXT_PUBLIC_RESERVE_API_TIMEOUT_MS` consumed via `reserve/shared/config/env.ts` (lines 1-15). `ReserveApp` defaults to `/api` for server calls, sharing cookies via `credentials: 'include'`.
- Only explicit TODO located at `libs/gpt.ts:5` (typing issue); no dashboard/reserve TODOs found via `rg`.
- Quality gates defined in root scripts: `pnpm test` executes Vitest for reserve workspace, `pnpm test:e2e` for Playwright (README). Lint and typecheck span both Next and Vite projects.
- Playwright e2e specs (`reserve/tests/e2e/*`) cover smoke and wizard plan flows, providing baseline assurance of reservation UI interactions.

### Verification Summary

- Repository structure confirmed via `ls` and targeted `nl` dumps for line references.
- Cross-validated feature flag claim by comparing README guidance with actual runtime check in `app/reserve/page.tsx`.
- Validated data flow by reading hooks (`useBookings`, `useCancelBooking`) and matching them to API route schemas and unit tests (`reserve/tests/unit/my-bookings-api.test.ts`).
- Confirmed testing presence with `find reserve/tests` and reviewed sample specs to ensure they target dashboard dialogs as well as API logic.
- Performed `rg TODO` as a secondary sweep for latent work items; only unrelated typing TODO surfaced.

## Uncertainties & Open Questions

- Reservation detail page is a placeholder (“coming soon”) indicating incomplete feature scope (reserve/pages/ReservationDetailsPage.tsx:7-16). Need product confirmation on intended behavior.
- While wizard leans on Supabase, it’s unclear how authentication hooks up for end users (dashboard relies on session via Supabase RLS). Further investigation into `middleware.ts` and auth flows may be required if scope expands.
- No direct performance metrics captured; would benefit from profiling React Query cache usage and analyzing `reserve/tests/e2e` coverage depth.
