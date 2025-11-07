# Implementation Checklist

## Setup

- [x] Confirm current inline timeout source (`src/app/api/bookings/route.ts`).
- [x] Locate env feature-flag structure for booking-related config.

## Core

- [x] Add configurable timeout helper in env (default 12 s, clamp at [1000, 20000]).
- [x] Update inline auto-assign block to use helper + log actual duration.
- [x] Ensure telemetry/observability captures new duration field.
- [x] Add attempt-level quote/confirm telemetry + structured logs for diagnostics.

## UI/UX

- [ ] N/A (API-only change).

## Tests

- [x] pnpm lint

## Notes

- Assumptions: Acceptable to extend request latency until better async flow shipped; env already loaded at server runtime.
- Deviations: Skipping unit tests due to lack of harness; relying on lint/TS.

## Batched Questions (if any)

- None.
