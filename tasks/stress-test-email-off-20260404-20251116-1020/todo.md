---
task: stress-test-email-off-20260404
timestamp_utc: 2025-11-16T10:20:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Confirm base URL/environment reachable for booking API.
- [x] Export `LOAD_TEST_DISABLE_EMAILS=true` and `SUPPRESS_EMAILS=true` for the session.
- [x] Ensure task artifact directory exists for logs.

## Core

- [ ] Run slot-fill stress test for 2026-04-03 (weekday) across 12:00–22:00 (15-min slots) with party sizes 1–12 and `--stress-max`/manual retries high enough for ≥30% coverage per slot.
- [ ] Re-run targeted slots if any log shows <8 successful bookings or early failures.
- [ ] Capture aggregate observations (success/failure patterns, bottlenecks).

## UI/UX

- [ ] n/a (CLI-only run)

## Tests

- [ ] Validate that email suppression flags were honored (log inspection, absence of email sends).
- [ ] Spot-check a few logs for confirmed bookings and failure reasons.

## Notes

- Assumptions: Using White Horse Saturday hours (12:00–23:00); base URL from existing env unless specified.
- Deviations: Booking API reports “Restaurant is closed on the selected date.” — White Horse (and all restaurants) are configured closed on Saturdays, so 2026-04-04 slot fill blocked unless we add an operating-hours override or switch to an open date. Switched to weekday 2026-04-03. 12:00 slot hit ~20–30% goal (4–6 successes across runs). Later slots (12:15 onward) repeatedly failed due to capacity/timeouts even after manual retries (party range 1–12, up to 8 attempts each); no additional successes. Need guidance on relaxing party range or success criteria to progress.

## Batched Questions

- Base URL confirmation (local vs staging) if provided later.
