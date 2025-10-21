# Implementation Plan: Booking Validation Update

## Objective

We will fix the unified booking validation integration so that the build succeeds and bookings leverage the new validation flow when enabled.

## Success Criteria

- [ ] `next build` completes without syntax errors.
- [ ] Unified validation toggle preserves existing behavior when disabled.

## Architecture & Components

- `src/app/api/bookings/[id]/route.ts`: ensure conditional validation block compiles and uses existing helper utilities.
  State: server-side request handling | Routing/URL state: n/a

## Data Flow & API Contracts

Endpoint: GET/PUT `api/bookings/[id]`
Request: `PUT` payload with booking update fields
Response: updated booking record or validation errors
Errors: `BookingValidationError` mapped through `mapValidationFailure`

## UI/UX States

- Not applicable (server API route)

## Edge Cases

- Feature flag disabled path must still update bookings via legacy helper.
- Validation errors must return proper headers via `withValidationHeaders`.

## Testing Strategy

- Manual: run `pnpm run build`.
- Automated: rely on existing tests (if any) for API behavior.

## Rollout

- No feature flag changes; confirm `bookingValidationUnified` gating works as expected.
