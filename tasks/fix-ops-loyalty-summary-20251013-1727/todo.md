# Implementation Checklist

## Setup

- [x] Create task folder and stub artifacts

## Core

- [x] Add shared helper to load loyalty point totals for a set of customers
- [x] Refactor `getTodayBookingsSummary` to use helper
- [x] Refactor `getTodayVIPs` to use helper and remove invalid join

## Tests

- [x] `pnpm run build`
- [ ] Hit `/api/ops/dashboard/summary` locally to confirm 200 response (manual)

## Notes

- Assumptions: Daily bookings volume keeps additional query overhead minimal.
- Deviations: Manual summary endpoint check still pending because we need an authenticated session token.

## Batched Questions (if any)

- None
