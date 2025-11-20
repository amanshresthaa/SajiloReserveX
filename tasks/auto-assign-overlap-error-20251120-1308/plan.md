---
task: auto-assign-overlap-error
timestamp_utc: 2025-11-20T13:08:00Z
owner: github:@amankumarshrestha
reviewers: [github:@amankumarshrestha]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Auto-assign overlap error

## Objective

Understand and resolve the `allocations_no_overlap` failure during inline auto-assign and the follow-up job for new bookings.

## Success Criteria

- [ ] Identify the exact cause of the `allocations_no_overlap` error for the reported booking flow.
- [ ] Propose or implement a fix that prevents the mismatch while preserving assignment rules.
- [ ] Add validation or monitoring notes to avoid regressions.

## Architecture & Components

- Booking POST handler: triggers inline auto-assign and schedules background job.
- Assignment/hold logic: allocation overlap detection, hold confirmation.
- Logging/monitoring: existing structured logs in booking and auto-assign flows.

## Data Flow & API Contracts

- Endpoint: POST `/api/bookings` creates booking and runs inline auto-assign with hold/confirm.
- Background job: `auto-assign` attempts retries when inline assign fails.
- Relevant data: booking start/end, party size, table allocation windows, holdId.

## UI/UX States

- No UI change expected; ensure error handling remains consistent.

## Edge Cases

- Rounding of start/end times causing off-by-one-minute overlap rejection.
- Hold created on different allocation than confirmation expects.
- Party size exceeding available tables or conflicting with turns/blocks.
- Stale `allocations` rows without matching `booking_table_assignments` causing planner/hold success but confirm to fail with `allocations_no_overlap`.

## Testing Strategy

- Targeted reproduction via unit/integration tests around allocation overlap with given booking times.
- Manual validation via API call to confirm hold and overlap logic once fix identified.

## Rollout

- No flag planned; if code change is required, consider a guard/feature flag for assignment validation tweaks.
