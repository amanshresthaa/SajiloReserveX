# Research: Calendar Component Reuse

## Existing Patterns & Reuse

- `components/ui/calendar.tsx` is the shared calendar primitive; `reserve/shared/ui/calendar.tsx` simply re-exports it for the reservation wizard scope.
- The "create plan" step (`reserve/features/reservations/wizard/ui/steps/plan-step/PlanStepForm.tsx`) renders `Calendar24Field`, which imports `Calendar` from `@shared/ui/calendar` (the shared primitive).
- The edit dialog on `/my-bookings` (`components/dashboard/EditBookingDialog.tsx`) conditionally renders:
  - `ScheduleAwareTimestampPicker` when the `editScheduleParity` feature flag is enabled. This picker composes `Calendar24Field` from the plan step components.
  - `TimestampPicker` otherwise, which embeds the shared `Calendar` primitive directly.

## External Resources

- Internal code references only.

## Constraints & Risks

- Feature flag `env.featureFlags.editScheduleParity` determines whether the edit flow uses the same composed calendar as the plan step.
- Without the flag, the edit dialog still uses the same underlying `Calendar` primitive but not the full plan-step wrapper (`Calendar24Field`), so parity behaviors may differ.

## Open Questions (and answers if resolved)

- Q: Are the calendar components on `/my-bookings` and `/reserve/r/[slug]` shared?
  A: Yes, when `editScheduleParity` is enabled both use `Calendar24Field`; otherwise they both draw from the shared `Calendar` primitive but through different wrappers.

## Recommended Direction (with rationale)

- Remove the feature-flag dependency so the edit dialog always uses `ScheduleAwareTimestampPicker`, guaranteeing parity with the reservation plan step.
- Harden the fallback path (`TimestampPicker`) for edge cases with missing schedule data by enforcing the same minimum date and surfacing contextual validation errors.
- Expand client-side error messaging in `EditBookingDialog` to translate booking validation codes (e.g., `CLOSED_DATE`, `OUTSIDE_HOURS`, `CAPACITY_EXCEEDED`) into user-friendly copy consistent with the plan step UX.
