# Implementation Plan: Conflict Safety Foundations & Manual Path

## Objective

We will deliver conflict-safe table assignments by enforcing allocation overlap prevention in Postgres, introducing transactional RPCs, and migrating the manual ops path under feature flags so that concurrent assignments are rejected atomically while the legacy flow remains available behind toggles.

## Success Criteria

- [ ] `public.allocations` enforces `tstzrange` overlap exclusion with RLS aligned to `user_restaurants()`; overlap attempts raise `P0001` and leave no partial rows.
- [ ] `assign_tables_atomic` / `unassign_tables_atomic` persist allocations + assignments in a single transaction and are callable from the manual ops route when `FEATURE_ASSIGN_ATOMIC` is enabled.
- [ ] Ops manual assignment surfaces a soft conflict warning (no disable) and propagates an `Idempotency-Key`, stored via a new partial unique index.
- [ ] Backfill script produces 1:1 allocations for future bookings in shadow mode without constraint violations (dry-run verified).

## Architecture & Components

- `supabase/migrations/<timestamp>_allocations_conflict_safety.sql`: Alters schema, creates constraints/functions/RLS, and defines new RPCs.
- `supabase/manual-rollbacks/*` (if required) & `supabase/scripts/backfill_allocations.sql`: operational artifacts for rollout + shadow backfill.
- Server helpers (`server/capacity/tables.ts`, `server/capacity/index.ts` if needed): wrapper functions selecting legacy vs atomic RPC paths; compute booking window + propagate idempotency.
- Next.js API routes (`src/app/api/ops/bookings/[id]/tables{,/ [tableId]}/route.ts`): choose RPC based on flag, read headers, shape responses.
- Feature flag plumbing (`config/env.schema.ts`, `lib/env.ts`, `server/feature-flags.ts`): expose `FEATURE_ASSIGN_ATOMIC`, `FEATURE_RPC_ASSIGN_ATOMIC`, `FEATURE_ALLOCATIONS_DUAL_WRITE`.
- Ops UI components (`src/services/ops/bookings.ts`, `src/hooks/ops/useOpsTableAssignments.ts`, `BookingDetailsDialog.tsx`): send idempotency header, present conflict warnings, avoid disabling conflicting tables.

State: Feature flags via env; per-booking UI keeps local selection + conflict state. | Routing/URL state: unchanged (`/ops?date=...`).

## Data Flow & API Contracts

Endpoint: `POST /api/ops/bookings/:id/tables`  
Request: `{ tableId: string }` with `Idempotency-Key` header (UUID).  
Response: `{ tableAssignments: OpsTodayBooking['tableAssignments'] }`.  
Errors: `400` validation, `403` access, `404` booking/table missing, `409` conflict (DB overlap), `500` fallback.

New RPC `assign_tables_atomic(p_booking_id uuid, p_table_ids uuid[], p_window tstzrange, p_assigned_by uuid, p_idempotency_key text default null)` returns `TABLE (table_ids uuid[])` for confirmation.  
New RPC `unassign_tables_atomic(p_booking_id uuid, p_table_ids uuid[] default null, p_merge_group_id uuid default null)` returns rows removed count or boolean.

## UI/UX States

- Loading: assignment mutation shows spinner; table select fetch uses existing skeleton.
- Empty: no assignable tables -> informational copy unchanged.
- Warning: selecting a locally conflicting table triggers inline soft warning (icon + text) and optional confirmation tooltip before POST.
- Success: toast + refreshed assignments list.
- Error: conflict -> toast "Table already reserved" via 409; generic failure -> `toast.error`.

## Edge Cases

- Bookings missing `start_at`/`end_at`: fallback to timezone-derived range or reject with 500 to avoid NULL window.
- Tables spanning multiple zones or cross-restaurant IDs: RPC validation rejects with informative exception before inserting allocations.
- Retry with same idempotency key: partial unique index ensures no duplicate rows; RPC returns existing assignment id.
- Legacy flag off: entire path must continue to use `assign_table_to_booking` / `unassign_table_from_booking` unchanged.
- Merge dissolves: `unassign_tables_atomic` must clean merge memberships and release tables only when no other active allocations exist.

## Testing Strategy

- Unit: Vitest suites for `server/capacity/tables.ts` wrappers (flag toggles, parameter shaping); React component tests for warning presentation.
- Integration: SQL harness (`supabase/tests/allocations_atomic.sql`) covering overlap rejection, merge-group creation, rollback on conflict, `[start,end)` half-open semantics.
- E2E: Manual QA via DevTools MCP (flagged UI path) once deployed to staging.
- Accessibility: Verify warning copy uses text/icon with ARIA live? (No new interactive control; ensure warning uses role="status" or visually obvious).

## Rollout

- Feature flag: `FEATURE_ALLOCATIONS_DUAL_WRITE`, `FEATURE_RPC_ASSIGN_ATOMIC`, `FEATURE_ASSIGN_ATOMIC`.
- Exposure: Enable in staging for dual-write + RPC; once verified, toggle manual path flag in production (starting at ops pilot). Keep legacy RPC fallback until sprint completion.
- Monitoring: Supabase logs for constraint violations (`allocations_resource_window_excl`), Ops API 409 counts, UI telemetry (if available) for assignment failures.
