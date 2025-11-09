# Implementation Checklist

## Setup

- [x] Import the Supabase booking status enum constants/set up helper scaffolding.

## Core

- [x] Add a normalizer that converts raw booking statuses into the typed Supabase union with a fallback.
- [x] Update `markBookingConfirmed` to accept the typed status and use it for `p_history_from`.
- [x] Ensure the caller passes the normalized status without unsafe casts.

## UI/UX

- Not applicable (script change).

## Tests

- [x] Run `pnpm run lint` to make sure TypeScript and linting pass.

## Notes

- Assumptions: Booking statuses coming from Supabase adhere to its enum; fallback to `"pending"` keeps script safe if ever undefined.
- Deviations: None.

## Batched Questions (if any)

- None.
