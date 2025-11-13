---
task: auto-assign-inline-result
timestamp_utc: 2025-11-12T19:50:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: [planner_efficiency]
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Created new task folder with research/plan/todo/verification stubs.
- [x] Confirmed Supabase migrations must be remote-only (no local executions).

## Core

- [x] Add `auto_assign_last_result` column to `bookings` with a migration and update the schema/types.
- [x] Inline auto-assign flow writes the planner result to the new column on success/failure/timeout.
- [x] Background job reads the column, shortens retries for deterministic inline failures, and skips duplicate emails when appropriate.

## Tests

- [ ] Unit test for parsing `auto_assign_last_result` and deciding retry caps/email skipping (if practical).
- [ ] Manual verification: trigger inline auto-assign failure and observe `auto_assign.quote` events + book row updates.
- [x] Typecheck / lint to ensure new field is wired through the TypeScript schema.

## Notes

- Assumptions: Inline planner strategy defaults to null for `requireAdjacency`/`maxTables`; we can enrich later.
- Deviations: TBD during implementation.

## Batched Questions

- Should the job treat inline failures older than 5 min as stale, or keep a longer memory window? (Default to 5 min now.)
