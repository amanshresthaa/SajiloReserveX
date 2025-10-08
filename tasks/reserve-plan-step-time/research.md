# Research Summary

- `reserve/features/reservations/wizard/hooks/usePlanStepForm.ts`: `normalizeHalfHour` clamps any typed time to 30-minute increments and the form submission/reset logic expects half-hour slots. Changing the interval requires updating this normalization function and any place where 30-minute math is hard-coded (e.g., totals capped at `23 * 60 + 30`).
- `reserve/shared/config/reservations.ts`: The default reservation configuration exposes `opening.intervalMinutes`, currently `30`. This value feeds `buildTimeSlots`, so setting it to `15` (and handling overrides) controls slot generation granularity.
- `reserve/features/reservations/wizard/services/timeSlots.ts`: Uses `slotsForRange` with the configurable interval to build the list shown in the grid and the datalist. Tests in `__tests__/timeSlots.test.ts` assert there are 22 slots ending at `22:30`, so they will need updates for 15-minute steps.
- `reserve/features/reservations/wizard/ui/steps/plan-step/components/Calendar24Field.tsx`: The native `<input type="time">` uses `step="1800"` (30 minutes). Needs to become `900` for quarter-hour increments. Datalist renders whatever slots are provided; no other hard-coded interval logic.
- `reserve/features/reservations/wizard/ui/steps/plan-step/PlanStepForm.tsx`: Accordion is opened by default via `defaultValue="details"`. Removing or making this prop conditional will collapse it initially while maintaining keyboard accessibility (single, collapsible accordion from our shared Shadcn-based component).
- Tests & stories reference specific half-hour labels (e.g., `'18:30'`, `'6:30 PM'`, expected counts). These must align with new 15-minute slots to keep analytics and UI tests valid.

Open questions:

1. Should we cap the latest bookable time at `22:45` (exclusive of close) or adjust closing time semantics?
2. Any analytics/business rules tied specifically to half-hour intervals that we should keep?
