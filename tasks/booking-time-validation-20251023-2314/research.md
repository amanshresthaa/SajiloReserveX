# Research: Fix Booking Time Validation

## Existing Patterns & Reuse

- `src/app/(authed)/my-bookings/MyBookingsClient.tsx` renders the `EditBookingDialog` for each booking. We should keep the dialog workflow and mutation hook unchanged.
- `components/dashboard/EditBookingDialog.tsx` already gates the schedule-aware picker behind `scheduleParityEnabled` and wires `react-hook-form` validation through the `start` field; we should extend this component rather than introduce a new picker.
- `src/components/features/booking-state-machine/ScheduleAwareTimestampPicker.tsx` composes `Calendar24Field` + `TimeSlotGrid` and centralises availability logic. Fixing validation in this component benefits both dashboard and any other consumers.
- Server enforcement for booking edits lives in `src/app/api/bookings/[id]/route.ts`; it already rejects times outside the schedule. Client changes should align with these rules instead of duplicating them.

## External Resources

- [`Calendar24Field`](reserve/features/reservations/wizard/ui/steps/plan-step/components/Calendar24Field.tsx) shows how manual time entry is handled today (HTML `input[type="time"]` with `commit` semantics).
- [`ScheduleAwareTimestampPicker`](src/components/features/booking-state-machine/ScheduleAwareTimestampPicker.tsx) contains availability helpers such as `hasCapacity`, `getLatestStartMinutes`, and `isPastOrClosing`.
- API handler [`src/app/api/bookings/[id]/route.ts`](src/app/api/bookings/[id]/route.ts) demonstrates server-side validation (returns 400/422 with codes like `INVALID_INPUT`, `BOOKING_IN_PAST`).

## Constraints & Risks

- Manual entry via the time input currently bypasses availability checks; `handleTimeChange` commits whatever string is provided before `useEffect` can coerce to a valid slot, so rapid submissions hit the API with invalid payloads.
- The picker is shared—changes must keep wizard flows intact (can’t regress datalist suggestions, disabled states, or keyboard support).
- We must not regress accessibility: errors should remain surfaced through the existing `Calendar24Field` messaging so screen readers announce them.
- Server expects ISO strings in UTC; any client-side validation must keep using `normalizeTime` + schedule zone conversions.

## Open Questions (and answers if resolved)

- Q: Does the schedule already include the current booking’s slot (so keeping the original time works)?
  A: Yes—when the time hasn’t changed, the schedule isn’t re-fetched for capacity, and `enabledSlots` retains the existing value. The bug appears when a user types an unavailable time, not when keeping the original slot.
- Q: Can we rely on `enabledSlots` for validation, or do we need additional server calls?
  A: `enabledSlots` already filters by `hasCapacity` and the active schedule, so checking against this list keeps client/server rules aligned.

## Recommended Direction (with rationale)

- Add client-side guarding in `ScheduleAwareTimestampPicker`: when a committed manual time isn’t in `enabledSlots`, refuse the change, restore the previous valid time, and show a descriptive inline error. This prevents invalid payloads from ever reaching the form.
- Clear the inline error whenever the user picks a valid slot (via grid or manual entry) so the interaction stays consistent.
- Keep `EditBookingDialog` logic untouched aside from inheriting the improved picker behaviour, minimising the blast radius.
