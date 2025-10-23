# Implementation Plan: Fix missing reservation buffer in Edit Dialog

## Objective

We will enable restaurant editors to preserve the reservation buffer configuration in the edit dialog so that the form reflects the full restaurant data shape.

## Success Criteria

- [ ] Build succeeds without TypeScript errors
- [ ] Edit dialog initializes all required form fields

## Architecture & Components

- `components/ops/restaurants/EditRestaurantDialog.tsx` builds the `initialValues` object; we'll extend it to pass the missing buffer value sourced from the incoming `restaurant`.

## Data Flow & API Contracts

Endpoint: Ops restaurant update mutation already defined; no changes needed.
Request: `UpdateRestaurantInput` includes `reservationLastSeatingBufferMinutes`.
Response: Unchanged.
Errors: Existing mutation handles presentation of errors.

## UI/UX States

- Loading: Unchanged.
- Empty: Unchanged.
- Error: Unchanged.
- Success: Unchanged.

## Edge Cases

- Ensure the buffer is present even if null/undefined in the DTO (assume API always returns a number like other required fields).

## Testing Strategy

- Unit: Rely on TypeScript compile-time checks (no runtime logic change).
- Integration: Optional manual QA if editing flows are critical.
- E2E: Not required for this data shaping fix.
- Accessibility: No impact.

## Rollout

- No rollout steps; include change in next build.
