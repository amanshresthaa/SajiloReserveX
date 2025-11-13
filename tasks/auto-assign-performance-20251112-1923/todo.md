---
task: auto-assign-performance
timestamp_utc: 2025-11-12T19:23:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: high
flags: [planner_observability]
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Create task artifacts and document instrumentation scope.
- [ ] Validate existing instrumentation helpers (`recordObservabilityEvent`, `autoAssignAndConfirmIfPossible`).

## Core

- [x] Wrap every `quoteTablesForBooking` call in the job with duration tracking and emit `auto_assign.quote` with strategy metadata.
- [x] Emit `auto_assign.summary` once the job exits (success, cutoff, already-confirmed, exhausted, error).
- [x] Ensure inline flow records the same strategy context and logs if the planner call succeeds/fails/timeouts.
- [x] Update job conclusion logs to reference the new summary event data (attempts, exit reason).

## UI/UX

- [ ] N/A (backend instrumentation only).

## Tests

- [ ] Unit test for job summary instrumentation (mock `quoteTablesForBooking`).
- [ ] Unit test for inline instrumentation (mock `recordObservabilityEvent`).
- [ ] Manual smoke: trigger inline auto-assign via dev server and observe new `observability_events` rows.
- [ ] Verify `observability_events` ingestion rate stays acceptable.

## Notes

- Assumptions: `quote.reason` can be undefined; we default to `null`/`'NO_REASON'` to prevent schema issues.
- Deviations: TBD during implementation.

## Batched Questions

- Do Ops scripts also need to emit `auto_assign.quote` or can be deferred? (Assess after A1/A2.)
