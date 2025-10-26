# Implementation Plan: Calendar Parity for My Bookings Edit Dialog

## Objective

We will enable customers to edit bookings from `/my-bookings` with the same availability-aware calendar used in the reserve flow so that closed or full dates are greyed out instantly.

## Success Criteria

- [ ] `/api/bookings?me=1` returns `restaurantSlug` and `restaurantTimezone` for every booking item alongside `restaurantId` when present.
- [ ] The edit dialog in `/my-bookings` always renders `ScheduleAwareTimestampPicker` (no legacy `TimestampPicker` fallback) and disables editing if slug is missing.
- [ ] Unit coverage updated to assert the schedule-aware picker is used and that API mapping includes slug/timezone.
- [ ] Manual QA via Chrome DevTools shows unavailable dates greyed out when opening the edit dialog for a booking.

## Architecture & Components

- `src/app/api/bookings/route.ts`: extend Supabase select to include `restaurant_id`, `restaurants(slug, timezone, name, reservation_interval_minutes)` and map into `BookingDTO` fields.
- `components/dashboard/EditBookingDialog.tsx`: remove conditional legacy picker logic, always mount `ScheduleAwareTimestampPicker`, add guard + inline alert if slug absent.
- `hooks/useBookings.ts` consumers (`MyBookingsClient`, ops dashboards) already handle optional slug/timezone; ensure they read new data.

## Data Flow & API Contracts

Endpoint: GET `/api/bookings?me=1`  
Request: existing query params unchanged.  
Response: `{ items: Array<{ id, restaurantId, restaurantSlug, restaurantTimezone, ... }>, pageInfo }`  
Errors: unchanged (`{ error: string }`).

## UI/UX States

- Loading: existing skeletons remain.
- Empty: unaffected.
- Error: existing toast/alert flows remain.
- Success: edit dialog calendar now greys out unavailable dates immediately; if slug missing (unexpected), show destructive alert and disable save action.

## Edge Cases

- Bookings lacking restaurant slug/timezone: block edits gracefully, log via analytics (optional) until backend guarantees data.
- Offline mode: existing mutation logic already handles.
- Timezone mismatch: rely on schedule response; fallback to provided timezone when schedule cache empty.

## Testing Strategy

- Unit: update `EditBookingDialog` tests to assert `ScheduleAwareTimestampPicker` renders and legacy picker removed; add test for slug-missing guard.
- Integration: update API handler test (or add new one) to verify DTO contains slug/timezone (if existing tests). If no automated coverage, add focused test in `reserve/tests/server`.
- E2E: rely on existing Playwright `my-bookings` flow; rerun if time permits.
- Accessibility: verify calendar/button focus states remain accessible via manual QA.

## Rollout

- Feature flag: none.
- Exposure: immediate once merged.
- Monitoring: track analytics warnings for missing slug (if added) and error logs for schedule fetch failures.
