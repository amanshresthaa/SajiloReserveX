# Research: Last seating buffer minimum + remove capacity input

## Requirements

- Functional:
  - Restaurant operators must be able to set `reservationLastSeatingBufferMinutes` to any value ≥ 15 minutes, regardless of the default reservation duration (currently the UI forces buffer ≥ duration).
  - Remove the “Capacity” input from the ops restaurant settings form/dialog so staff can no longer edit that field there; API can keep capacity for other subsystems.
- Non-functional:
  - Preserve existing validation for other fields (interval, duration, contact info, etc.).
  - Keep API schemas consistent (buffer already constrained 15–300 via Zod/server), but ensure client-side validation + helper text match the new rule.
  - Avoid accidental regression for other components (`EditRestaurantDialog` also uses `RestaurantDetailsForm`).

## Existing Patterns & Reuse

- `RestaurantDetailsForm` (`components/ops/restaurants/RestaurantDetailsForm.tsx`) drives both the settings page and the modal editor. It enforces the buffer ≥ duration rule (lines ~167–185) and renders the Capacity field.
- `RestaurantProfileSection` wires the form to ops data (`src/components/features/restaurant-settings/RestaurantProfileSection.tsx`) and currently passes `capacity` through to the update mutation.
- `EditRestaurantDialog` (ops list view) also feeds `capacity` to the form.
- Server-side schemas in `src/app/api/ops/restaurants/schema.ts` already use `DURATION_SCHEMA` (min 15) for both default duration and last seating buffer, so no server change is required for the min check.

## External Resources

- None; everything is in-repo.

## Constraints & Risks

- Removing the capacity field must not break existing TypeScript types or cause uncontrolled input errors in the shared form.
- Ensure help text for the buffer field no longer references the default duration requirement.
- Updating form values/types requires touching both settings view and dialog to keep props aligned.

## Open Questions

- Should we hide capacity everywhere or just ops settings? Instruction says “remove the capacity in the restaurant settings,” so we’ll remove it from `RestaurantDetailsForm`, impacting both surfaces that use this form. If other flows still need capacity editing later, they’ll need a dedicated UI.

## Recommended Direction

- Update `RestaurantDetailsFormValues`, form state, validation, payload sanitizer, and JSX to drop the capacity field entirely.
- Remove the buffer ≥ duration validation branch and refresh helper text to emphasize the simple ≥15 min rule.
- Adjust `RestaurantProfileSection` and `EditRestaurantDialog` to match the new form props and avoid passing capacity to mutations.
- No API/server schema change needed since server already enforces 15–300; just ensure defaults (like empty state) use the new minimum where appropriate (e.g., set fallback buffer to 15 to match expectation instead of 120).
