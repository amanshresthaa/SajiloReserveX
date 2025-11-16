---
task: unassigned-table-booking
timestamp_utc: '$now'
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Research: Booking Not Assigned Table

## Requirements

- Functional: identify why booking `d99ceb12-193a-4e80-840e-35cb236d9452` (created 2025-11-16 21:51 UTC) has no table assignment and provide root cause.
- Non-functional: avoid production data mutation unless approved; keep Supabase access remote-only.

## Existing Patterns & Reuse

- Auto-assign pipeline with observability events (`observability_events`), allocation enforcement via exclusion constraint `allocations_no_overlap`.
- Supabase service-role client via `.env.local` already available; use existing scripts (`scripts/check-booking-assignments.mjs`) if needed.

## External Resources

- `supabase/schema.sql` — reference for bookings/allocations schema and constraints.

## Constraints & Risks

- Must not drop/modify production data without explicit approval; only read queries used.
- Stale allocations can block future assignments; cleanup needs careful rollback planning.

## Open Questions (owner, due)

- Q: Why were allocations for booking `e554c13a-2898-4c03-83e5-dc5d0925e679` not pruned when its table assignment changed? (owner: eng, due: follow-up after remediation)

## Recommended Direction (with rationale)

- Investigate observability events and allocations for the affected booking to trace auto-assign failure path.
- Check for conflicting allocations on the candidate table/time window to find constraint violations.
- If stale/orphan allocations are found, plan a safe cleanup (archive/delete) for the offending rows and rerun auto-assign, then patch the pipeline to prune allocations on reassignment.
