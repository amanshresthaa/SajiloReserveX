# Implementation Checklist

## Setup

- [x] Add shared party-size limit constants under `lib/bookings`.

## Core

- [x] Apply constants to `EditBookingDialog` schema/input.
- [x] Enforce same limit inside `dashboardUpdateSchema`.
- [x] Update wizard schema + handlers to reuse the constant.

## UI/UX

- [x] Confirm inline error copy appears for values > 12.

## Tests

- [x] Extend `reserve/tests/unit/EditBookingDialog.test.tsx` for the ceiling behavior.
- [x] Run `pnpm lint`.

## Notes

- Assumptions: limit stays 12 for all customer-facing flows.
- Deviations: none currently.

## Batched Questions (if any)

- N/A
