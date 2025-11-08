# Research: Pick-a-time service-period defaults

## Requirements

- Functional:
  - Default the "Occasion" selection in the reservation wizard to the meal service (lunch/drinks/dinner) that owns the selected time slot.
  - Respect historical behavior: 12:00–15:00 ➝ lunch, 15:00–17:00 ➝ drinks, 17:00–22:00 (or close) ➝ dinner, with meal windows overriding the all-day drinks window.
  - Ensure the "Pick a time" grid mirrors the service period labeling so guests immediately see which service applies.
- Non-functional:
  - Preserve accessibility and existing grouping/labeling in `TimeSlotGrid` (`reserve/features/reservations/wizard/ui/steps/plan-step/components/TimeSlotGrid.tsx`).
  - Keep the logic centralized so future service-period edits only require DB data changes (no per-component overrides).
  - Follow SDLC artifacts + Supabase-remote-only policy; verify with lint/tests before completion.

## Existing Patterns & Reuse

- `usePlanStepForm` already auto-selects a booking type by calling `inferBookingOption` when a user picks or is assigned a time (`reserve/features/reservations/wizard/hooks/usePlanStepForm.ts`, lines ~555–620).
- `inferBookingOption` in `useTimeSlots` delegates to `defaultBookingOption` on each slot, falling back to the first available booking option (`reserve/features/reservations/wizard/services/useTimeSlots.ts`).
- Slot metadata comes from `server/restaurants/schedule.ts`, where `computeSlots` picks a `bookingOption` based on the first `restaurant_service_periods` row that covers the time. Overlapping periods (e.g., "Weekday Drinks" 12:00–22:00 vs "Weekday Lunch" 12:00–15:00) compete, but the current function simply returns the first match, so drinks can win even when lunch should override.
- Service-period data (and therefore desired behavior) lives in Supabase: see `supabase/seeds/white-horse-service-periods.sql` and `supabase/utilities/init-seeds-waterbeach.sql` for the canonical ranges.

## External Resources

- Supabase CLI/SQL seeds (`supabase/utilities/init-seeds-waterbeach.sql`) enumerate the lunch/drinks/dinner windows. We'll lean on these ranges (and confirm remotely if needed) so logic stays data-driven.
- `DoneList.md` line ~1085 notes that customer-facing widgets rely on service periods—use this as acceptance context that slot → service mapping is intentional.

## Constraints & Risks

- Overlapping service periods are valid and may include future occasions beyond lunch/drinks/dinner; logic must prioritize deterministic ownership without hardcoding single restaurant IDs.
- Supabase is remote-only: no local DB writes. Any data verification via Supabase CLI must target the configured remote project and avoid leaking secrets.
- Changes must preserve existing availability labels (`happyHour`, `drinksOnly`, etc.) so UI badges stay accurate.
- Regression risk: incorrectly prioritizing could disable drinks-only slots (15:00–17:00) or mislabel kitchen-closed windows.

## Open Questions (owner, due)

- Q: Are there any occasions besides lunch/drinks/dinner that overlap (e.g., brunch, private dining) needing explicit priority? (Owner: TBD, due when additional data appears.)
  A: Not documented yet; solution should gracefully fall back to catalog ordering if unknown keys overlap.

## Recommended Direction (with rationale)

- Update `server/restaurants/schedule.ts` so `computeSlots` evaluates _all_ service periods covering a slot, then picks the most specific one using priority rules:
  1. Prefer day-specific periods over all-days.
  2. Prefer shorter durations (i.e., overrides like lunch/dinner) over long "drinks" spans.
  3. Allow a final tie-breaker via catalog ordering (so future occasions can define precedence without code changes).
- Keep `defaultBookingOption` in sync with the resolved period. `inferBookingOption` will then return lunch/dinner when appropriate, ensuring the Occasion picker defaults correctly without extra UI state.
- Validate via unit tests for `getRestaurantSchedule` to cover overlapping periods, and via wizard hook tests (if needed) to confirm the booking type follows the slot.
- Run lint/tests plus (if credentials exist) a Supabase CLI query (`supabase db remote commit` or a `psql` script) to double-check service-period data matches assumptions.
