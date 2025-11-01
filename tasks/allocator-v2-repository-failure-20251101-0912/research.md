# Research: Allocator v2 Repository Failure

## Requirements

- Functional: Ops dashboard auto-assignment (`POST /api/ops/dashboard/assign-tables`) must succeed without throwing `AssignTablesRpcError` when capacity overrides are absent.
- Non-functional (a11y, perf, security, privacy, i18n): Reliability and graceful degradation; no new latency added to assignment workflow.

## Existing Patterns & Reuse

- `get_or_create_booking_slot` already guards on `to_regclass('public.restaurant_capacity_rules')` before querying overrides, falling back to defaults when the table is missing (`supabase/migrations/20251026180000_fix_assign_tables_atomic_v2_table_id.sql:420`).
- Capacity service factory treats missing `restaurant_capacity_rules` as an unknown capacity result instead of failing hard (`server/booking/serviceFactory.ts:118`).
- `computeScarcityScore` in `server/capacity/scarcity.ts` logs a heuristic fallback yet proceeds with default heuristics, showing the desired resilience pattern.

## External Resources

- `docs/Critical Logic Issues` notes that `validate_booking_capacity_after_assignment` runs after each allocation and raises if capacity exceeded—good reference for expectations.
- Supabase migration history around 2025-10-20 dropped the entire capacity schema (`supabase/migrations/20251020232438_remove_capacity_schema.sql`), explaining why the table is absent in some environments.

## Constraints & Risks

- Supabase work must target remote instances only; we cannot run local migrations.
- Disabling capacity checks entirely could allow overallocation; we need a safe fallback (e.g., treat capacity as unbounded while table absent).
- Any migration change must remain idempotent and safe to run where the table still exists.

## Open Questions (owner, due)

- Q: Should we reintroduce `restaurant_capacity_rules` or simply bypass the validation when it is missing? (Owner: engineering, due before implementation)
  A: Proceed with graceful fallback—treat table absence as “no overrides” while logging, so deployments without the legacy table keep working.

## Recommended Direction (with rationale)

- Update `validate_booking_capacity_after_assignment` to mirror the `to_regclass` guard pattern: skip the `SELECT ... FROM restaurant_capacity_rules` when the table is missing, using existing default maxima instead, so allocations succeed while environments lacking the table operate safely.
- Add logging or instrumentation (if available) to highlight that the table is absent to aid operations, without blocking the flow.
