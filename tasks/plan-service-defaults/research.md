# Research: Plan Step service defaults

## Existing logic
- `components/reserve/steps/PlanStep.tsx` defines service availability via `getServiceAvailability` using static windows: lunch (12:00–15:00), dinner (17:00–close), weekday happy hour (15:00–17:00). Drinks stay enabled whenever the venue is open (12:00–23:00). Default service resolution prioritises `drinks` during happy hour, otherwise `lunch`, then `dinner`, then `drinks` as fallback. UI disables toggles by setting `aria-disabled`/`data-disabled` and wraps disabled items with a tooltip. A `Happy Hour` badge and “Kitchen closed 15:00–17:00 on weekdays” alert show when `labels.happyHour` is true.
- `getSlotLabel` controls the sub-label shown in the time picker and relies on the same hard-coded windows (`Lunch`, `Happy Hour`, `Dinner`, `Drinks only`). Slot generation (`generateTimeSlots`) iterates from `RESERVATION_CONFIG.open` (12:00) to `close` (23:00) in 30-minute increments regardless of day.
- When the user selects a date but no time, the effect hooks set the first available slot and immediately resolve the default service (`resolveDefaultService`). Another effect ensures the current `bookingType` stays in sync with service availability, falling back to the first enabled option in `SERVICE_ORDER` (lunch → dinner → drinks).
- `components/reserve/helpers.ts` exposes `bookingHelpers.bookingTypeFromTime(date, time)` and `serviceWindows`, already encoding more nuanced per-day windows (weekend adjustments). `booking-flow/index.tsx` uses `bookingTypeFromTime` when submitting (except when user explicitly chooses drinks), so front-end defaults should align with these helper windows to avoid mismatches.

## Related patterns & constraints
- `SERVICE_ORDER` determines the fallback priority. Currently drinks only becomes default when both lunch and dinner are disabled or when in happy hour (by explicit branch). Aligning new requirements means adjusting availability windows + default resolution without breaking this priority.
- The weekend-specific behaviour requested by the user (no happy hour, lunch until 17:00) differs from today’s weekday-centric logic. `getServiceAvailability`, `resolveDefaultService`, and `getSlotLabel` all need the same day-aware rules to keep UI and analytics consistent.
- Accessibility affordances (focus management, `aria-live` alerts, tooltip warnings) are already wired; we should preserve the existing pattern when changing availability states to stay compliant with MUST/SHOULD guidance.

## Open questions / clarifications
- “Closing” currently equals `RESERVATION_CONFIG.close` (23:00). The requested behaviour references “closing” without specifying a different time, so we assume 23:00 is still correct.
- Instructions imply drinks remain selectable alongside lunch/dinner outside the weekday happy-hour window. We will maintain drinks availability during lunch/dinner windows unless future guidance says otherwise.
