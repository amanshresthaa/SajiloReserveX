# Implementation Plan: Edit Booking Time Reset

## Objective

We will ensure editing a booking forces the customer to reselect a time whenever they change the date so that the dialog never shows a mismatched date/time or allows saving stale reservations.

## Success Criteria

- [ ] Selecting a different date immediately clears the visible time, disables the save button, and removes the derived end timestamp until a new slot is chosen.
- [ ] Dates with no availability keep the form invalid and message the user without resurrecting the previous time.

## Architecture & Components

- `components/dashboard/EditBookingDialog.tsx`: introduce a `handleDateChange` callback that clears the `start` field via `setValue` and resets any derived/transient flags. Pass this callback to the picker through a new prop.
- `src/components/features/booking-state-machine/ScheduleAwareTimestampPicker.tsx`: add optional `onDateChange` prop, call it inside `handleDateSelect` whenever the active day changes, and ensure the callback receives the date ISO string (or `null`) for potential future reuse.
- Keep existing exports in `index.ts` intact; only the picker file requires signature updates, including TypeScript type definition.

## Data Flow & API Contracts

- The picker continues to expose `value` (ISO string) and `onChange`. On a date change, it will now also invoke `onDateChange?.(nextDate ?? null)` before/after clearing internal time state.
- The dialog's handler will call `setValue('start', '', { shouldValidate: true, shouldDirty: true })` and optionally clear helper flags (`hasCommittedStart` already rederived via watch). No server/API contracts change.

## UI/UX States

- Loading slots behaves as today; new date resets the time input to placeholder (`--:--` inside `Calendar24Field`) and the end-time display returns to “Select a start time…”.
- If the newly selected date is closed or has no slots, the informational banner persists and the form remains disabled until the user picks a valid date/time combo.
- When the user picks a time, the previous state fully restores (time label, derived end, save button enabled).

## Edge Cases

- Switching between dates quickly should not reapply stale time due to asynchronous schedule fetches; verify that `selectionModeRef` and the new handler remain in sync.
- Navigating back to the original date should still show its time once the user deliberately selects it again.
- Verify that clearing the date (if possible) or selecting the same date doesn’t double-trigger the handler.

## Testing Strategy

- Manual QA via Chrome DevTools MCP: exercise date change, unavailable date, rapid toggling, and save flow per backlog.
- Automated regression: run existing lint/tests (`npm test`/`npm run lint` as applicable) to ensure no TypeScript failures. Add targeted unit tests only if existing suite covers picker events; otherwise rely on integration behavior plus manual QA.
- Verify default booking edit flow (change time only) still works without triggering `handleDateChange`.

## Rollout

- No feature flags; change ships immediately. Monitor booking edit analytics (existing event) for anomalies after deployment.
