# Implementation Plan: Ops React SOLID Rewrite

## Objective

We will deliver a maintainable Ops experience built on modern React patterns and SOLID principles so that restaurant teams can manage bookings, team members, and settings reliably without regressions.

## Success Criteria

- [ ] All Ops routes (`/ops`, `/ops/bookings`, `/ops/bookings/new`, `/ops/team`, `/ops/restaurant-settings`) render via the new architecture with feature parity and no console errors.
- [ ] Shared logic lives under `src/` following the agreed folder structure (components/common|features, hooks, contexts, services, utils, types).
- [ ] Key business logic is encapsulated in custom hooks/services with unit tests for at least dashboard summary, bookings table state, and restaurant settings data handling.
- [ ] Manual Chrome DevTools MCP QA completed for mobile/tablet/desktop confirming accessibility basics and acceptable performance.

## Architecture & Components

- **Routing wrappers (`app/(ops)/*`)**: Thin server components responsible only for auth/membership fetch + providing context providers.
- **Contexts**
  - `OpsSessionProvider` (`src/contexts/ops-session.tsx`): supplies user, memberships, selected restaurant state with setter + derived permissions. Persist selection in cookie/local storage.
  - `OpsServicesProvider` (`src/contexts/ops-services.tsx`): exposes service instances (bookings, customers, restaurants) enabling dependency injection/testing.
- **Services (`src/services/ops/*`)**
  - `bookingService`: list bookings, summary, heatmap, mutate status, create walk-in (wraps `/api/ops` & Supabase server queries).
  - `restaurantService`: fetch membership restaurants, operating hours, service periods, profile updates.
  - `teamService`: invites CRUD, membership fetch.
  - `customerService`: customers list/export (if still required by downstream components).
- **Custom hooks (`src/hooks`)**
  - `useOpsNavigation` for sidebar metadata.
  - `useTodayBookings`, `useBookingHeatmap`, `useBookingStatusActions`.
  - `useBookingsTableController` orchestrating filters/pagination with React Query.
  - `useWalkInBooking`, `useTeamManagement`, `useRestaurantSettings` wrappers around services.
- **Components**
  - `components/features/ops-shell`: `OpsShell`, `OpsSidebar`, `OpsTopBar`, etc.
  - `components/features/dashboard`: `ServiceSnapshotSection`, `BookingsSummaryCard`, `BookingsFilterBar`, `BookingList`, `BookingDetailsDialog`.
  - `components/features/bookings`: `BookingsPageContainer`, `BookingsTable`, dialogs, `RestaurantSelector`.
  - `components/features/walk-in`, `team`, `settings` analogous structure.
  - `components/common`: shared presentation (status badges, form inputs, skeletons).
- Prefer composition (slots/render props) for reusable blocks (e.g., `DataState` component controlling loading/empty/error rendering).

## Data Flow & API Contracts

- **Auth/Membership**
  - Server component fetches supabase user + memberships (reuse `fetchUserMemberships`) and passes to `OpsSessionProvider`.
  - Provider stores selected restaurant, exposes derived `activeRestaurant`.
- **Dashboard**
  - `useTodayBookings` calls `bookingService.getTodaySummary(restaurantId, date)` (server fetch via API route). Normalizes to `TodaySummaryModel`.
  - `useBookingHeatmap` requests the 6-week range when summary resolves; memoizes intensity buckets.
  - Status updates call `bookingService.updateStatus(bookingId, status)` and optimistically update React Query cache.
- **Bookings list**
  - `useBookingsTableController` builds search params, delegates to `bookingService.listBookings(filters)` (REST `GET /api/ops/bookings`).
  - Mutations use service methods (`updateBooking`, `cancelBooking`) with React Query invalidate.
- **Walk-in booking**
  - Form uses `bookingService.createWalkIn(payload)` hitting `POST /api/ops/bookings`.
- **Team**
  - `teamService` wraps owner hooks; ensures consistent DTO across invites list + form actions.
- **Restaurant settings**
  - `restaurantService` fetches operating hours/service periods/profile using existing supabase helpers (moved under services). Mutations via `PATCH /api/owner/restaurants` (if exists) else new endpoints.

Maintain existing API response shapes; introduce converters in services to map to UI-friendly models.

## UI/UX States

- Loading: skeleton or spinner via `DataState` wrappers; for server data use Suspense fallbacks.
- Empty: dedicated components for no access, no bookings, no heatmap data.
- Error: inline alerts with retry actions pulling from service error messages (HttpError shape).
- Success: fully interactive layouts with keyboard accessible controls; ensure focus management for dialogs & skip links.

## Edge Cases

- No memberships / missing restaurant selection.
- API/network failures for summary/heatmap/list/mutations (graceful fallback).
- Supabase returning null timezone or invalid dates (default to UTC).
- Rate-limited API responses (429) -> show toast + instructions.
- Unauthenticated server component (redirect to `/signin`).
- Multi-restaurant accounts switching context mid-session.

## Testing Strategy

- Unit (Vitest + RTL):
  - Services: mock fetch/Supabase to verify request payload & mapping.
  - Hooks: `useTodayBookings`, `useBookingsTableController`, `useOpsSessionProvider` state transitions.
  - Components: snapshot/interaction for `BookingsTable` + `BookingsSummaryCard`.
- Integration:
  - React Testing Library tests exercising container + context for dashboard and bookings routes.
- E2E:
  - Update Playwright scripts (if existing) for happy-path smoke (dashboard loads, booking filter toggles, invite flow).
- Accessibility:
  - Use `@axe-core/react` in dev or manual `axe` run for key pages; confirm keyboard navigation + dialog focus.

## Rollout

- Feature flag: wrap new Ops shell in `config.flags.opsV5` (defaults to `false` until QA complete); toggle for staged rollout.
- Exposure: enable in staging -> internal beta -> 100%.
- Monitoring: watch Supabase logs for API errors + client Sentry for Ops route issues. Update `verification.md` with findings.
