# Research: Manual Assign Sprint 3

## Existing Patterns & Reuse

- `src/app/api/staff/manual/{hold,validate,confirm}/route.ts` already follow the auth + membership verification template used across staff APIs; responses return JSON with `code` + human-readable `error`, so refinements should stay congruent with this contract.
- Manual selection primitives live in `server/capacity/tables.ts`: `computeManualSelection` yields the required checks (`sameZone`, `movable`, `adjacency`, `conflict`, `capacity`) and exposes helpers to create holds (`createManualHold`), validate (`evaluateManualSelection`), and confirm assignments (`confirmHoldAssignment`). Tests in `tests/server/capacity/manualSelection.test.ts` cover happy-path + error permutations we can extend.
- Hold lifecycle logic (`createTableHold`, `releaseTableHold`, `findHoldConflicts`, telemetry hooks) exists in `server/capacity/holds.ts`, ensuring allocations mirrors stay in sync; reuse avoids duplicating SQL.
- Dashboard data fetching uses React Query via `BookingDetailsDialog.tsx`, and `useBookingRealtime.ts` demonstrates Supabase Realtime subscriptions with polling fallback + React Query invalidation. That pattern can back floor-plan updates for holds/assignments.
- SHADCN components (`Button`, `Badge`, `Dialog`, `Select`) are already wired in booking dialog; new floor plan UI should extend this design system rather than introducing bespoke primitives.
- `lib/supabase/realtime-client.ts` centralizes realtime client instantiation; hooking new channels through it keeps auth/session behaviour consistent.
- Environment/feature flag plumbing is handled in `config/env.schema.ts`, `lib/env.ts`, and `server/feature-flags.ts`; removing legacy toggles must adjust all three plus any test helpers relying on them.

## External Resources

- `supabase/migrations/20251026105000_assign_tables_atomic_v2.sql` (and earlier atomic migrations) document the RPC contract manual confirm must call—ensuring idempotency + adjacency enforcement.
- Supabase Realtime docs: topic filtering (`postgres_changes`) matches existing `useBookingRealtime` setup for allocations/booking assignments; floor plan channel behaviour should be aligned.
- Appendix/spec (per sprint brief) outlines Manual Assign acceptance criteria—live validation, selection holds, conflict surfaces, and assignment cleanup on confirm.

## Constraints & Risks

- Manual flows must never fall back to legacy RPCs: `server/capacity/tables.ts` currently assumes `assign_tables_atomic_v2` is feature-gated; we have to remove code paths (and flags) that would bypass the new RPC.
- `computeManualSelection` emits `warn` vs `error` statuses; UI must treat warnings appropriately (e.g., adjacency warn when optional) while still blocking hard errors.
- Holds currently release all existing booking holds before creating a new one; need to ensure race conditions don’t lead to leaked allocations if release fails (existing logging covers, but UI should reflect failure states).
- Floor plan JSON relies on `table_inventory.position`; missing/partial coordinates must degrade gracefully (fallback lists?). Need to support mixed data quality.
- Realtime updates require guard rails: subscriptions must filter by restaurant + zone to avoid unnecessary traffic; also ensure unsubscribing on component unmount to prevent memory leaks.
- Tests: property-based “no overlaps” + concurrency stress require deterministic fixtures; we must ensure tests don’t intermittently fail because of timezone randomness or asynchronous race windows.
- Accessibility: floor plan interactions (selection, holds) need keyboard support + ARIA states; failing this violates repository non-negotiables.

## Open Questions (and answers if resolved)

- Q: What exact shape should validation responses expose for UI badges (e.g., include `message`, `status`, `details`)?
  A: `computeManualSelection` returns `validation.checks` with `id`, `status`, `message`, and optional `details`; UI can map directly without inventing new schema.
- Q: How do we surface who holds a table + countdown? (Required for “Held (by whom + countdown)”.)
  A: Need to extend hold metadata via `table_holds` query to include `created_by` and TTL; not currently exposed in summary API—requires backend changes to pipe metadata & user lookup.
- Q: Should manual hold endpoint expose the computed `k` (table count), total capacity, slack, and overage string?
  A: `validation.summary` already contains `tableCount`, `totalCapacity`, `slack`; API can echo these so UI meter shows “2 tables · 8 seats · +1 over”.
- Q: Do we rely on polling or Supabase subscription for live updates?
  A: `useBookingRealtime` shows hybrid polling + realtime; propose similar approach for holds/assignments, but decision pending implementation feasibility (Supabase table events availability, rate limits).
- Q: Are there existing alerting standards (pager channel names, severity tiers)?
  A: Need to consult `docs/observability` folder; nothing manual-assign specific yet, so runbook must align with global ops guidelines.

## Recommended Direction (with rationale)

- Extend manual selection utilities to return richer metadata (table count, capacity, slack, hold ID) and structured error codes so endpoints can emit human-readable + UI-friendly payloads meeting AC.
- Update `hold`, `validate`, `confirm` handlers to share a response normalizer; ensure confirm calls `confirmHoldAssignment` and performs hold cleanup when RPC succeeds.
- Enhance `getTodayBookingsSummary` (or add dedicated endpoint) to include current holds + floor plan metadata (table positions, statuses, hold ownership) so the dashboard can render real-time states.
- Implement `TableFloorPlan.tsx` as a reusable component: render tables positioned via CSS transforms based on `position`, manage selection state, display statuses (free/held/blocked) with accessible buttons, and hook into manual API actions (Hold, Validate, Assign, Clear).
- Integrate realtime updates by subscribing to `allocations`, `table_holds`, and `booking_table_assignments` changes filtered by restaurant/zone; fallback to short-interval polling when realtime disabled.
- Remove legacy feature flags (`assignAtomicV2` gating, older RPC toggles) from env schema, feature flag helpers, and allocator logic so prod/dev share the same manual confirmation path.
- Author new Playwright scenarios covering table multi-select, adjacency warnings, conflict refresh, and confirm flows; add property + concurrency tests in server layer using deterministic fixtures.
- Draft alerting docs in `docs/ops/alerts.md` enumerating metrics + thresholds, and create `docs/runbooks/allocator.md` covering investigation steps + feature flag overrides; ensure they reference existing observability tooling.
