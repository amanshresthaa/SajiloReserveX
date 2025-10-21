# Implementation Plan: Ops Calendar Shadcn Integration

## Objective

We will refactor ops booking flows so that staff pick dates/times using the same Shadcn calendar experience as `/reserve`, improving consistency and accessibility.

## Success Criteria

- [ ] Replace `datetime-local` inputs in dashboard booking edit forms with the shared Shadcn calendar/time picker.
- [ ] Booking edits continue to submit valid ISO timestamps and respect existing validation (end after start, past-time guards).
- [ ] Manual QA in Chrome DevTools MCP passes on mobile/tablet/desktop breakpoints.

## Architecture & Components

- `components/dashboard/EditBookingDialog.tsx`: swap the current form inputs for two `TimestampPicker` instances (start/end), handling react-hook-form integration and validation errors.
- `src/components/features/booking-state-machine/TimestampPicker.tsx`: ensure it exposes the props we need (error state, labels). Extend if necessary to support error messaging and focus handling.
- Shared utils `isoToLocalInput` / `localInputToIso` may be replaced with `TimestampPicker` emitting ISO strings directly.

State:

- Form state managed by `react-hook-form`; new picker will call `field.onChange` with ISO strings.

Routing/URL state:

- No changes; dialog remains client-side.

## Data Flow & API Contracts

- API payload for update bookings remains `{ startIso, endIso, ... }`.
- `TimestampPicker` should emit ISO strings to match existing mutation expectations.
- Ensure timezone awareness: rely on `TimestampPicker` `timezone` prop when necessary (pull from booking if available, default to restaurant tz).

## UI/UX States

- Loading: existing mutation button spinner unchanged.
- Success: dialog closes as today.
- Error: form error banner still displays API messages; field-level validation errors should surface under the pickers.
- A11y: keyboard navigation through calendar, focus trapping inside dialog, descriptive labels.

## Edge Cases

- Bookings in the past (should block submit with existing error message).
- Bookings without restaurant timezone (fallback to UTC).
- Users clearing a value when field is required (picker should prevent null selection since schema requires values).

## Testing Strategy

- Manual: `pnpm run build`.
- Manual QA: Use Chrome DevTools MCP to exercise the dialog on mobile/tablet/desktop.
- Optional: adjust/extend existing unit tests if present for `EditBookingDialog` (verify new component renders).

## Rollout

- Feature gated implicitly by code path; no flag required.
- Monitor ops booking edit telemetry for anomalies post-release.
