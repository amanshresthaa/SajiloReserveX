# Research: Atomic Persistence v2, Holds, Auto Quote API

## Existing Patterns & Reuse

- `supabase/migrations/20251021094504_recreate_assign_tables_atomic.sql` implements the current single-table `assign_tables_atomic` RPC, including idempotency reuse via `booking_table_assignments` (unique `(booking_id, idempotency_key)`), GiST-backed overlap protections, and advisory locking on `(restaurant, booking_date)`. This is the baseline to extend to v2.
- `supabase/migrations/20251019102432_consolidated_schema.sql` still holds the pre-simplification multi-table variant of the RPC (returns merge groups, loops over tables, inserts allocations + optional merge_group allocation). It is a concrete reference for resuming multi-table + merge group behaviour while updating checks (zone, adjacency, movable).
- `server/capacity/tables.ts` orchestrates selector-driven assignment and wraps the RPC (`invokeAssignTablesAtomic`), performs idempotency key composition, and already handles GiST overlap errors surfaced as `AtomicAssignmentError`. It also loads adjacency maps from `table_adjacencies`, computes booking windows with buffers, and logs telemetry via `emitSelectorDecision`.
- `tests/server/capacity/assignTablesAtomic.test.ts` and `tests/server/capacity/autoAssignTables.test.ts` mock Supabase RPC calls and expect `assign_tables_atomic` to cooperate with feature flags. They embody current contract expectations for wrappers (idempotency args, window serialization) and should be evolved to cover v2 + conflict handling.
- Schema groundwork for holds already exists: `supabase/migrations/20251026104700_add_table_holds.sql` (`table_holds`, `table_hold_members`) and `supabase/migrations/20251026104900_adjust_allocations_types.sql` (permits `resource_type='hold'`). No runtime code yet mirrors holds into allocations—this is net-new but strongly hinted by `appendix.md`.
- `server/capacity/telemetry.ts` + `server/observability.ts` already log selector decisions to the new `observability_events` table (`supabase/migrations/20251026104600_add_observability_events.sql`). Pattern: build JSON context, console.log for debugging, then attempt insert via Supabase client with guarded error logs.
- `appendix.md` codifies algorithmic rules (zone consistency, movable-only merges, adjacency guards, hold mirroring, idempotency expectations) and will drive acceptance criteria.

## External Resources

- `appendix.md` – authoritative spec for selector scoring, hold mirroring, RPC v2 checks, and API expectations.
- `docs/runbooks/allocations-assign-atomic.md` – captures operational considerations for atomic assignment migrations and conflict handling.
- Supabase generated types (`types/supabase.ts`) – confirm column enums (`table_inventory.mobility`, `allocations.resource_type`) and existing unique indexes/policies we must honour.

## Constraints & Risks

- **Concurrency & Locking**: We must shift from restaurant-level locks to zone + service date advisory locks to limit contention per spec; mis-deriving `service_date` (mixing `start_at` vs `booking_date`) could reintroduce cross-zone blocking or deadlocks.
- **Multi-table Validation**: All tables must share `zone_id`, be `active`, and if count > 1 require `mobility='movable'`. Enforcement must re-check even if selector already filtered (defence in depth). Adjacency enforcement when `require_adjacency=true` needs efficient connectivity checks (risk: O(k²) lookups per call).
- **Idempotency**: Existing unique index on `(booking_id, idempotency_key)` prevents duplicates but doesn’t store merge metadata; we may need either a dedicated ledger or reliable reuse of assignments in v2. Failure to persist ledger atomically risks double allocations under retries.
- **GiST Conflicts**: Overlaps already raise `allocations_no_overlap`; v2 must surface conflicts cleanly (likely translate to 409 for API). Need to ensure merge-group allocation insertion doesn’t partially succeed.
- **Holds Lifecycle**: Creating holds requires consistent mirroring into `allocations` (`resource_type='hold'`), cleanup, and sweeper reliability. Missing sweeper or poor transactional cleanup leaves stale holds blocking capacity.
- **Performance**: Auto Quote endpoint must respond p95 ≤ 50 ms on dev data—extra queries (holds, adjacency re-checks, telemetry writes) must be minimized. Advisory locks or GiST checks could increase latency if not scoped tightly.
- **Telemetry Reliability**: New events (`capacity.selector.quote`, `capacity.hold.created|expired|confirmed`, `capacity.rpc.conflict`) must insert without silent drops. Need resilient logging without cascading failures onto the main flow.
- **Deadlocks**: Introducing per-zone locks plus inserts into `allocations`/`booking_table_assignments` with GiST/exclusion constraints can deadlock if lock ordering differs from other flows (e.g., unassign). Need consistent ordering + retry strategy.
- **Background Sweeper Ownership**: Requirement references cron/queue but infra not yet implemented; lacking clarity risks a half-built sweeper.

