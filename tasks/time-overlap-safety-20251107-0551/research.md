# Research: Time-Overlap Safety & Schema Hardening

## Requirements

- Functional:
  - Add generated `tstzrange` columns for bookings (`assignment_window`) and holds (`hold_window`) plus GiST indexes and exclusion constraints to guarantee no overlapping assignments/holds (Epic A).
  - Build data hygiene constraints for holds (`expires_at >= end_at`, unique table members) and ensure `table_hold_windows`/`booking_table_assignments` store precomputed ranges for fast overlap checks.
  - Backfill/validate existing data, detect overlaps prior to constraint validation, and flip constraints to VALID only after cleanup.
  - Fix composite FK enforcement for `table_inventory.capacity` vs `allowed_capacities`, align schema types in idempotency ledger, and introduce hot-path indexes (Epic B).
  - Adjust allocator algorithms: lookahead max-party fix, merged-set rules, same-zone enforcement, immutability of adjacency map, lunch overrun policyization (Epic C).
  - Introduce atomic RPC `confirm_hold_assignment_tx` that updates assignments, allocations, idempotency ledger, and transactional outbox within a single transaction; wire client code to use RPC (Epic D).
  - Extend pgTAP/Jest tests for exclusion constraints, concurrency, policy behaviors, and atomic commit rollback scenarios (Epic E).
- Non-functional:
  - Must run Supabase migrations remotely; `CREATE INDEX CONCURRENTLY` required to avoid long locks on large tables (~booking_table_assignments has multiple indexes already, see `supabase/schema.sql:4689-4881`).
  - Ensure accessibility unaffected (no UI change), but manual QA still required if UI touched later.
  - Security: maintain `SECURITY DEFINER` for RPC, ensure row-level security policies remain intact.
  - Performance: new GiST indexes should improve overlap query P95, but creation/backfill must avoid full table locks; plan for `NOT VALID` constraints to minimize downtime.

## Existing Patterns & Reuse

- `table_hold_windows` already defines a generated `hold_window` (`supabase/schema.sql:3968-3977`) and exclusion constraint `table_hold_windows_no_overlap` plus async sync triggers. We can reuse this structure for `booking_table_assignments.assignment_window`.
- Exclusion constraints/instrumentation existed previously for holds (20151029 migration). We can reuse helper queries from `supabase/migrations/20251029183500_hold_windows_and_availability.sql`.
- Manual selection + quoting already use `filterAvailableTables`, `buildBusyMaps`, and adjacency snapshots (`server/capacity/table-assignment/availability.ts`, `manual.ts`, `quote.ts`). We'll extend existing options rather than building new selectors.
- Observability/outbox infrastructure exists (`@/server/outbox`). We'll reuse `enqueueOutboxEvent` beyond new RPC; existing `assignment.ts` already enqueues `capacity.assignment.sync`.
- Idempotency ledger schema currently includes `table_ids uuid[]`, `assignment_window tstzrange` (per `supabase/schema.sql:3126-3134`), but code references `payload_checksum` (see `server/capacity/table-assignment/assignment.ts:112-136`). We'll reuse `computePayloadChecksum` from `server/capacity/v2`.

## External Resources

