---
task: unassigned-table-booking
timestamp_utc: '$now'
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Booking Not Assigned Table

## Objective

We will identify and resolve why booking `d99ceb12-193a-4e80-840e-35cb236d9452` is missing an assigned table so that bookings reliably map to tables.

## Success Criteria

- [ ] Root cause isolated with evidence.
- [ ] Remediation plan documented (and executed if approved) to clear the blocker.
- [ ] Regression checks added/updated if applicable (e.g., allocation pruning on reassignment).

## Architecture & Components

- Auto-assign pipeline (inline + background) emitting `observability_events`.
- `allocations` exclusion constraint `allocations_no_overlap` guarding overlaps.
- `booking_table_assignments` as the source of truth for table occupancy used by the planner.

## Data Flow & API Contracts

- Booking creation triggers inline auto-assign → hold + quote → attempt commit via `assign_tables_atomic_v2` (enforces `allocations_no_overlap`).
- Background auto-assign may retry with the same planner inputs if inline fails.

## UI/UX States

- N/A (backend investigation only).

## Edge Cases

- Stale allocations without matching `booking_table_assignments` blocking new assignments.
- Booking modifications that change table selections without pruning prior allocations.

## Testing Strategy

- Verification via targeted SQL queries: affected booking shows table assignments + allocations consistent.
- After cleanup (if approved), rerun auto-assign for the booking and confirm no `allocations_no_overlap` events.

## Rollout

- If cleanup is approved: delete/archive orphan allocations for booking `e554c13a-2898-4c03-83e5-dc5d0925e679`, rerun auto-assign for `d99ceb12-193a-4e80-840e-35cb236d9452`, and monitor `observability_events`.

## DB Change Plan (if applicable)

- Any data fixes must be idempotent and scoped to offending allocation IDs; capture before/after snapshots to `artifacts/` if executed.
