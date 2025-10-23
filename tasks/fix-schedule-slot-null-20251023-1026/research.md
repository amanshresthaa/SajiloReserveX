# Research: Fix schedule slot nulls in restaurant schedule

## Existing Patterns & Reuse

- `server/restaurants/schedule.ts` already exposes helper functions (`pickBookingOption`, `buildAvailability`) and expects `computeSlots` to produce `RestaurantScheduleSlot[]`.
- Current implementation maps over `baseSlots` and returns `null` for slots past closing time, then filters with a type guard to strip nulls.
- Other schedule builders (e.g., reservation wizard services) perform similar filtering but often accumulate into arrays without intermediate `null` values.

## External Resources

- N/A (implementation is self-contained).

## Constraints & Risks

- Typescript strictness now rejects the intermediate `(RestaurantScheduleSlot | null)[]`, so we must restructure logic to avoid null returns altogether.
- We must keep business rules (closing guard with `lastSeatingBufferMinutes` vs default duration) intact to prevent regressions.
- Schedule output underpins multiple client surfaces; we need to confirm tests around booking slots still pass.

## Open Questions (and answers if resolved)

- Q: Is it acceptable to skip slots past closing without emitting placeholders?
  A: Yes—current logic already filters nulls, so we can simply not push those slots.

## Recommended Direction (with rationale)

- Replace the `.map(...).filter(...)` chain with a single `.reduce` (or similar) that only pushes valid slots, ensuring the returned array is typed `RestaurantScheduleSlot[]` without null intermediates.
- Update/extend existing schedule tests (`tests/server/restaurants/schedule.test.ts`) to confirm guard behavior.
