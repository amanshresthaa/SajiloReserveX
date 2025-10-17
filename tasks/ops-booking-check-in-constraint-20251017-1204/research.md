# Research: Ops Booking Check-In Constraint

## Existing Patterns & Reuse

- `src/app/api/ops/bookings/[id]/check-in/route.ts` performs lifecycle transitions via `prepareCheckInTransition` and the `apply_booking_state_transition` RPC. This should remain the orchestration layer.
- `server/ops/booking-lifecycle/actions.ts` encapsulates all transition rules; updating logic here keeps behaviour consistent across HTTP routes and background jobs.
- `config/booking-state-machine.ts` already lists `checked_in` as an intermediate status between `confirmed` and `completed`; UI components such as `BookingActionButton` rely on this transition map.
- Tests under `tests/server/ops/booking-lifecycle-routes.test.ts` cover the lifecycle routes and need to be updated alongside any behavioural changes.

## External Resources

- [Migration `20251016232000_booking_lifecycle_enhancements.sql`](supabase/migrations/20251016232000_booking_lifecycle_enhancements.sql) introduces the `bookings_lifecycle_timestamp_consistency` constraint that now rejects `completed` bookings without both timestamps.
- [Migration `20251016230000_booking_lifecycle_state_machine.sql`](supabase/migrations/20251016230000_booking_lifecycle_state_machine.sql) adds the `apply_booking_state_transition` helper ensuring atomic updates + history logging.

## Constraints & Risks

- The new database constraint enforces that `completed` rows must have both `checked_in_at` and `checked_out_at`. Legacy server logic (when `FEATURE_OPS_BOOKING_LIFECYCLE_V2` is false) only populates `checked_in_at`, causing 500s.
- Simply setting `checked_out_at` during check-in would block later check-out calls because transition logic skips updates when a value already exists.
- Feature-flagged fallbacks also exist in `status/route.ts`; they update records directly and would hit the same constraint once `completed` is written without a checkout timestamp.
- Any change must keep the history RPC payloads coherent (status + timestamps + metadata) to preserve audits.

## Open Questions (and answers if resolved)

- Q: Can we continue supporting the legacy “completed on check-in” flow after the constraint?
  A: Not safely. Doing so either violates the constraint or prevents subsequent check-outs. We should migrate the behaviour to always use the `checked_in` status.
- Q: Do client components understand a `checked_in` status even when the flag is “disabled”?
  A: Yes—`OpsBookingStatus` already includes `checked_in`, and UI state machines expect the transition sequence confirmed → checked_in → completed.

## Recommended Direction (with rationale)

- Treat the lifecycle v2 flow as baseline: force `prepareCheckInTransition` to write `checked_in` status and defer `completed` to the check-out flow. Ensure HTTP routes always take this path regardless of the environment flag.
- Update legacy fallback code paths (`check-in` and `status` routes) to reuse the shared transition helpers instead of manual `update` calls so database invariants are respected.
- Adjust server tests to reflect the new default behaviour and verify that transitions never emit invalid timestamp combinations.
