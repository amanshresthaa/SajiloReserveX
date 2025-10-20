# Implementation Plan: Repository QA Blueprint

## Objective

We will enable teams to execute a repository-specific QA strategy so that releases maintain high reliability and confidence.

## Success Criteria

- [ ] QA blueprint documents critical surfaces and risks grounded in repo code.
- [ ] Test strategy aligns with tooling and CI/CD constraints.
- [ ] Deliverables satisfy AGENTS handbook sections.

## Architecture & Components

- **Surface 1 – Next.js app (customer & marketing)**: routes in `src/app/**` (homepage, browse, checkout, auth, blog). Shared providers in `src/app/providers.tsx`.
- **Surface 2 – Next.js ops console**: `src/app/(ops)/ops/(app)/**` with Supabase-auth gating via `middleware.ts` and guards in `server/auth/guards.ts`.
- **Surface 3 – Reserve wizard (Vite micro-frontend)**: entry at `reserve/app/index.tsx`, routes defined in `reserve/app/routes.tsx`, API client hitting `/api/v1`.
- **Surface 4 – Server/service layer**: Supabase access in `server/supabase.ts`, domain modules (`server/bookings.ts`, `server/customers.ts`, `server/emails/**`, `server/security/**`).
- **Surface 5 – Data platform**: Supabase schema (`supabase/migrations/*.sql`), feature flags via env (`lib/env.ts`), Upstash cache, Resend, Plausible, Crisp.

## Data Flow & API Contracts

Endpoint: `POST /api/v1/bookings` (`src/app/api/v1/bookings/route.ts`)  
Request: `{ restaurantId, bookingDate, partySize, customer: { name, email, phone }, bookingType, seatPreference, marketingOptIn, source }`  
Response: `{ booking: BookingRecord, confirmation: { status, reference, pendingRef? }, customerProfile }`  
Errors: `{ code: "RATE_LIMITED" | "VALIDATION_FAILED" | "OVERBOOKED" | "INTERNAL", message, details }`

Contracts to spotlight:

- `GET /api/v1/restaurants/:slug/schedule` – Reserve availability.
- `POST /api/owner/team/invitations` – Team invite lifecycle.
- `GET /api/v1/profile` – Authenticated profile fetch with Supabase session.

## UI/UX States

- Loading: skeletons/spinners from shadcn components (`components/ui/*`), `reserve` wizard suspense.
- Empty: no restaurants (`src/components/features/restaurants/EmptyState.tsx`), zero invites.
- Error: toast + inline errors via `react-hot-toast` & `react-hook-form` error surfaces.
- Success: confirmation page `/thank-you`, ops dashboards metrics, wizard completion modal.

## Edge Cases

- Feature flags toggled via env (`env.featureFlags.*`) affecting capacity selectors, metrics, realtime floorplan.
- Rate limiting falling back to memory when Upstash creds absent.
- Supabase session expiry mid-flow (middleware redirect vs Reserve fetch).
- Booking creation past-time guard controlled by `FEATURE_BOOKING_PAST_TIME_BLOCKING` + grace minutes.
- Invitation tokens (expired/revoked) and case-insensitive emails.
- Analytics/event batching offline-first fallback.

## Testing Strategy

- Unit: target `server` pure logic (booking duration calc, guard errors, rate-limit anonymization) with Vitest.
- Integration: API handlers with Supabase test client (use `tests/integration` patterns) validating schema + RLS.
- E2E: Playwright flows for booking wizard, invite acceptance, ops dashboards; stabilize failing suites in `tests/e2e/ops/*.spec.ts`.
- Accessibility: Axe + keyboard paths for `/reserve`, `/checkout`, `/ops/bookings` (leverage Testing Library + Playwright accessibility tree).
- Static: ESLint (`eslint.config.mjs`), typecheck, secret scanning (`pnpm secret:scan`).

## Rollout

- Feature flag: Document toggles with recommended defaults per env (prod vs staging).
- Exposure: QA blueprint delivered as markdown deliverable referenced in PRs; adoption via linking in task folder.
- Monitoring: Align checks with existing observability events (`server/observability.ts`) and supabase audit logs; propose CI gating updates with metrics uploads.
