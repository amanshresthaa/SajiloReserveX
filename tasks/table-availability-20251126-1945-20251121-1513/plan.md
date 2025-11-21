---
task: table-availability-20251126-1945
timestamp_utc: 2025-11-21T15:14:10Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Implementation Plan: Table Availability — 2025-11-26 19:45

## Objective

Provide the counts of (a) unoccupied tables and (b) additional tables that can still be fitted at 19:45 on 2025-11-26 using Supabase (remote, via MCP/CLI).

## Success Criteria

- [ ] Restaurant/tenant context confirmed for the query.
- [ ] SQL runs against remote Supabase and returns counts for 2025-11-26 19:45.
- [ ] Assumptions (timezone, slot length) are documented alongside results.

## Architecture & Components

- Data sources: `table_inventory` (active tables), `booking_table_assignments` (assignments with `start_at`/`end_at`), `booking_slots` (optional capacity counters), `restaurants` for tenant identification.
- Tooling: Supabase MCP for SQL execution; Supabase CLI only for read operations (no migrations/seeds).

## Data Flow & Query Plan

1. Fetch restaurant list to confirm the target venue (expect single seeded restaurant unless instructed otherwise).
2. Determine slot window for 2025-11-26 19:45 (using `start_at` <= target AND `end_at` > target) and compute overlapping assignments.
3. Count active tables for the restaurant and subtract occupied ones at the target timestamp to derive unoccupied tables; cross-check with `booking_slots` if populated.
4. Report counts and assumptions in the task folder and final answer.

## UI/UX States

- N/A (data/reporting only).

## Edge Cases

- Tables marked inactive or non-standard mobility should be excluded from availability.
- Overlaps near boundaries (e.g., assignments ending at 19:45 exactly) must be treated as free if `end_at` == target.
- If multiple restaurants exist, ensure filtering by correct restaurant ID/slug.

## Testing Strategy

- Validate SQL results with a secondary query (e.g., list occupied table IDs vs. total) to ensure consistency.
- Spot-check `booking_slots` entry for the same date/time if data exists.

## Rollout

- Read-only analytical task; no rollout required. Keep evidence in `artifacts/`.

## DB Change Plan (if applicable)

- Not applicable; no schema/data mutations planned.
