# Implementation Plan: Lunch Overrun Policy

## Objective

We will allow lunch bookings that start before 15:00 to be treated as lunch without clamping to service end.

## Success Criteria

- [ ] Lunch bookings near 15:00 no longer trigger overrun errors
- [ ] Dinner/drinks behavior unchanged (still clamps/throws when appropriate)

## Architecture & Components

- Modify `server/capacity/tables.ts#computeBookingWindow` to skip service-end clamping for `service === 'lunch'`.
- No DB or API contract changes.

## Data Flow & API Contracts

- Unchanged. Window computation now returns a `block.end` that may exceed lunch end for lunch-only.

## UI/UX States

- No UI changes. Availability widgets may still filter by service periods as before.

## Edge Cases

- Very late lunch starts (e.g., 14:59) should succeed without error.
- Dinner remains clamped and can still throw when impossible.

## Testing Strategy

- Typecheck build.
- Run ops unit tests; ensure dinner clamping expectations still pass.

## Rollout

- Feature flag not required; simple policy update.
