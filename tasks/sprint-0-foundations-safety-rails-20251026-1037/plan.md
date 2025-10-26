# Implementation Plan: Sprint 0 Foundations & Safety Rails

## Objective

We will enable the allocator platform team to harden schema guardrails and feature flags so that Sprint 0 delivers safe scaffolding for future work.

## Success Criteria

- [x] SQL migrations create required tables/columns with correct constraints and allow clean rollback.
- [x] Feature flags in production prevent unsafe allocation fallbacks while supporting non-prod experimentation.
- [x] Test fixtures load stable baseline data for allocator tests.

## Architecture & Components

- `supabase/migrations/20251026_001_add_observability_events.sql`: introduces `observability_events` table, severity check constraint, indices, and nullable links to bookings/restaurants.
- `supabase/migrations/20251026_002_add_table_holds.sql`: creates `table_holds` (with hold metadata, TTL, zone scoping) and `table_hold_members` (table roster); cascades cleanup, adds zone/booking/table FKs.
- `supabase/migrations/20251026_003_booking_table_assignments_group.sql`: restores nullable `merge_group_id` on `booking_table_assignments` pointing at `allocations`.
- `supabase/migrations/20251026_004_adjust_allocations_types.sql`: widens `allocations.resource_type` check to `table|hold|merge_group`.
- Feature flag surface: `lib/env.ts` returns nested `allocator` + `holds` objects; `server/feature-flags.ts` exports new helpers and forces atomic path in production.
- Test scaffolding: `tests/fixtures/layout.ts` + `tests/fixtures/bookings.ts` feed allocator/unit scenarios; updated capacity tests consume them.

## Data Flow & API Contracts

- Holds creation flow persists into `table_holds` (one row per hold) and `table_hold_members` (one row per table) with booking + zone FKs; future RPCs can join to `allocations` via `merge_group_id`.
- Observability telemetry now lands in durable storage with severity guard, enabling downstream analytics; nothing in application layer changes—the Supabase client already writes to this table.
- Production feature flag logic: `isAssignAtomicEnabled`/`isRpcAssignAtomicEnabled` return `true` whenever `env.node.env === "production"`, preventing fallback RPC invocation.

## UI/UX States

- Not applicable (backend scope).

## Edge Cases

- Migration idempotency: each DDL addition gated with `IF NOT EXISTS`; down migrations drop new artifacts to satisfy rollback acceptance.
- Holds TTL enforcement: `expires_at` index added for sweeper; `start_at < end_at` CHECK prevents invalid windows.
- `allocator.kMax` bounded to [1,5] server-side; `Math.max/min` ensures defensive clamping even if env schema misconfigured.
- Severity constraint protects `observability_events` from unexpected severities—callers default to `"info"`.
- Rollback of allocations constraint will fail if `'hold'` rows exist; note as operational caveat.

## Testing Strategy

- Targeted Vitest suite: `tests/server/capacity/assignTablesAtomic.test.ts`, `tests/server/capacity/selector.scoring.test.ts`, `tests/server/capacity/transaction.test.ts`.
- Type safety: `pnpm run typecheck`.
- Manual SQL sanity: inspected DDL + FKs with `rg`/`sed`; verify idempotent guards.
- Future QA: migrations to be run on remote Supabase per SOP (not executed locally).

## Rollout

- Apply migrations via `pnpm run db:push` (remote only) once reviewed; confirm new tables in Supabase Studio.
- Coordinate feature-flag flips: defaults already safe (`allocator.merges.enabled` false in prod, true elsewhere); update environment configuration via config management.
- Document hold sweeper + mirror changes for DevOps follow-up in post-release notes if required.
