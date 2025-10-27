# Implementation Plan: Table Availability Logic

## Objective

Map the end-to-end table availability flow and pinpoint why certain tables appear blocked for an entire day, so we can target the faulty logic with high-confidence fixes.

## Success Criteria

- [ ] Document the data pipeline from Supabase rows → in-memory schedule → availability checks with concrete code references.
- [ ] Surface at least one reproducible hypothesis for the all-day block along with validation steps/metrics to confirm or refute it.

## Architecture & Components

- `computeBookingWindow` (`server/capacity/tables.ts:563`): Converts booking metadata into buffered block windows.
- `loadAssignmentContext` (`server/capacity/tables.ts:1026`): Hydrates tables, bookings, and populates the schedule map used everywhere else.
- `tableWindowIsFree` & `filterAvailableTables` (`server/capacity/tables.ts:610`, `634`): Perform the overlap checks against the schedule map.
- `isTableAvailable` (`server/capacity/tables.ts:2824`): Legacy/manual availability helper using direct Supabase lookups.

## Implementation Strategy — Two-Tiered Availability

- Extend `TableScheduleEntry` to carry both dining and block intervals so downstream logic can reason about guest presence separately from operational buffers.
- Populate the new shape inside `loadAssignmentContext`, reusing `computeBookingWindow` outputs to avoid re-deriving intervals.
- Update `tableWindowIsFree` (and any consumers) to compare a new booking's block window only against existing bookings' dining windows, allowing buffer overlap while preserving guest-seat exclusivity.

## Data Flow & API Contracts

- Inputs: `booking_table_assignments`, `table_inventory`, `bookings`, `table_holds` tables queried via Supabase service clients.
- Intermediate state: `Map<tableId, TableScheduleEntry[]>` keyed by table with `[startMs, endMs)` intervals.
- Outputs: boolean availability decisions and conflict summaries returned to API routes (`src/app/api/staff/manual/hold/route.ts`, `src/app/api/staff/auto/confirm/route.ts`).

## UI/UX States

- Not applicable (server-side analysis), but manual ops dashboards surface conflicts emitted by `createManualHold` and `evaluateManualSelection`.

## Edge Cases

- Missing `start_time` / `end_time` on bookings (falls back to default duration).
- Bookings in non-standard statuses that are not part of `INACTIVE_BOOKING_STATUSES`.
- Buffers that push the block outside the service boundary (throws `ServiceOverrunError`).

## Testing Strategy

- Instrument `loadAssignmentContext` for the affected restaurant/date to log computed intervals and confirm overlap math.
- Write a unit-style reproduction for `isTableAvailable` comparing zero-padded vs non-padded times to expose lexical issues, if observed in data.

## Rollout

- Deliver analysis as documentation + recommended debug steps; coordinate with ops to capture real booking IDs before attempting code changes.
