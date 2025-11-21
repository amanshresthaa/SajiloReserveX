---
task: auto-assign-adjacency-error
timestamp_utc: 2025-11-21T13:37:47Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Auto-assign adjacency error

## Objective

Resolve the auto-assignment failure where confirm rejects a selected table set as non-adjacent, ensuring bookings complete automatically when sufficient adjacent tables exist.

## Success Criteria

- [ ] Reproduce or reason through the failing adjacency check for booking `788364d8-7674-4df8-b502-fcce9abfa9ca` (or equivalent scenario).
- [ ] Identify and implement a fix that prevents false "not adjacent" errors while preserving adjacency rules.
- [ ] Auto-assign job succeeds for the affected case; no regression to other assignment paths.

## Architecture & Components

- Auto-assign service (inline + background job) selecting table sets and holds.
- Adjacency/contiguity validation logic using restaurant table graph/config.
- Booking confirmation/hold APIs.

## Data Flow & API Contracts

- Inline POST /api/bookings triggers quote with hold; confirm path validates adjacency and persists assignment.
- Background job re-attempts auto-assign using stored quote/hold data when inline fails.

## UI/UX States

- No UI changes expected; ensure error surface remains meaningful if failure persists.

## Edge Cases

- Holds created with table sets that are not truly adjacent.
- Mismatch between quote-selected tables and adjacency map updates.
- Background job retry uses stale hold after adjacency config changed.

## Testing Strategy

- Targeted unit/integration test for adjacency validation around the problematic table IDs.
- If feasible, add regression test for auto-assign selection to ensure adjacent sets pass.

## Rollout

- Behind no new flag; aim for safe, small change. If risky, consider feature flag `feat.auto_assign.adjacency_fix` default on=false.
- Monitoring via logs for "not adjacent" errors on auto-assign.

## DB Change Plan (if applicable)

- None anticipated.
