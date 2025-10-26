# Research: Rebuild Edit Booking Picker

## Existing Patterns & Reuse

- `components/dashboard/EditBookingDialog.tsx` drives the edit form for both guest (`/my-bookings`) and ops dashboards. It uses React Hook Form with a `Controller` whose `defaultValues.start` is taken from `booking.startIso` and passes it to `ScheduleAwareTimestampPicker`.
- `ScheduleAwareTimestampPicker` (`src/components/features/booking-state-machine/ScheduleAwareTimestampPicker.tsx`) is the shared calendar + time picker. It fetches availability via `fetchReservationSchedule`, renders the plan-step `Calendar24Field`, and exposes the chosen ISO timestamp through `onChange`.
- The reservation wizard (`reserve/features/reservations/wizard/ui/steps/plan-step/PlanStepForm.tsx`) achieves similar behaviour with `usePlanStepForm`, managing availability state, disabled dates, and selected slots—this is the canonical “expected behaviour” we should mirror.
- Unit coverage already exists for the dialog (`reserve/tests/unit/EditBookingDialog.test.tsx`) and the picker (`reserve/tests/features/booking-state-machine/ScheduleAwareTimestampPicker.test.tsx`), though they mainly assert submission/wiring rather than interactive parity with the wizard.

## External Resources

- No external APIs beyond existing scheduling services. Availability, slot descriptors, and calendar primitives all live inside the repo (`@reserve/shared/*`, `@reserve/features/reservations/wizard/services/*`).

## Constraints & Risks

- The picker is reused by guest, ops, and reservation detail flows; any rewrite must preserve API compatibility or provide a migration layer so other consumers continue to work.
- Booking data comes back as UTC ISO strings (`startIso`, `endIso`) plus restaurant timezone/slug. Conversions must respect the venue timezone just like the plan step, otherwise we’ll introduce off-by-one-hour bugs around DST.
- Availability fetches happen through TanStack Query; we should keep cache keys consistent (`scheduleQueryKey`) to benefit from existing caching/prefetching.
- UI must remain accessible (keyboardable calendar + time input, ARIA labelling) and mobile-friendly. We can’t regress the existing behaviour of `Calendar24Field`.
- Rebuilding “from scratch” cannot break ops tooling—ops staff expect to edit bookings even if the slug/timezone is passed separately.
- The current implementation uses `useMemo` with a `Ref` (`scheduleCacheRef`) to derive `unavailabilityReason`; because refs don’t trigger recompute, the picker keeps reporting `'unknown'` (truthy) after the initial fetch. This freezes the time selector until a new date is chosen—the exact user-reported bug we must avoid when rewriting.
- New feedback highlights additional UX gaps we must solve: the “scroll to load month” instruction should never appear during edits because we already know the target date; the time grid must auto-scroll/highlight the saved slot; loading states need to remain consistent; and the derived end-time should surface its duration to explain why it’s locked.

## Open Questions (and answers if resolved)

- Q: Should editing honour the stored time even if the slot is no longer available (e.g., show warning but keep selection) or should it force users onto the next available slot?
  A: _Pending confirmation from product/user—current implementation auto-falls back to the first enabled slot when the saved time is unavailable._
- Q: Do we allow editing past bookings (e.g., to fix metadata), and if so should the picker unlock past dates/times?
  A: _Need clarification; today `minDate` is clamped to “today” so past edits are blocked._
- Q: Is parity with the reservation wizard required (same disabled-date messaging, slot grouping, occasion handling etc.) or is a leaner edit-specific experience acceptable?
  A: _Awaiting guidance—user feedback hints that expectations align with the wizard (date/time active immediately)._ 
- Q: Should the time grid auto-scroll to the selected slot on open even if it’s off screen?
  A: Yes—per latest UX feedback we should ensure the slot is visible without manual scrolling.
- Q: Should the end-time duration label be dynamic if underlying schedule data implies a different default length?
  A: We’ll expose whichever `fallbackDurationMinutes` we compute and surface it in the UI copy.

## Recommended Direction (with rationale)

- Replace the bespoke state machine in `ScheduleAwareTimestampPicker` with a dedicated hook (or reuse `usePlanStepForm` pieces) that tracks availability, disabled dates, and selection using state rather than refs. This eliminates the current stale `unavailabilityReason` bug that keeps time controls disabled until the user re-picks a date.
- Initialise picker state from the provided ISO value (date + time) and immediately load the matching schedule, mirroring how the plan step hydrates from existing draft state.
- Ensure unavailability status reacts to schedule fetch completion (currently blocked because it reads from a ref without triggering re-computation). The rebuild should drive this through explicit state so the time grid activates as soon as data arrives.
- Provide clear pathways for: prefetching adjacent dates, validating manual time entry, and surfacing warnings when the stored slot is no longer valid—all with unit coverage and, ideally, shared utilities with the wizard to avoid future drift.
