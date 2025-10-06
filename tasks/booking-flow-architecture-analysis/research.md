## Repository Reconnaissance

- Monorepo-style Next.js 15 application with an additional `/reserve` Vite/React micro-frontend that can be toggled via `NEXT_PUBLIC_RESERVE_V2`.
- TypeScript-centric codebase with shared path aliases pointing both to root (`@/*`) and the Vite app (`@reserve/*`, `@features/*`, etc.).
- Supabase is the primary backend (auth + Postgres) accessed through server utilities in `server/supabase.ts`.
- Customer booking flow defaults to legacy React wizard (`components/reserve/booking-flow`) unless `RESERVE_V2` flag enables the new Vite-powered wizard (`ReserveApp`).

## Customer Booking Flow (Legacy / Default)

- Entry route: `app/reserve/page.tsx` imports `BookingFlowPage`.
- `components/reserve/booking-flow/index.tsx` renders a four-step wizard (Plan, Details, Review, Confirmation) inside a shared `WizardLayout` and progress footer.
- State handled via reducer exported from `reserve/features/reservations/wizard/model/reducer` (hydrated via alias re-export `components/reserve/booking-flow/state.ts`).
- Network interactions hit Next API endpoints (`/api/bookings` and `/api/bookings/[id]`) using native `fetch` with idempotency headers.
- Local storage caches contact details when `rememberDetails` flag is set.
- Analytics tracking done via `track` helper from `@/lib/analytics`; default restaurant derived from `DEFAULT_RESTAURANT_ID` (`@/lib/venue`).

## Customer Booking Flow (Reserve V2)

- Flag-controlled entry swaps to `ReserveApp` exported from `reserve/app/index.tsx`.
- Vite app bootstraps `ReserveRouter` (React Router) with routes for wizard, new booking, and reservation detail pages.
- Booking wizard UI lives in `reserve/features/reservations/wizard/ui`, mirroring step structure but using hooks/components co-located under `reserve/features/...`.
- Core state management: `useWizardStore` (React reducer) with actions defined in `reserve/features/reservations/wizard/model/store.ts` and `reducer.ts`.
- API access abstracted through `useCreateReservation` (React Query mutation) hitting rest endpoints via shared `apiClient` configured by env-driven base URL and timeout.
- Dependency injection via `WizardDependenciesProvider` layering analytics, haptics, navigation, error reporting.

## Booking API Surface

- Primary handler `app/api/bookings/route.ts` handles GET (lookup by contact) and POST (create). Uses extensive Zod validation schemas.
- POST logic: derives booking duration, ensures idempotency, upserts customer, performs capacity allocation via `findAvailableTable`, handles waitlist, loyalty awards, audit logging, analytics, and email notifications.
- `app/api/bookings/[id]/route.ts` enables CRUD (GET/PUT/DELETE) with dual schema support (dashboard + full update) and permission checks via Supabase auth.
- Server helpers concentrated in `server/bookings.ts`, `server/customers.ts`, `server/loyalty.ts`, `server/analytics.ts`, `server/emails`.

## Data Layer & Schema Insights

- `current.sql` outlines Supabase schema: `bookings`, `waiting_list`, `customers`, `loyalty_*`, `audit_logs`, etc., indicating relational design with waitlist + loyalty integrations.
- Booking tables enforce constraints (party size, unique references, normalized email/phone fields) and track analytics metadata (idempotency keys, client request IDs).

## Shared Utilities & Config

- Path aliases (`tsconfig.json`) allow Next components to import Reserve V2 modules transparently (`@features/reservations/...`).
- Shared config for booking options, venue defaults, and environment parsing stored under `reserve/shared/config`.
- `reserve/shared/api/client.ts` centralizes HTTP requests with timeout + credentials support, enabling SSR-friendly cookie usage.

## Testing & Tooling Signals

- `package.json` scripts include Next lint/typecheck, Vite build/test (`vitest`), and Playwright e2e/component suites.
- Reserve feature tests located under `reserve/features/.../__tests__` and `reserve/tests`.
- Storybook present for Reserve UI (`reserve/.storybook`).

## Pending Unknowns / Follow-Ups

- Need to confirm how feature flags are set in production and whether `ReserveApp` and legacy wizard share state/store for gradual migration.
- Investigate analytics + error reporting adapters referenced in DI container to understand observability flows.
- Clarify how Supabase RLS policies impact booking endpoints (not visible in repo).
