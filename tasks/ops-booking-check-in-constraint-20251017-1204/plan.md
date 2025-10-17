# Implementation Plan: Ops Booking Check-In Constraint

## Objective

Ensure ops booking lifecycle transitions comply with the new database constraint so staff can check guests in without triggering 500 errors.

## Success Criteria

- [ ] `POST /api/ops/bookings/:id/check-in` succeeds and persists `checked_in` status + timestamp irrespective of `FEATURE_OPS_BOOKING_LIFECYCLE_V2`.
- [ ] Legacy status updates routed through `PATCH /api/ops/bookings/:id/status` never violate the `bookings_lifecycle_timestamp_consistency` constraint.
- [ ] Updated server tests cover the enforced behaviour (checked-in status, timestamp expectations).

## Architecture & Components

- `server/ops/booking-lifecycle/actions.ts`: adjust `prepareCheckInTransition` to always issue `checked_in` status (remove legacy `completed` path) while keeping metadata/history consistent.
- `src/app/api/ops/bookings/[id]/check-in/route.ts`: remove the conditional `useCheckedInStatus` flag and rely on updated transition helper.
- `src/app/api/ops/bookings/[id]/status/route.ts`: drop manual update fallback; funnel both status changes (completed/no-show) through transition helpers to respect invariants.
- Consider updating `env.featureFlags.bookingLifecycleV2` default handling only if the flag remains but ensure code is resilient even when false.

## Data Flow & API Contracts

Endpoint: `POST /api/ops/bookings/:id/check-in`  
Request: `{ performedAt?: string }`  
Response: `{ status: "checked_in", checkedInAt: string, checkedOutAt: null }`

Endpoint: `PATCH /api/ops/bookings/:id/status`  
Request: `{ status: "completed" | "no_show" }`  
Response: `{ status: "checked_in" | "completed" | "no_show" }`

Errors: existing structure remains (`{ error: string }`, optional conflict details).

## UI/UX States

- No direct UI changes expected; ensure downstream consumers still receive `checked_in` status (current components already handle it).

## Edge Cases

- Booking already `checked_in`: transition should no-op gracefully.
- Booking already `completed`: check-in should be rejected as today.
- No-show reversal paths continue to function (they already require lifecycle v2; unaffected but regression test via suite).
- Back-to-back requests with custom `performedAt` timestamps should still reject future timestamps and maintain chronology.

## Testing Strategy

- Unit/Integration: update and run `tests/server/ops/booking-lifecycle-routes.test.ts`.
- Consider targeted unit coverage for `prepareCheckInTransition` if adjustments are complex (existing tests may suffice).
- Manual API smoke via existing test suite; no UI QA required (no UI change surfaced).

## Rollout

- Feature flag: treat `FEATURE_OPS_BOOKING_LIFECYCLE_V2` as effectively enabled (code path no longer diverges).
- Exposure: deploy normally once tests pass.
- Monitoring: watch logs for `[ops][booking-check-in]` / constraint failures post-deploy; ensure Supabase errors disappear.
