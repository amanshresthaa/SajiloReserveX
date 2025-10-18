# Research: Sprint 2 — P0 Unify Paths, Merge Persistence, Status Lifecycle

## Existing Patterns & Reuse

- **Auto-assign flow** already computes booking windows, schedules, and selected combinations in `assignTablesForBooking` before looping over `assignTableToBooking` per table (`server/capacity/tables.ts:396-744`). The file also exposes `invokeAssignTablesAtomic` and `buildAssignmentWindowRange`, which the manual assignment path can use when `assignAtomic` flags are on (`server/capacity/tables.ts:1001-1133`). Reusing these helpers should minimise new plumbing.
- **Atomic RPC behaviour** is exercised in `tests/server/capacity/assignTablesAtomic.test.ts`, confirming payload shape and idempotency handling. Any auto-flow refactor can lean on these tests plus extend them for multi-table scenarios.
- **DTO + merge metadata** currently rely on `inferMergeInfo` to infer merge state front-end-side (`src/utils/ops/table-merges.ts:1-87`) and `server/ops/bookings.ts` enriches assignments with inferred fields (`server/ops/bookings.ts:216-266`). Persisted merge data from the RPC can replace inference while keeping utility helpers for backwards compatibility/fallbacks.
- **Status transitions today**: RPCs set tables to `reserved` on assign and `available` on unassign (`supabase/migrations/20251016092000_create_booking_table_assignments.sql:150-235`). No automated path promotes to `occupied`/`available` on lifecycle changes; UI resorts to manual PATCH on `table_inventory` (`src/app/api/ops/tables/[id]/route.ts:1-212`).
- **Realtime + caching**: `useBookingRealtime` polls `getTodaySummary` every 5s (`src/hooks/ops/useBookingRealtime.ts:1-142`). `OpsServicesProvider` centralises service factories, so Supabase subscriptions can be wired through existing contexts (`src/contexts/ops-services.tsx:4-68`).
- **Feature flags** live under `env.featureFlags` with schema in `config/env.schema.ts:1-118`. Adding `feature.merge.persistence`, `feature.status.triggers`, and `feature.realtime.floorplan` can follow the existing boolean flag pattern.

## External Resources

- [`docs/runbooks/allocations-assign-atomic.md`](docs/runbooks/allocations-assign-atomic.md) summarises the intended transactional guarantees and merge persistence expectations of `assign_tables_atomic`.
- Supabase range-exclusion constraints and advisory locking are documented inline in `supabase/migrations/20251018154000_conflict_safe_allocations.sql`, which we should reference to avoid duplicating database logic.

## Constraints & Risks

- **Concurrency**: auto flow must serialise bookings by `(restaurant_id, booking_date)` using the RPC's advisory lock; we must confirm the lock is active and propagate a stable idempotency key (likely deterministic over booking + window + table IDs). Risk: duplicate assignments if the key is inconsistent.
- **Candidate fallback logic**: current selection chooses a single combination; adding retries requires enumerating alternates without exploding complexity or regressing selection heuristics. We must ensure retries don't loop infinitely on conflicting tables.
- **Merge persistence**: we must avoid double-inserting `merge_groups` when idempotency replays. Need to confirm RPC handles conflicts gracefully and returns consistent IDs.
- **Triggers vs API**: status triggers should compute occupancy from allocations; misconfiguring could thrash statuses (e.g., toggling to available despite overlapping future allocations). Need guard-rails to query current allocations atomically.
- **Realtime subscriptions**: hooking Supabase live updates introduces connection overhead; fall back to polling when flags disabled or browser offline. Ensure we unsubscribe on unmount to avoid memory leaks.
- **Feature flag rollout**: flags must default off to allow staged rollout. Unit/integration tests must respect flags to keep current behaviour when disabled.

## Open Questions (and answers if resolved)

- Q: How should we compose the idempotency key for auto-assign RPC calls?
  A: Lean towards `${bookingId}:${window.start}-${window.end}:${tableIds.sort().join('+')}` to stay deterministic irrespective of table order. Need to normalise ISO strings to match `buildAssignmentWindowRange`.
- Q: Where should retry-on-`allocations_no_overlap` logic live? Inside `assignTablesForBooking` or in a new wrapper?
  A: Prefer inside `assignTablesForBooking` so both manual and batch flows reuse it. We'll investigate cached availability filters to ensure each retry recomputes schedule state safely.
- Q: Can we safely rely on Supabase realtime in ops dashboard without server tokens?
  A: Requires using the existing browser Supabase client (anon key) with `auth` session; operations UI already runs client-side in authenticated context, so realtime channels scoped by `restaurant_id` filters should work.
- Q: How do we represent merge groups in DTOs to support analytics?
  A: Target structure `{ groupId: string | null, members: Array<{ tableId, tableNumber, capacity }>, capacitySum: number | null }` per booking, with single-table assignments returning `null` group ID and single-member array for uniformity.

## Recommended Direction (with rationale)

- **Auto path**: Extend `assignTablesForBooking` to generate an ordered list of candidate combinations (single tables sorted by capacity, followed by adjacency-based merges). Invoke `assign_tables_atomic` once per candidate with advisory-lock-driven RPC. On `allocations_no_overlap`, proceed to next candidate and only fall back to failure after exhausting options. Deterministic idempotency keys + existing rollback logic avoid duplicate writes. (`server/capacity/tables.ts`)
- **Merge persistence**: Ensure the RPC returns `{ table_id, assignment_id, merge_group_id }` for all tables, then adapt `getBookingTableAssignments` to join `merge_groups` and `merge_group_members`. Update DTO mapping in `server/ops/bookings.ts` and utilities in `src/utils/ops/table-merges.ts` to prefer persisted group IDs, while keeping inference as a safety net.
- **Status lifecycle**: Implement Supabase trigger (likely on `bookings` status updates and `allocations` mutations) to set `table_inventory.status` to `occupied` at `checked_in`, revert to `available` when allocations end or booking hits terminal status with no overlapping allocations, and leave `reserved` for future bookings. Add API handler to set `out_of_service` by inserting a maintenance allocation range, respecting feature flag toggles.
- **Realtime**: Introduce Supabase channel subscriptions in ops services context that watch `allocations` and `booking_table_assignments`, invalidating React Query caches or patching the relevant booking/table state. Guard with `feature.realtime.floorplan`; continue polling fallback otherwise.
- **Feature flags & rollout**: Extend env schema, runtime flags, and guard new behaviours (auto atomic path, DTO responses, triggers, realtime). Provide migration scripts for DB triggers, ensuring remote-only execution per AGENTS.md. Document assumptions + deviations in task folder.
