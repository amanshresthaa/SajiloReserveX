# Implementation Checklist

## Setup

- [x] Scaffold Supabase migration adjusting `create_booking_with_capacity_check`.

## Core

- [x] Update function body to use `%TYPE` variables and wrap diagnostics in `details`.
- [x] Ensure `server/capacity/transaction.ts` preserves new `details` payload (no code change or minor tweak).

## UI/UX

- [ ] Not applicable (backend fix only).

## Tests

- [x] Run targeted server/API test suite covering bookings (`pnpm test --filter bookings` or closest equivalent).
- [x] Manually hit `POST /api/bookings` against dev server after applying migration (for verification phase).

## Notes

- Assumptions: Remote Supabase schema lacks `booking_type` enum but column accepts text.
- Deviations: None yet.

## Batched Questions (if any)

- None.
