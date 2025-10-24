# Implementation Plan: Fix Booking Time Validation

## Objective

We will enable users to edit bookings only to available time slots so that updates succeed without server errors.

## Success Criteria

- [ ] Selecting an unavailable slot is prevented or handled gracefully
- [ ] Booking edits return success for valid selections

## Architecture & Components

- `ScheduleAwareTimestampPicker`: introduce local validation state that ensures committed times exist within `enabledSlots`. Reject invalid manual entries, keep the previous valid selection, and surface an inline error via the existing field error rendering.
- `Calendar24Field`: no changes required; it already surfaces the `time.error` string we provide. We simply pass the merged validation message down.
- `EditBookingDialog`: continues to consume the picker; no additional props required.

## Data Flow & API Contracts

Endpoint: `PUT /api/bookings/:id` (existing).
Request: `{ startIso: string, endIso?: string, partySize: number, notes?: string | null }` (unchanged).
Response: Booking DTO (unchanged).
Errors: surface existing server codes such as `INVALID_INPUT`, `BOOKING_IN_PAST`; client now blocks invalid inputs earlier.

## UI/UX States

- Loading: unchanged – picker shows “Loading availability…” while fetching.
- Empty/unavailable: existing “closed/no slots” copy remains intact.
- Error:
  - New inline error when the user types a time outside available slots (`Selected time is no longer available…`).
  - Existing form errors (e.g., missing start) still render via `react-hook-form`.
- Success: selecting a valid slot (via list or manual entry) clears the error and commits to the form.

## Edge Cases

- Manual time entry with seconds or malformed input (guard with `normalizeTime`).
- Switching dates resets availability; ensure validation state clears alongside new schedule loads.
- When no prior valid time exists (e.g., new date with all slots booked), committing invalid input should leave the form empty and prompt user to pick again.
- Ensure keyboard users receive focus/ARIA feedback (error message announced via existing label association).

## Testing Strategy

- Unit: add a React Testing Library spec for `ScheduleAwareTimestampPicker` exercising manual invalid time entry and verifying `onChange` is not called with an invalid value, yet is called once a valid slot is chosen.
- Integration: rely on existing flows; ensure test mocks cover query client fetch.
- E2E: optional/manual via dashboard booking edit (defer to QA checklist).
- Accessibility: validate through DevTools audit after change (error announcement & focus).

## Rollout

- Feature flag: existing `scheduleParityEnabled` controls usage; no new flags.
- Exposure: ship as a bug fix.
- Monitoring: rely on analytics event `booking_edit_failed` reducing for `INVALID_INPUT`; consider checking logs post-deploy.
