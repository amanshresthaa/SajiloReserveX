---
task: auto-assign-overlap-error
timestamp_utc: 2025-11-20T13:08:00Z
owner: github:@amankumarshrestha
reviewers: [github:@amankumarshrestha]
risk: medium
flags: []
related_tickets: []
---

# Research: Auto-assign overlap error

## Requirements

- Functional: Identify why inline auto-assign is returning `allocations_no_overlap` for bookings and outline the fix path.
- Non-functional: Avoid regressions to booking assignment flows; keep logs/monitoring intact; maintain accessibility and existing UX expectations.

## Existing Patterns & Reuse

- Booking creation triggers inline auto-assign followed by background auto-assign job.
- Manual assignment flow and job retry logic already implemented; reuse current booking/assignment services before introducing new mechanisms.
- Logging around `[bookings][POST][inline-auto-assign]` and `[auto-assign][job]` provides tracing.

## External Resources

- MANUAL_ASSIGNMENT_BUSINESS_RULES.md — reference for assignment constraints.
- ROUTE_SUMMARY.md — routing/assignment overview for context.

## Constraints & Risks

- Assignment logic has tight coupling with allocation windows; risk of changing without understanding data model.
- Error `allocations_no_overlap` suggests business rule violation; must ensure we do not mask genuine conflicts.
- Need to respect existing retry/backoff behavior to avoid duplicate holds.

## Open Questions (owner, due)

- Do we have recent config changes to opening hours/slot generation for the affected restaurant? (owner: github:@amankumarshrestha, due: 2025-11-21)
- Are holds being created with the expected window and table combinations? (owner: github:@amankumarshrestha, due: 2025-11-21)

## Recommended Direction (with rationale)

- Inspect assignment service handling of holds and allocation overlap detection to pinpoint why a hold that was placed (`hasHold: true`) cannot be confirmed.
- Trace booking data (party size, times) and relevant allocation windows to reproduce the mismatch.
- Adjust either the hold creation inputs or overlap validation to use consistent window rounding and table selection; prefer minimal, well-explained fixes.

## Findings (in-progress)

- The observed inline auto-assign failure logs show a successful quote/hold followed by `allocations_no_overlap` during confirm. That error is raised by Postgres in `assign_tables_atomic_v2` when inserting/upserting into `allocations` (see supabase/migrations/20251101170000_booking_logic_hardening.sql around the `allocations_no_overlap` exception paths).
- Quote/hold selection derives availability from `booking_table_assignments` + holds (busy map in `server/capacity/table-assignment/availability.ts`) and does not consult the `allocations` table. If `allocations` contains stale rows (e.g., left behind after cancellations or earlier tests) without matching assignments, the planner will think the table is free, but confirm will hit the exclusion constraint.
- For this incident (booking `9c44e0a5-268e-4e53-a0e7-5351aba3d22b`, restaurant `cbdea463-1fc8-43a2-9909-b0393f530e94`), root cause is likely a pre-existing allocation on the chosen table/window that was not represented in the planner context, triggering the exclusion constraint at confirm time.
- Next data step: inspect `allocations` vs `booking_table_assignments` for that restaurant/date/time to identify the conflicting row and clean or reconcile it.
