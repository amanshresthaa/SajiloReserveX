# Implementation Plan: Calendar Component Reuse Investigation

## Objective

We will make the `/my-bookings` edit dialog use the same schedule-aware calendar experience as the reservation plan step, including availability rules and clear error messaging.

## Success Criteria

- [ ] Edit dialog always renders `ScheduleAwareTimestampPicker` when editing bookings in production.
- [ ] Past and unavailable dates/times are disabled exactly as in the plan-step wizard.
- [ ] If the schedule-aware path cannot load, the fallback picker blocks past times and surfaces contextual validation errors.
- [ ] Error codes such as `CLOSED_DATE`, `OUTSIDE_HOURS`, and `CAPACITY_EXCEEDED` display actionable copy in the dialog.

## Architecture & Components

- `/my-bookings` edit dialog (`components/dashboard/EditBookingDialog.tsx`) always renders `ScheduleAwareTimestampPicker` when a restaurant slug is present; fallback `TimestampPicker` remains only for slugless bookings and now mirrors guardrails (min date, descriptive messaging).
- `ScheduleAwareTimestampPicker` composes `Calendar24Field` → `@shared/ui/calendar`, and we will prefetch nearby schedules plus adjust disabled-day logic so closed dates surface immediately across both edit and plan flows.
- Server API (`src/app/api/bookings/[id]/route.ts`) will emit structured error codes for operating-hours and capacity failures so the dialog can render meaningful copy.

## Data Flow & API Contracts

- The schedule-aware picker fetches reservation schedule data via `fetchReservationSchedule`; we will prefetch adjacent days to warm availability and reuse the same cache hooks as the plan step.
- The edit mutation API will now return consistent `{ error, code }` payloads for validation failures so the client can surface tailored guidance.

## UI/UX States

- Edit dialog loading/error states remain as-is while availability is fetched; closed/no-slot days are disabled immediately thanks to eager prefetching and tighter disabled-day logic.
- Expanded error messages inform users when the restaurant is closed, outside operating hours, capacity exhausted, or when selections are in the past.

## Edge Cases

- Missing `restaurantSlug` or failed schedule fetch falls back to `TimestampPicker`, which now enforces `minDate` and clarifies why selections fail (e.g., closed, outside hours) using mapped error codes from the API.
- Schedule fetch failures mark dates as “unknown” without disabling valid selections; closed/no-slot states are cached per day to avoid flicker.

## Testing Strategy

- Manual QA: verify `/my-bookings` edit dialog disables past dates and mirrors plan-step behavior; confirm fallback path by forcing slug absence (unit/local tweak) or mocking schedule failure.
- Unit tests (if present) are not modified; rely on TypeScript coverage and manual verification.

## Rollout

- No feature flag needed post-change; deploy with standard release process.
