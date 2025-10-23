# Research: Fix missing reservation buffer in Edit Dialog

## Existing Patterns & Reuse

- `components/ops/restaurants/RestaurantDetailsForm.tsx` defines the `RestaurantDetailsFormValues` type and expects `reservationLastSeatingBufferMinutes` alongside the other reservation timing fields.
- `src/components/features/restaurant-settings/RestaurantProfileSection.tsx` demonstrates how to pass the full set of required form values, including the last seating buffer.

## External Resources

- N/A

## Constraints & Risks

- All required fields must be supplied to the form to avoid runtime/TypeScript errors.
- Inconsistent initial values could cause the dialog to drop the buffer configuration when editing, leading to incorrect updates.

## Open Questions (and answers if resolved)

- Q: Is `reservationLastSeatingBufferMinutes` guaranteed on `RestaurantDTO`?
  A: The field is read in `RestaurantProfileSection`, implying it is part of the DTO returned by ops endpoints. We'll mirror that usage.

## Recommended Direction (with rationale)

- Update `EditRestaurantDialog` to include `reservationLastSeatingBufferMinutes` when building `initialValues`, reusing the same pattern as `RestaurantProfileSection`. This satisfies the type contract and prevents data loss on edit.
