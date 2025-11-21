---
task: table-availability-20251126-1945
timestamp_utc: 2025-11-21T15:14:10Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Identify restaurant scope (slug/id) from Supabase.
- [x] Confirm timezone/slot interpretation for 19:45 on 2025-11-26.

## Core

- [x] Query active tables for the restaurant.
- [x] Query occupied tables at 2025-11-26 19:45 (overlap logic).
- [x] Compute unoccupied count and additional tables that can fit; store evidence in artifacts.

## UI/UX

- N/A (no UI changes).

## Tests

- [x] Cross-check counts by listing occupied vs free table IDs.
- [x] Validate against `booking_slots` entry if present for the time.

## Notes

- Assumptions:
  - Restaurant context: `White Horse Pub (Waterbeach)` (`cbdea463-1fc8-43a2-9909-b0393f530e94`), timezone `Europe/London`.
  - Slot interpreted as 2025-11-26 19:45 Europe/London; availability based on actual assignment windows (`start_at <= ts < end_at`).
  - Additional tables that can fit = currently unoccupied active tables (status not `out_of_service`).
- Deviations:
  - `booking_slots` row for the slot exists but shows placeholder-like counters (`available_capacity=999`, `reserved_count=0`), so calculations rely on live assignments instead.
  - Supabase MCP SQL access returned `Unauthorized` (missing access token), so queries ran via remote DB URL from `.env.local` using `psql` (read-only).

## Batched Questions

- None at this time.
