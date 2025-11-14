---
task: capacity-pitfalls
timestamp_utc: 2025-11-13T20:15:00Z
owner: github:@codex-ai
reviewers:
  - github:@maintainers
risk: high
flags: []
related_tickets: []
---

# Research: Capacity Hold + Assignment Pitfalls

## Requirements

- Functional:
  - Ensure allocations overlap enforcement cannot leak across tenants/resource types and includes hold allocations.
  - Eliminate redundant indexes/constraints that create write amplification.
  - Make adjacency validation configurable (connected vs pairwise/hub) so venues can opt into stricter merging rules.
  - Guarantee confirm-hold endpoint is idempotent so repeated calls return existing assignments even after the hold row is deleted.
- Non-functional:
  - Changes must be backwards compatible with existing allocator RPCs and feature-flag surface.
  - DB migrations must be remote-friendly (Supabase) and come with validation/backfill notes.
  - Add unit coverage around new adjacency semantics and idempotent confirm behavior.

## Existing Patterns & Reuse

- `allocations_no_overlap` currently excludes `(resource_type, resource_id, window)` with a predicate `WHERE (NOT shadow)` (`supabase/schema.sql:10045`). Restaurant scoping is missing, leading to potential false conflicts if UUIDs collide across tenants. There is also `allocations_resource_window_excl` plus an explicit GiST index `allocations_resource_window_idx`, so inserts pay for two exclusion structures plus the extra GiST index.
- Hold creation + confirmation logic lives in `server/capacity/holds.ts` and `server/capacity/table-assignment/assignment.ts`. After confirmation, `confirm_hold_assignment_tx` deletes the hold row which means retrying `/confirm` immediately fails before we can compute deterministic idempotency keys.
- Adjacency enforcement happens in `server/capacity/selector.ts:evaluateAdjacency`, `server/capacity/table-assignment/manual.ts`, and `filterAvailableTables`. Everything currently assumes “connected” (graph reachability) semantics. Feature flags expose booleans like `isAllocatorAdjacencyRequired`, but there is no notion of adjacency mode.
- Supabase row-level security is already in place for `allocations`/`table_holds`. We can piggyback on existing policies when adding new supporting tables (e.g., storing confirmation results).

## External Resources

- Internal docs: `docs/table-assignment-business-rules.md` (describes adjacency + hold enforcement expectations).
- Supabase docs: Exclusion constraints with `btree_gist` to mix equality + range operators.

## Constraints & Risks

- Altering exclusion constraints requires dropping the old one, so we must recreate it in a single transaction and (re)validate when safe.
- Removing redundant GiST indexes could expose regressions if some query forces it. Need to confirm existing usage relies on constraint-generated index.
- Adjacency mode must remain feature-flag driven to avoid surprising operators. We should default to existing behavior and gate stricter modes via env/flag.
- Idempotency changes must not resurrect deleted holds; storing confirmation evidence must not leak PII and needs TTL/cleanup later (future work).

## Open Questions (owner, due)

- Should adjacency mode be per-venue DB config instead of env flag? (owner: @maintainers, due: later rollout). For now, global flag suffices.
- Do we need historical confirm records forever? (owner: @maintainers) — future cleanup job TBD.

## Recommended Direction (with rationale)

1. **Allocations overlap**: drop both existing exclusion constraints and recreate a single `allocations_no_overlap` that includes `restaurant_id`, `resource_type`, `resource_id`, and `window` with predicate `WHERE (NOT shadow AND resource_type IN ('table','hold','merge_group'))`. Ensure `btree_gist` is present. Drop redundant GiST index.
2. **Adjacency modes**: introduce feature-flagged enum (`connected` | `pairwise` | `neighbors`) surfaced via `getAllocatorAdjacencyMode`. Update selector + manual validation to respect the configured mode and add unit coverage.
3. **Confirm idempotency**: create a lightweight table (e.g., `booking_confirmation_results`) keyed by `(booking_id, idempotency_key)` capturing `hold_id`, `table_ids`, `assignment_window`. Insert entries inside `confirm_hold_assignment_tx` before deleting the hold. On API retries, check this table (by idempotency key or hold id) and stream back stored assignments.
4. **Testing/verification**: add Vitest cases covering adjacency modes and confirm retry behavior; run existing unit suite plus targeted manual confirm to ensure no UI regressions.