## Open Questions (and answers if resolved)

- Q: Where should the idempotency ledger live—extend `booking_table_assignments` uniqueness or add a new `booking_assignment_idempotency` table?
  A: Leaning toward dedicated table for explicit ledger + conflict states; confirm during planning if existing unique index suffices for concurrency semantics.
- Q: How to compute the advisory-lock key’s `service_date` for bookings without `booking_date` but with `start_at`? Need deterministic UTC/local conversion strategy.
- Q: What TTL and buffer should holds use by default (Appendix hints ~120 s but not codified)? Clarify for sweeper implementation.
- Q: What scheduling mechanism (Supabase cron, edge function, existing job runner) should own the hold expiry sweeper? No current background queue besides `server/jobs/booking-side-effects.ts`.
- Q: Should the Auto Quote API reuse existing selector result shape (candidate + alternates + next times) directly, or adapt for staff workflows (e.g., include warnings)? Need confirmation from product requirements.

## Recommended Direction (with rationale)

- **RPC v2**: Rebuild `assign_tables_atomic_v2` drawing from the prior multi-table implementation, but enforce zone/mobility/adjacency checks per spec, switch advisory lock to `(zone_id_hash, service_date_int)`, and add ledger write before performing allocations. Return `(table_id, start_at, end_at)` to give callers committed window context. Use consistent error signaling for idempotency/overlap/conflicts and retry once on deadlock.
- **Persistence Client (`server/capacity/tables.ts`)**: Introduce `invokeAssignTablesAtomicV2` alongside legacy call, toggle via feature flag; handle new response shape, propagate `requireAdjacency` + `idempotencyKey` inputs, and enrich errors (`capacity.rpc.conflict` telemetry on 409). Update tests to mock v2.
- **Holds Service**: Add `server/capacity/holds.ts` encapsulating CRUD (create/update/expire/delete) that writes to `table_holds`, `table_hold_members`, and mirrors allocations within a single transaction. Expose helpers for Auto Quote + manual workflows. Implement sweeper stub (queue-ready) that prunes expired holds and mirror allocations.
- **Auto Quote Endpoint**: Implement `/api/staff/auto/quote` route using new holds service + selector to return `{ holdId, expiresAt, candidate, alternates, nextTimes }`, logging telemetry and respecting optional filters (`zoneId`, `maxTables`, `requireAdjacency`, `avoidTables`). Ensure response surfaces reasons when candidate absent.
- **Telemetry Wiring**: Extend `server/capacity/telemetry.ts` with emitters for holds lifecycle and RPC conflicts; upgrade `recordObservabilityEvent` to accept optional `restaurantId`/`bookingId`, ensure inserts use minimal payload and capture failures without throwing.
- **Testing Strategy**: Add unit tests for holds service, RPC argument/responses, idempotency ledger behaviour, and concurrency simulation (Vitest + mock Supabase). Design integration tests covering quote→confirm path and expired hold cleanup.
