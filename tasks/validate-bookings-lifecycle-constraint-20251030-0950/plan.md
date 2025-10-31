# Implementation Plan: Validate bookings lifecycle constraint

## Objective

We will enable system maintainers to enforce bookings lifecycle timestamp consistency, centralise customer identity, and guard bookings against operating-hour violations so that reporting and state-dependent logic remain reliable.

## Success Criteria

- [ ] Constraint `bookings_lifecycle_timestamp_consistency` validated on all rows after remediation.
- [ ] `user_profiles` table created, linked from `customers`, and populated so ≥99% of active customers reference a global profile.
- [ ] `create_booking_with_capacity_check` rejects off-hours bookings with `BOOKING_OUTSIDE_OPERATING_HOURS` unless overrides are explicitly allowed.
- [ ] `assign_single_table` / `assign_merged_tables` available and documented; legacy RPCs marked deprecated.
- [ ] Schema comments deployed for ambiguous columns and pending documentation regenerated.

## Architecture & Components

- Ordered SQL migrations executed remotely via Supabase CLI covering lifecycle remediation (20251103090100), global customer DDL (20251103090200), documentation (20251103090300), RPC wrappers (20251103090400), booking-hour enforcement + perms (20251103090500), data backfill (20251103090600), constraint validation (20251103090700), and a future hardening placeholder (20251103090800).
- Backfill relies on `auth.users`, `customers.email_normalized`, and `customers.phone_normalized` to populate `user_profile_id` safely.
- Stored procedure wrappers call `assign_tables_atomic_v2` to preserve transactional guarantees while providing clearer entrypoints.
- Enhanced `create_booking_with_capacity_check` converts requested timestamps to restaurant-local time, honours `service_policy.allow_after_hours`, checks `restaurant_operating_hours`, and only then proceeds to capacity locking.
- Permissions enforce the procedural path by revoking direct `INSERT` from `authenticated` while granting EXECUTE on the updated RPC.
  State: server database | URL state: N/A

## Data Flow & API Contracts

Operations: remote SQL migrations/backfills.
Inputs: `public.bookings`, `public.customers`, `auth.users`, `public.restaurant_operating_hours`, `public.service_policy`.
Outputs: Consistent lifecycle timestamps, populated `user_profile_id` links, hardened booking creation RPC.
Errors: Captured via migration logs and JSON responses (`BOOKING_OUTSIDE_OPERATING_HOURS`, `CAPACITY_EXCEEDED`, downstream `INTERNAL_ERROR`).

## UI/UX States

- N/A (backend-only work). Frontend surfaces should already interpret RPC error payloads.

## Edge Cases

- New bookings inserted between remediation and validation; run audit immediately before `VALIDATE`.
- Customers without email/phone remain unlinked; collision report required before enabling NOT NULL.
- Service policy missing row defaults to `allow_after_hours = false`; ensure this is acceptable or insert baseline policy.
- DST transitions: `make_timestamptz` with restaurant timezone ensures correct local hour comparisons, but verification must cover cross-midnight slots.

## Testing Strategy

- SQL queries to confirm zero lifecycle violations pre/post validation and to count NULL `user_profile_id` rows after backfill.
- Unit/integration tests (or manual QA on staging) for `create_booking_with_capacity_check` covering inside hours, outside hours, explicit closures, DST edges, and allow-after-hours overrides.
- Concurrency checks for `assign_merged_tables` to ensure wrappers do not introduce new deadlocks.
- Re-run audit query, `SELECT convalidated`, and targeted Supabase RPC calls after migrations apply.

## Rollout

- Feature flag: coordinate app changes to call new RPC wrappers before deprecating legacy names.
- Exposure: apply remediation + validation first; deploy DDL/DDL-driven code with app release; enforce permission change last.
- Monitoring: schedule daily guardrail query for lifecycle consistency (future work item) and track booking creation failure rates after enforcement.
- Kill-switch: restore previous function definition + permissions via rollback migration and re-grant direct inserts if critical regressions appear.
