# Research: Booking Logic Fixes

## Requirements

- Functional:
  - Address documented critical, soft, data-integrity, and performance issues in table assignment and booking flows (docs/Critical Logic Issues).
  - Ensure fixes preserve backwards compatibility where necessary and document behaviour changes.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Concurrency safety (race conditions, transactional integrity).
  - System scalability (lock granularity, enumeration limits).
  - Observability/logging for debugging conflicts.
  - Maintain database integrity (FKs, constraints) without exposing secrets.

## Existing Patterns & Reuse

- `supabase/migrations/20251031162000_drop_table_adjacency_symmetry.sql` already removed automatic mirror trigger; adjacency queries governed by feature flag in `server/capacity/tables.ts:1470` (`isAdjacencyQueryUndirected`).
- `assign_tables_atomic_v2` (supabase/migrations/20251027211000_assign_tables_atomic_v2_undirected.sql:38-420) enforces same-zone + mobility checks only within a single call; separate allocations per table recorded in `public.allocations`.
- Hold enforcement toggled via GUC `app.holds.strict_conflicts.enabled` and triggers in `supabase/migrations/20251029183500_hold_windows_and_availability.sql` with application-level recheck at `assign_tables_atomic_v2` lines 170-214.
- Capacity guard implemented in `create_booking_with_capacity_check` (`supabase/migrations/20251103090500_enforce_booking_hours.sql:8-220`), but no reassessment after assignments.
- Idempotency state tracked in `booking_assignment_idempotency` table; uniqueness scoped to `(booking_id, idempotency_key)` with stored `table_ids` snapshot (`assign_tables_atomic_v2` lines 248-287).
- Turn duration & buffer computed in `server/capacity/tables.ts:360-410`; currently throws `ServiceOverrunError` when `blockEnd > serviceEndBoundary`.
- Lookahead penalties implemented in `server/capacity/selector/score.ts` (search confirms `applyLookaheadPenalties` only adjusts weights, no hard constraint).
- Scarcity fallback in `server/capacity/scarcity.ts:237-279` uses `1 / countWithinType` keyed by `(capacity, category, seating_type)`.
- Zone balance penalty located in `server/capacity/selector/score.ts:412-463`; only affects intra-zone dispersion for merged sets.
- Manual selection hold TTL defined as `DEFAULT_HOLD_TTL_SECONDS = 180` in `server/capacity/tables.ts:89` without renewal path in holds module (`server/capacity/holds.ts`).
- Assignments stored in `booking_table_assignments` reference bookings/tables but not allocations; cascade risk documented.
- Slot creation executed via `get_or_create_booking_slot` helper invoked in `assign_tables_atomic_v2` lines 214-228; underlying function `supabase/migrations/20251022094500_get_or_create_booking_slot.sql` (verified by rg) performs naive insert without `ON CONFLICT`.
- Operating hours enforcement in `create_booking_with_capacity_check` relies on presence of `restaurant_operating_hours`; absence yields `v_is_open = false` but only after checking `v_has_closure`, leading to implicit allow if no rows found for day (verified with dry-run reasoning on SQL branch).
- Advisory locks obtained via `pg_advisory_xact_lock(hash(zone_id), service_date_int)` (assign_tables_atomic_v2:180-187).
- Exclusion constraint `no_overlapping_table_assignments` declared `DEFERRABLE INITIALLY DEFERRED` in `supabase/migrations/20251027211000_assign_tables_atomic_v2_undirected.sql:16-26`.
- DFS enumeration implemented in `server/capacity/selector/index.ts` (rg `enumeratePlansDepthFirst`, line ~860) with limit checks but no wall-clock timeout.

## External Resources

- Postgres documentation on `pg_advisory_xact_lock` and `ON CONFLICT DO NOTHING` for concurrency-safe upserts.
- WCAG/APG not directly impacted (no UI changes planned yet).

## Constraints & Risks

- Supabase operations must target remote DB; migrations must avoid destructive data loss and include rollback notes.
- Adjusting hold enforcement may impact performance if strict conflicts mandated—need benchmarks or gating flag.
- Adding FK from assignments → allocations requires ensuring allocations exist for legacy rows (migration may need backfill or default) and might fail on existing orphaned data; must audit first.
- Capacity re-check must avoid deadlocks; consider performing inside same transaction where assignments inserted or via consistent locking order.
- Tightening advisory locks to finer granularity risk increased collisions if hash collisions occur; must design deterministic mapping.
- Introducing wall-clock timeout requires safe abort semantics (should surface telemetry, not leave partial state).

## Open Questions (owner, due)

- Q: Do existing clients rely on long-lived manual selection holds beyond 180s? A: To validate via analytics once telemetry added; assume yes → need extend/renew path.
- Q: Are there historical bookings with mixed-zone assignments that would violate new constraints? A: Need data audit before enforcing; provide dry-run migration with diagnostic logging.
- Q: Is strict hold enforcement acceptable globally, or should we flip default feature flag? A: Clarify with product/ops; interim solution could unify by always using DB constraint while preserving toggle for warnings.

## Recommended Direction (with rationale)

- Normalize adjacency semantics by documenting trigger removal and ensuring API surfaces directional data when flag disabled (already partially implemented).
- Introduce schema support for zone consistency: add `bookings.assigned_zone_id` with trigger/function to keep aligned, enforce check preventing cross-zone assignments.
- Move hold conflict enforcement fully into DB layer: make exclusion constraint always active, drop redundant app check or convert to relying on constraint error handling to avoid race.
- Add post-assignment capacity verification stored procedure or extend `assign_tables_atomic_v2` to optionally invoke capacity check via `FOR UPDATE` on capacity rules, aborting on exceed.
- Expand idempotency enforcement by introducing unique constraint on `(booking_id)` in idempotency table and storing hash of table set to detect duplicates even with new key.
- Modify turn-band logic to clamp to service end (override buffer/duration) instead of throwing, while logging adjustments.
- Convert lookahead penalties into hard guard when future demand risk high (e.g., block if penalty surpass threshold) configurable via feature flag.
- Rework scarcity fallback to weight by capacity demand ratio (e.g., consider total seats required vs available) to avoid bias.
- Define deterministic zone balance semantics or remove noise metric; consider telemetry before altering scoring.
- Implement hold renewal endpoints or extend TTL automatically on user interaction; maintain UI compatibility.
- Add FK from `booking_table_assignments` to `allocations`, with migration to link existing rows (via matching on booking/table/window) and cleanup script.
- Update slot creation to `INSERT ... ON CONFLICT DO NOTHING` within `get_or_create_booking_slot` to avoid race.
- Enforce operating hours default closure when no configuration exists (fail fast) with logging.
- Reduce advisory lock scope to (zone, time_bucket) using e.g., 30-minute buckets hashed to int pair; handle collisions via consistent hashing.
- Evaluate making exclusion constraint NOT DEFERRABLE or tightening transaction boundaries to fail earlier.
- Introduce wall-clock timeout using `performance.now()` (already imported) for DFS enumeration; log and return best effort.
- Update docs (`docs/Critical Logic Issues`) to capture implemented fixes and residual risks.
