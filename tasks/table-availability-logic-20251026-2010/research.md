# Research: Table Availability Logic

## Existing Patterns & Reuse

- `computeBookingWindow` derives each booking's buffered seating window using venue policy turn-bands and buffers (`server/capacity/tables.ts:563`). The result feeds every downstream availability check.
- `tableWindowIsFree` cross-checks a table against the in-memory schedule map and treats any overlapping buffered window as a hard conflict (`server/capacity/tables.ts:610`).
- `loadAssignmentContext` is the single loader that hydrates tables, existing bookings, and schedule entries for a restaurant/date by reading `booking_table_assignments` (`server/capacity/tables.ts:1026`). Manual holds, auto-assign, and selector flows all reuse this context.
- The lighter `isTableAvailable` helper powers legacy/manual checks by querying `booking_table_assignments` directly and applying the same overlap logic in-process (`server/capacity/tables.ts:2824`).

## External Resources

- Supabase `booking_table_assignments` rows (public schema) – single source of truth for live table blocks.
- Venue policy turn-band defaults from `server/capacity/policy.ts` (e.g., lunch 12:00–15:00, 5 min post-buffer).

## Constraints & Risks

- Missing `booking.end_time` values fall back to `env.reserve.defaultDurationMinutes` (90 min by default), so data hygiene directly affects how long a table stays blocked (`server/capacity/tables.ts:542`).
- Time comparisons inside `isTableAvailable` rely on lexicographically comparable `HH:MM[:SS]` strings. Any deviation (e.g., "9:00" without leading zero) will mis-evaluate overlaps and can masquerade as “all-day” conflicts (`server/capacity/tables.ts:2851`).
- Stale `booking_table_assignments` rows survive until explicitly unassigned; cancelled/no-show bookings are skipped by status guards, but custom states outside `INACTIVE_BOOKING_STATUSES` keep the block alive.
- Policy buffers are applied symmetrically (pre/post). If custom venue configs extend buffers aggressively, the effective block can span an entire service.

## Open Questions (and answers if resolved)

- Q: Do we ever persist non-zero-padded `start_time` / `end_time` strings from upstream systems?
  A: Unknown – need to audit raw Supabase values to confirm.
- Q: Are completed/finished bookings meant to drop assignments automatically, or do we rely on ops workflows to unassign?
  A: Unclear – behaviour depends on external processes not represented in this repo.
- Q: Can venue-specific policies stretch buffers beyond a single service (e.g., brunch bleeding into dinner)?
  A: Needs confirmation from policy configuration data.

## Recommended Direction (with rationale)

- Reproduce the “blocked all day” case by dumping the schedule produced by `loadAssignmentContext` for the affected table/date to see the exact [`start`, `end`] intervals involved.
- Validate raw `booking_table_assignments` records for the table to confirm times are zero-padded and statuses enter the inactive allowlist; fix data or extend guards if not.
- If buffers/durations are at fault, capture venue policy overrides and check whether `bandDuration` + `buffer.post` legitimately spans the day; adjust configuration or clamp values as needed.
- Consider normalising `start_time` / `end_time` inside `isTableAvailable` to `DateTime` objects to avoid string-comparison edge cases before shipping further fixes.
