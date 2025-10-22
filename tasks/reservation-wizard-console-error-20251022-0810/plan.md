# Implementation Plan: Reservation Wizard Console Error

## Objective

Ensure the reservation wizard treats `"BOOKING_IN_PAST"` API responses as expected validation errors so that the console stays clean in development while unexpected failures continue to be reported.

## Success Criteria

- [ ] Triggering a `"BOOKING_IN_PAST"` response no longer invokes `errorReporter.capture` (verified via unit test).
- [ ] Generic API rejections still call `errorReporter.capture` and surface the existing fallback error message.

## Architecture & Components

- `reserve/features/reservations/wizard/hooks/useReservationWizard.ts`: gate the `errorReporter.capture` call in `handleConfirm` behind a guard that skips known domain validation errors (`BOOKING_IN_PAST`).
  State: unchanged | Routing/URL state: unchanged.
- `reserve/features/reservations/wizard/ui/__tests__/BookingWizard.plan-review.test.tsx`: extend test doubles to assert the new reporting behavior.

## Data Flow & API Contracts

Endpoint: POST/PUT `/bookings` via `useCreateReservation`/`useCreateOpsReservation` – no changes required.
Errors: Continue using `ApiError` `{ code, message, status }`; add guard logic before capturing.

## UI/UX States

- Loading: no change.
- Empty: no change.
- Error: still surfaces booking-in-past guidance or fallback toast.
- Success: unaffected.

## Edge Cases

- Editing existing bookings (`state.editingId`) should respect the same guard.
- Ensure guard only skips reporting for recognized codes so that we do not hide new failure modes.

## Testing Strategy

- Unit: update `BookingWizard.plan-review` tests to assert `errorReporter.capture` skip for `"BOOKING_IN_PAST"` and still triggered for generic errors.
- Integration/E2E: not required for this change (covered by wizard tests).
- Accessibility: unchanged.

## Rollout

- Feature flag: not needed.
- Exposure: standard release.
- Monitoring: rely on existing analytics/error tracking; manual verification via dev console.
