# Research: Capacity Module Implementation

## Existing Patterns & Reuse

- `server/capacity/selector.ts` already ranks table plans (singles + combinations) using scoring weights and adjacency evaluation; our allocator should delegate candidate generation here.
- `server/capacity/policy.ts` exposes venue policy, buffer rules, and band duration helpers needed to compute booking windows (dining vs block) based on party size.
- Database migrations under `supabase/migrations/20251026*` define the `assign_tables_atomic_v2` RPC, table hold tables, and idempotency ledger that the tables service must wrap.
- Feature flags in `server/feature-flags.ts` control adjacency requirements, selector scoring, combination planner, and holds; implementations must guard behaviour via these toggles.
- `server/capacity/telemetry.ts` provides helpers for logging selector decisions, hold lifecycle events, and RPC conflicts.
- Tests in `tests/server/capacity/*.test.ts` describe expected behaviours for manual validation, quoting, hold confirmation, and availability helpers; they also outline utility functions like `windowsOverlap` and `computeBookingWindow`.

## External Resources

- Supabase schema types (`types/supabase.ts`) list columns for `table_inventory`, `table_holds`, `table_hold_members`, `booking_table_assignments`, and `allocations` required for DB access.
- Migration `20251026105000_assign_tables_atomic_v2.sql` documents the PL/pgSQL logic, required parameters, and error surfaces for table assignment RPC v2.
- Appendix notes (see `appendix.md` lines ~180-230) summarise allocator invariants: 5-minute slot bitset, adjacency, movable tables for merges, conflict detection, and hold sweeping contract.

## Constraints & Risks

- Manual UI QA via Chrome DevTools MCP will be required once UI flows touched; ensure hooks expose necessary metadata.
- Must not introduce local Supabase migrations—only operate against remote schema; rely on provided migrations (already present) for table holds/RPC definitions.
- Need to maintain idempotency and proper error mapping when calling `assign_tables_atomic_v2`; missing RPC must surface actionable errors.
- Concurrency around hold creation/validation must avoid race conditions; tests expect deterministic behaviour when two holds requested concurrently.
- Feature flags may disable holds or adjacency; logic must degrade gracefully without throwing.

## Open Questions (and answers if resolved)

- Q: Do we need additional DB tables beyond existing migrations for holds and idempotency?
  A: No—required tables (`table_holds`, `table_hold_members`, `booking_assignment_idempotency`) already exist via migrations.
- Q: Should manual selection allow cross-zone merges when adjacency disabled?
  A: Tests expect zone consistency regardless; selection must stay within a single zone.

## Recommended Direction (with rationale)

- Implement a `server/capacity/planner/bitset.ts` utility to model 5-minute availability masks, covering allocations and holds, so both quoting and manual validation share the same conflict detection logic.
- Build `server/capacity/holds.ts` to encapsulate CRUD for holds (create, confirm via RPC, release, sweep) and expose conflict detection against overlapping holds; this isolates DB interactions and reuses telemetry.
- Create `server/capacity/tables.ts` higher-level service that: computes booking windows from policy; fetches tables + adjacency + context bookings; filters availability; calls selector for candidates; manages hold lifecycle during quote/manual flows; and wraps assign/unassign RPCs with idempotency, telemetry, and error normalization.
- Provide rich TypeScript definitions (Table, ManualSelectionResult, etc.) aligned with tests to support API routes and hooks.
- Reuse feature-flag helpers to toggle adjacency, scoring, and holds everywhere rather than duplicating env access.
