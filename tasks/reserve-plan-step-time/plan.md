# Implementation Plan

## Goal

Switch the reservation plan step to 15-minute time slots (instead of 30) and render the “Time, occasion & notes” accordion closed by default, while preserving existing UX/accessibility guarantees.

## Assumptions

- Reservation closing time remains 23:00; with 15-minute steps the final selectable slot becomes 22:45 (close time is exclusive). No backend constraints require the old 30-minute cadence.
- Analytics events (`select_time`, etc.) work with arbitrary `HH:MM` inputs, so no downstream changes needed beyond supplying the new values.
- Shadcn accordion supports an initially collapsed state by omitting `defaultValue`; we do not need a fully controlled state.

## Steps

1. **Update tests first (TDD)**
   - `reserve/features/reservations/wizard/services/__tests__/timeSlots.test.ts`: expect 44 slots, last value `22:45`, adjust DST expectations.
   - UI/unit tests referencing half-hour strings (`18:30`, `6:30 PM`, etc.) should shift to quarter-hour equivalents that reflect the new grid default selection (e.g., use `18:15` or `18:45` depending on scenario).
   - Ensure analytics-related tests still assert event payloads with the new times.
2. **Update configuration-driven interval**
   - Change `defaultReservationConfig.opening.intervalMinutes` to `15` in `reserve/shared/config/reservations.ts`.
   - Verify overrides still respect validation (no range change required).
3. **Adjust slot normalization logic**
   - `usePlanStepForm.ts`: replace `normalizeHalfHour` with a quarter-hour implementation (`normalizeToInterval`), using `Math.floor(totalMinutes / 15) * 15` and clamping at `23 * 60 + 45`.
   - Keep helper flexible by deriving interval from config if possible, or define a constant to avoid magic numbers.
4. **Align time input UX**
   - `Calendar24Field.tsx`: switch `step` attribute to `900` to match 15-minute increments.
   - Optionally add a constant (e.g., `TIME_INPUT_STEP_SECONDS`) shared with plan hook for clarity.
5. **Accordion default closed**
   - Remove/adjust `defaultValue` on the `<Accordion>` within `PlanStepForm.tsx` so it renders collapsed initially while remaining keyboard navigable.
6. **Refine related utilities/components if needed**
   - Ensure `TimeSlotGrid` still renders badges correctly with larger slot count (no code change expected).
   - Double-check that datalist continues to show correct option count text after slot change.
7. **Verification**
   - Run relevant unit/integration tests (`vitest` suite covering time slots, plan step analytics).
   - Manually spot-check (if feasible) that typing e.g., `12:07` rounds down to `12:00` and the accordion summary remains visible when collapsed.

## Open Questions

1. Confirm 22:45 as latest selectable time is acceptable. If not, adjust close time or allow inclusive end.
