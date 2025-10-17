# Implementation Checklist

## Setup

- [x] Create task scaffolding and capture research/plan artifacts

## Core

- [x] Update `prepareCheckInTransition` to remove legacy completed path and always emit `checked_in`
- [x] Simplify `POST /check-in` route to rely on the updated transition helper (no legacy branch)
- [x] Update `PATCH /status` route to always use transition helpers instead of manual updates
- [x] Review env flag handling to ensure stale `false` values don’t reintroduce invalid paths

## UI/UX

- [x] Confirm no client changes required; document if any follow-up needed

## Tests

- [x] Refresh `tests/server/ops/booking-lifecycle-routes.test.ts` expectations for check-in/status flows
- [x] Run targeted Vitest suite for booking lifecycle routes

## Notes

- Assumptions: Flag can remain for gradual rollout but server logic must be invariant-safe.
- Deviations: None yet.

## Batched Questions (if any)

- None at this time.
