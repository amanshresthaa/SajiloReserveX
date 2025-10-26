# Research: Edit Booking Time Grid

## Existing Patterns & Reuse

- `ScheduleAwareTimestampPicker` manages schedule caches per date and exposes slots to both the inline `TimeSlotGrid` and the `Calendar24Field` suggestions (`src/components/features/booking-state-machine/ScheduleAwareTimestampPicker.tsx:360-660`).
- The picker reuses plan-step utilities (`Calendar24Field`, `TimeSlotGrid`, `hasCapacity`, etc.), so any change must keep those shared behaviours intact.
- React Hook Form integration in `EditBookingDialog` simply passes the picker’s ISO value; the disappearing-grid bug is self-contained within the picker.

## External Resources

- [React Hook Form watch/setValue docs](https://react-hook-form.com/docs/useform/watch) — confirm parent form updates do not necessitate resetting child caches.
- Internal README/previous tasks (`tasks/edit-booking-prefill-time-20251025-1431/*`) reference the same picker and note its dependence on cached schedule state.

## Constraints & Risks

- The picker’s `useEffect` at `ScheduleAwareTimestampPicker.tsx:216-228` aggressively resets cached schedules whenever `initialTime` or `lastCommittedInitial` change. This fires both when a new booking loads *and* when the user picks a new time via the same component.
- Resetting the cache empties `scheduleStateByDate`, setting `activeRecordStatus` back to `'idle'`. Because the active date string doesn’t change, the follow-up `loadSchedule` effect never refetches, leaving `availableSlots` empty and causing the `Calendar24Field` to display “No available times…”.
- We must still clear caches when a different booking or restaurant slug is provided; otherwise stale availability could leak across dialogs.
- Need to avoid flicker/regressions for other consumers (wizard plan step) that expect automatic slot fallback behaviours.

## Open Questions (and answers if resolved)

- Q: Why doesn’t the schedule refetch after internal time changes?  
  A: The cache-reset effect leaves `activeDate` unchanged, so the `useEffect` watching `[activeDate, loadSchedule]` sees no state change and never triggers a new fetch.
- Q: Can we remove the cache-reset effect entirely?  
  A: Possibly, but it currently handles slug/date swaps when loading a different booking, so we’ll refine it with guards instead of deleting outright.
- Q: Do other props rely on `lastCommittedInitial` being reapplied each time?  
  A: No—`commitChange` keeps `lastCommittedRef` aligned, and the value-sync effect (`value` dependency) already mirrors external updates.

## Recommended Direction (with rationale)

- Gate the reset effect so it only clears state when the **booking identity changes** (restaurant slug or base date). Track the previous slug/date pair in a ref; skip the reset when the user merely selects a new time on the same date.
- Preserve the existing reset behaviour for true context switches (e.g., different booking or slug) to avoid stale caches.
- After the guard, retain the existing logic that reinitialises `selectedTime`, `draftTime`, and `scheduleStateByDate` when the context genuinely changes.
