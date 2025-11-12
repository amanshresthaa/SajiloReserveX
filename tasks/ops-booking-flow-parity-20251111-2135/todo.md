# Implementation Checklist

## Setup

- [x] Capture restaurant contact info within `/api/ops/bookings` (shared helpers for legacy + unified paths).

## Core

- [x] Update legacy creation path to store bookings as `pending` and use restaurant email fallback when guest email is blank.
- [x] Mirror the fallback behavior inside `handleUnifiedWalkInCreate`.
- [x] Ensure customer identity (upsert + history lookups) still rely on the synthetic fallback.

## Tests

- [x] Update `tests/server/ops/bookings-route.test.ts` to cover pending status + email fallback and keep existing cases passing.

## Notes

- Assumptions: restaurant phone fallback not required; emails should default to restaurant only when guest email missing.
- Deviations: none yet.
