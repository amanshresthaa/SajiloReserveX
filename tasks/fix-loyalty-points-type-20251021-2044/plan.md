# Implementation Plan: Fix loyalty points type error

## Objective

We will enable the booking creation flow to compile by aligning the loyalty points field with the defined booking schema so that the build succeeds.

## Success Criteria

- [ ] Type checking passes for booking creation without errors.
- [ ] Build succeeds locally (`pnpm run build`).

## Architecture & Components

- `types/supabase.ts`: generated Supabase types. Add `loyalty_points_awarded` to `Row`, `Insert`, and `Update` interfaces for `bookings`.
- `server/bookings.ts`: uses `TablesInsert<\"bookings\">`; no runtime changes expected once types align.

## Data Flow & API Contracts

Endpoint: N/A (server-side function)
Request: Booking payload containing loyalty points data.
Response: Booking record persistence.
Errors: Type mismatches.

## UI/UX States

- Not applicable; no user-facing UI change.

## Edge Cases

- Payload includes explicit loyalty points values (number or undefined).
- Nullability must match DB default (non-null with default 0). Ensure optional in inserts but required in row shape.

## Testing Strategy

- Type check by running `pnpm run build` to ensure the type error is resolved.

## Rollout

- No feature flags required.
