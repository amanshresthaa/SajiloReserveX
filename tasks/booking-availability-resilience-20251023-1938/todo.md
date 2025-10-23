# Implementation Checklist

## Setup

- [x] Scaffold `reserve/shared/schedule/availability.ts` with exports + tests
- [x] Introduce env/flag plumbing for `FEATURE_EDIT_SCHEDULE_PARITY`

## Core

- [ ] Refactor wizard services to expose shared adapter without duplicating hooks
- [x] Build `ScheduleAwareTimestampPicker` composing `Calendar24Field` + `TimeSlotGrid`
- [x] Migrate `EditBookingDialog` (and any other `TimestampPicker` consumers) behind flag
- [x] Extend wizard far-future handling (`usePlanStepForm` & `PlanStepForm`) with unknown state + retry
- [x] Add offline-first persistence & queue for wizard mutations/drafts
- [x] Broaden `useUpdateBooking` invalidation + optimistic refresh listeners

## UI/UX

- [ ] Align copy/tooltips between create & edit flows; surface skeleton/loading states
- [ ] Verify calendar/time grid accessibility (keyboard, focus, tooltips)
- [ ] Ensure schedule-aware picker responsive styling fits dashboard layout

## Tests

- [ ] Unit: adapter helpers, unavailable reason logic, offline queue TTL
- [ ] Integration: picker component states, edit dialog flag toggle, plan-step month prefetch
- [ ] E2E: create/edit × closed/far-future/offline scenarios
- [ ] Axe/Accessibility checks on wizard Plan step + edit dialog

## Notes

- Assumptions:
  - Booking detail often lacks slug; current implementation falls back to default venue metadata until API provides explicit slug/timezone.
- Deviations:
  - None yet.

## Batched Questions (if any)

- Preferred source of restaurant slug/timezone for edit dialog schedule fetching?
