# Research: Edit Booking Time Reset

## Existing Patterns & Reuse

- `components/dashboard/EditBookingDialog.tsx` uses `react-hook-form` with a controlled `start` field and a derived end-time memo (`EditBookingDialog.tsx:48-205`). The save button currently rechecks `isDirty` and `hasCommittedStart` before enabling (`EditBookingDialog.tsx:265-279`).
- `ScheduleAwareTimestampPicker` already resets its internal `selectedTime`/`draftTime` when the date changes and calls `onChange(null)` via `commitChange` (`src/components/features/booking-state-machine/ScheduleAwareTimestampPicker.tsx:180-441`).
- The picker is the shared availability component used elsewhere in the reservation flow (`src/components/features/booking-state-machine/index.ts`), so changes must remain backwards compatible.

## External Resources

- [react-hook-form `setValue` docs](https://react-hook-form.com/docs/useform/setvalue) – confirms `setValue` accepts `shouldValidate` and `shouldDirty` flags, which we will rely on to mark the form invalid when clearing the start time.
- [react-hook-form `resetField` docs](https://react-hook-form.com/docs/useform/resetfield) – secondary reference in case resetting is preferable for future iterations.

## Constraints & Risks

- `ScheduleAwareTimestampPicker` currently has no explicit date-change hook; adding one must not trigger unnecessary re-renders for other consumers.
- The picker auto-prefills a slot when `selectionModeRef` is not `'user-change'`. Clearing the value from the dialog must not fight this behavior or cause a race where the picker immediately rehydrates an old time.
- `EditBookingDialog` recomputes derived end time from the `start` value. If we mis-sequence the new handler, the memo could compute from stale state, causing `derivedEndIso` to stick around.
- Need to ensure the form stays dirty after clearing the start time so the user can save once they pick a new slot; relying solely on the Controller may not flag `isDirty`.

## Open Questions (and answers if resolved)

- Q: Does the picker already emit `onChange(null)` on date change, and if so why does the form keep stale time?  
  A: Yes (`ScheduleAwareTimestampPicker.tsx:423-439`), but `Controller` receives the ISO string before the date change completes; without explicitly clearing via `setValue`, `react-hook-form` may keep the last committed ISO until a new slot is chosen.
- Q: Will calling `setValue('start','', { shouldValidate: true, shouldDirty: true })` conflict with the picker's own `onChange` calls?  
  A: No. The picker emits `null` first, so the handler will run after the date event; once the user picks a time the normal `onChange` path restores a valid ISO.
- Q: Should we instead call `resetField('start')`?  
  A: `resetField` would also clear errors but would revert to the default value unless a new default is passed. Using `setValue` keeps the field empty without changing defaults and better matches the acceptance criteria.

## Recommended Direction (with rationale)

- Extend `ScheduleAwareTimestampPicker` with an optional `onDateChange?: (value: string | null) => void` prop that fires whenever the date (not time) portion changes. This keeps the component flexible and avoids coupling to `react-hook-form`.
- In `EditBookingDialog`, implement a handler that calls `setValue('start', '', { shouldValidate: true, shouldDirty: true })`, clears any derived end state implicitly, and optionally tracks analytics if needed. Pass this handler to the picker.
- Verify the save button logic reacts as expected by toggling `isDirty` and `hasCommittedStart`; confirm `derivedEndIso` becomes `null` and the end-time display resets.
- Add manual QA steps to ensure dates with no slots still surface gracefully and the time placeholder renders as `--:--`/empty until the user picks a slot.
