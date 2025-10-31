# Implementation Plan: Ops Past Bookings Table Assignment Handling

## Objective

We will prevent table assignment actions from appearing for past service dates so ops users focus on actionable bookings only.

## Success Criteria

- [ ] Auto-assign button hidden/disabled when viewing a past service date.
- [ ] Individual booking cards do not prompt for assignments on past dates.
- [ ] Existing functionality for current/future dates unchanged.
- [ ] Manual assignment tab hidden/disabled when past service date selected.
- [ ] Bookings whose service time has passed display as read-only (greyed) even on the current service date.
- [ ] Bookings starting within 15 minutes use a distinct warning visual treatment.
- [ ] Action-required indicator appears when check-in or check-out is due, without overlapping existing badges.

## Architecture & Components

- `OpsDashboardClient` derives `summary.date` & `summary.timezone`; use `getTodayInTimezone` to compute `allowTableAssignments` boolean and pass to child components along with friendly messaging.
- `BookingsList` & `BookingDetailsDialog` gain an `allowTableAssignments` prop to determine whether to expose assignment UI; extend `BookingsList` to compute per-booking temporal state using Luxon.
- Introduce helper that compares `booking.startTime` with current time in restaurant timezone, deriving `past`, `imminent (≤15 min)`, or `upcoming` states for styling and gating.
- Extend helper to flag when check-in (pre-check-in statuses) or check-out (checked-in status with end time elapsed) actions are due and surface in UI.
- `formatTableAssignmentDisplay` updated to avoid “required” language when assignments are locked.

## Data Flow & API Contracts

- No API contract changes; reuse `useOpsTodaySummary` data.
- Table assignment mutations remain defined but calls are gated in UI layer.
- Poll current time once per minute on the client to update temporal indicators without extra network calls.

## UI/UX States

- Loading: Skeleton unchanged; gating occurs after data resolves.
- Empty: Past-date view still shows “No bookings found” card when applicable.
- Error: Existing error boundary unaffected.
- Success: Past-date UI shows read-only messaging (auto assign button replaced with helper text); past bookings within today are styled with muted palette, imminent bookings highlighted.
- Success: Action required badge/icon surfaces alongside booking title when start/end thresholds hit, ensuring staff visibility.

## Edge Cases

- Restaurant timezone ahead/behind current user (ensure comparison uses timezone helper).
- Date switching via calendar/URL query should recompute `allowTableAssignments`.
- Ensure future dates (tomorrow) still show actions.
- Handle bookings without `startTime` gracefully (fallback to existing behaviour).
- Update styling without compromising text contrast/accessibility.

## Testing Strategy

- Unit: Add tests for `BookingsList` rendering to assert past-date messaging.
- Integration: Extend `Ops` client test to cover past-date scenario (mock summary date < today).
- E2E: Not in scope (no Playwright updates).
- Accessibility: Verify new helper text is semantic & does not remove focusable controls for actionable dates.
- Add component tests to ensure past/imminent badges render as expected given controlled system time.
- Add assertions covering action-required indicators for both check-in and check-out scenarios.

## Rollout

- Feature flag: Not required (UI-only guard).
- Exposure: Immediate once deployed.
- Monitoring: Observe support feedback; no telemetry impact.
- Kill-switch: Revert commit if unexpected behaviour reported.