- [PostgreSQL EXCLUDE constraint docs](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-EXCLUSION) — confirm syntax for GiST ranges and `NOT VALID`.
- [PostgreSQL CREATE INDEX CONCURRENTLY](https://www.postgresql.org/docs/current/sql-createindex.html) — concurrency + `IF NOT EXISTS` semantics (ensures no `BEGIN` around concurrent statements).
- [pg_range / tstzrange reference](https://www.postgresql.org/docs/current/rangetypes.html) — confirm `[)` semantics for half-open windows.
- [Transactional outbox pattern](https://microservices.io/patterns/data/transactional-outbox.html) — ensure RPC inserts outbox row in same transaction as assignments/idempotency ledger updates.

## Constraints & Risks

- `booking_table_assignments` currently lacks a generated range (`supabase/schema.sql:3326-3343`). Adding column + GiST index may lock table; need `NOT VALID` constraints + `CREATE INDEX CONCURRENTLY`.
- `table_hold_windows` already has exclusion constraint validated; dropping/replacing to make `NOT VALID` requires downtime risk. Need staged approach (drop constraint? rename?). Investigate option to `NOT VALID` on new constraint with different name then drop old.
- Data quality unknown: `start_at` / `end_at` may be NULL; generated column would produce NULL ranges (violating acceptance). Need detection query + remediation plan (maybe update null values or set `start_at`?). Without DB access, must coordinate with ops.
- Unique index on `table_hold_members (hold_id, table_id)` already implied by existing unique constraint created when table defined; adding another index duplicates storage. Need to verify actual remote state (maybe constraint drift). Document assumption.
- `booking_assignment_idempotency` schema missing `payload_checksum`; code writes to column -> currently no-op or failure? Need to confirm Supabase type to avoid runtime errors.
- RPC `confirm_hold_assignment_with_transition` currently orchestrates assignments (function defined in migration `20251106110000`), but new RPC must also update allocations + ledger + outbox. Need to ensure RLS/perms for service role.
- Feature-flag interplay: `allowMaxPartySizeViolation` should be true whenever combinations allowed (quote + lookahead). Need to find all call sites (quote + lookahead + manual?). Tests must cover both `combinationEnabled` true/false.
- Lunch overrun policy: need to inspect `computeBookingWindowWithFallback` in `booking-window.ts` and `computeBookingWindow` to see where lunch-specific branch lives; toggling via config must not break other services.

## Open Questions (owner, due)

- Q: Do we keep existing validated constraint `table_hold_windows_no_overlap`, or replace with new `thw_no_overlap NOT VALID`? (Owner: me, Due: before implementation) – leaning toward drop+rename to align with acceptance but confirm with data owners.
- Q: What is source of data cleanup/backfill (precheck job) — do we build SQL script or Node CLI? Need acceptance for auto-resolve vs manual list. (Owner: me, Due: before verification).
- Q: Does `table_hold_members` already enforce uniqueness? (Owner: me) – `schema.sql` shows unique constraint, but remote may differ; need confirm via Supabase MCP before running migration to avoid redundant index.
- Q: Are there existing tests for lunch overrun or zone enforcement? Need to inventory test coverage (owner: me) to avoid regression.
- Q: Where should transactional outbox insert? `capacity.assignment.sync` event structure already defined? Need field list (owner: me) while designing RPC.

## Recommended Direction (with rationale)

- **Split migrations**: (1) structural changes (generated columns, check constraints); (2) concurrent indexes/exclusion constraints; (3) data cleanup/backfill scripts recorded in `tasks/.../todo.md`; (4) constraint validation scripts executed post-cleanup (documented in `verification.md`). Splitting avoids mixing `CREATE INDEX CONCURRENTLY` with transactional statements.
- **Range columns**: add `assignment_window` generated column and default `hold_window` addition statements using `ADD COLUMN IF NOT EXISTS` to stay idempotent; update Supabase types (Zod, TypeScript) to expose range fields.
- **GiST indexes & exclusion constraints**: prefer separate `CREATE INDEX CONCURRENTLY` statements; for BTA constraint use new name `bta_no_overlap` with `WHERE (table_id IS NOT NULL)` as per spec; mark `NOT VALID` and defer validation.
- **Backfill monitoring**: implement SQL view/query to detect overlaps using `tstzrange &&` on `booking_table_assignments` grouped by `table_id`. Provide script under `scripts/` or `server/capacity` to flag conflicts; integrate in tests if feasible.
- **Holds hygiene**: add `CHECK (expires_at >= end_at)` and ensure unique (rename existing unique constraint to spec or create named unique index). Provide migration to update invalid rows? (Need data cleanup plan).
- **Composite FK**: verify actual FK; if mismatch, drop old and add new referencing `(restaurant_id, capacity)`; add `ON DELETE RESTRICT` to match spec.
- **Idempotency ledger types/indexes**: ensure `table_ids` is `uuid[]`, `assignment_window` `tstzrange`, add `payload_checksum text` column + `bai_rest_bk_idx (booking_id, idempotency_key)` to accelerate lookups.
- **Hot-path indexes**: add `bta_booking_id_idx`, `bta_table_id_idx`, `bookings_restaurant_date_idx`, `table_holds_restaurant_idx` concurrently as per acceptance.
- **Algorithm fixes**:
  - `applyLookaheadPenalties`: pass `allowMaxPartySizeViolation: combinationEnabled`.
  - Manual validator: rely solely on merged capacity, remove per-table `maxPartySize` check if exists elsewhere.
  - Zone requirement: propagate `zoneId` through manual + automatic flows, ensure commit path rejects mismatched zone snapshot (currently snapshot comparison exists, but need to enforce when `zoneId` requested even if hold metadata missing).
  - Adjacency map immutability: avoid mutating shared `adjacency` map inside `filterAvailableTables` (copy or fallback map); ensures no cross-request bleed.
  - Lunch overrun: add config field (maybe `policy.services.<service>.allowOverrun` or `serviceClamp` option) and wire into `computeBookingWindowWithFallback`.
- **Atomic RPC**: implement `confirm_hold_assignment_tx(p_booking_id uuid, p_hold_id uuid, ...)` or as specified; inside transaction: validate hold snapshot, upsert assignments/allocations/ledger/outbox then delete hold; ensure `SECURITY DEFINER`, `SET search_path = public`, grant to service role. Replace `AssignmentOrchestrator` usage with RPC call to ensure atomicity even when `transition` not requested.
- **Testing**: extend Jest/Vitest for `filterAvailableTables` (max party + adjacency immutability), lookahead conflict detection, lunch overrun config, zone enforcement; add SQL-based test harness (maybe `tests/server/capacity/lookahead.scenario.test.ts`). For DB-level features use pgTAP or Node-run SQL to assert constraints reject overlap.
- **Verification**: record metrics before/after (P95 overlap) via load test harness in `tests/server/capacity/planner.time-pruning.benchmark.test.ts` (existing). Document manual steps in `verification.md`.

> Verification of schema state relied on `supabase/schema.sql` + migration history plus static code inspection; will re-check via Supabase MCP before executing migrations remotely.\*\*\*
