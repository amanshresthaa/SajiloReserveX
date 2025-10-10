# Implementation Plan: Ops Bookings Management

## Objective

Give restaurant staff a `/ops/bookings` dashboard view to review, edit, and cancel reservations they manage without relying on customer-owned endpoints.

## Success Criteria

- [ ] Authenticated Ops users can visit `/ops/bookings`; unauthenticated users are redirected to sign in.
- [ ] Page lists bookings for the selected restaurant with pagination/status filters similar to "My bookings".
- [ ] Staff can update booking time/party/notes and cancel bookings via Ops-specific mutations that enforce membership.
- [ ] Sidebar/header copy reflect the new entry while preserving "New walk-in booking" CTA.

## Architecture

### Components

- `app/(ops)/ops/(app)/bookings/page.tsx`: server entry that verifies membership, selects default restaurant, and prefetches initial data.
- `components/ops/bookings/OpsBookingsClient.tsx`: client component that manages filters, restaurant switcher, dialogs, and renders `BookingsTable`.
- `components/ops/bookings/OpsBookingsDialogs.tsx`: (if needed) wrappers around existing dialogs wired to Ops mutations.

### State Management

- Reuse `useBookingsTableState` for pagination/filter state.
- New React Query hooks (`useOpsBookings`, `useOpsUpdateBooking`, `useOpsCancelBooking`) under `hooks/` with dedicated query keys namespace.
- Store restaurant selection in component state (default to primary membership, allow switching when multiple).

### API Integration

**Endpoint**: `GET /api/ops/bookings`
**Request**: `?restaurantId=uuid&page=1&pageSize=10&status=confirmed|cancelled|...&from=ISO&to=ISO&sort=asc|desc`
**Response**: `{ items: BookingDTO[], pageInfo: { page, pageSize, total, hasNext } }`

**Endpoint**: `PATCH /api/ops/bookings/[id]`
**Request**: `{ startIso: string, endIso: string, partySize: number, notes?: string | null }`
**Response**: `BookingDTO` snapshot for optimistic updates.

**Endpoint**: `DELETE /api/ops/bookings/[id]`
**Response**: `{ id: string, status: 'cancelled' }` upon success.

All endpoints use `requireMembershipForRestaurant` or membership lookup to ensure user is linked to the booking's restaurant.

## Implementation Steps

1. Introduce Ops-specific query keys and hooks (`useOpsBookings`, `useOpsUpdateBooking`, `useOpsCancelBooking`).
2. Extend Ops API routes: add `GET /api/ops/bookings`, `PATCH` & `DELETE /api/ops/bookings/[id]` with membership enforcement, reuse booking helpers, and cover with Vitest.
3. Build `OpsBookingsClient` and supporting UI (restaurant selector, table integration, dialogs using Ops hooks).
4. Add server page at `/ops/bookings` performing auth/membership checks, prefetching first page via React Query/Hydration Boundary.
5. Update navigation/layout (`OpsAppShell`, `AppSidebar`) to surface the new page and correct titles/CTA visibility.
6. Wire tests + verification docs (`pnpm test`, `pnpm run build`), update task checklist/verification.

## Edge Cases

- Staff with zero memberships see the same "No restaurant access" state as other Ops pages.
- Bookings without emails/phones (walk-ins) should still display and remain editable.
- Handle expired bookings where status transitions disallow editing (surface errors gracefully).
- Multiple restaurant memberships should allow switching; ensure API rejects restaurant IDs staff lacks.

## Testing

- Vitest coverage for new Ops API handlers (success + auth failures + permission denial).
- Component-level checks via existing unit patterns if necessary (focus on API + manual QA for UI flows).
- Manual verification: navigate, filter, edit, cancel, ensure updates reflected, check header/sidebar states.

## Rollout

- No feature flag required; ship behind standard Ops auth.
- Monitor Ops booking mutations via existing logging (`logAuditEvent`, side-effect queues).

## Open Questions

- Should Ops edits expose customer contact fields? (Current scope keeps minimal fields until clarified.)
- Do we need additional status transitions (e.g., mark confirmed/pending) beyond today’s status PATCH endpoint?
