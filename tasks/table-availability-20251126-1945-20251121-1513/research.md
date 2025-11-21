---
task: table-availability-20251126-1945
timestamp_utc: 2025-11-21T15:14:10Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Research: Table Availability — 2025-11-26 19:45 Slot

## Requirements

- Functional: Determine how many tables are unoccupied at 19:45 on 2025-11-26 and how many additional tables can be fitted/assigned in that slot, using Supabase CLI/MCP (remote only).
- Non-functional: Obey AGENTS policies (no local DB writes, no secrets in logs), provide traceable task artifacts, keep timezone assumptions explicit.

## Existing Patterns & Reuse

- Supabase schema includes `table_inventory` (physical tables), `booking_slots` (materialized availability per date/time), and `booking_table_assignments` (table assignments with start/end windows).
- Seed data and prior tasks use slot-based allocation; overlap constraints exist on `booking_table_assignments` (`assignment_window` GiST, `no_overlapping_table_assignments`).
- Scripts like `scripts/check_assignment_overlaps.sql` and `scripts/run-allocation-stress-test.sh` query bookings/assignments; can reuse their join logic for availability.

## External Resources

- Supabase remote project ref found in `supabase/.temp/project-ref` (mqtchcaavsucsdjskptc); pooler URL placeholder configured for remote access.

## Constraints & Risks

- Restaurant context may be multi-tenant; must target the correct restaurant (likely the single seeded venue unless specified). Wrong tenant would skew counts.
- Times are stored as `timestamptz`; need to confirm timezone expectations for a “19:45” request and align with DB data.
- Data freshness depends on remote DB; seed snapshot in `schema.sql` may differ from live state.

## Open Questions (owner, due)

- Which restaurant slug/ID should be used for the 19:45 slot? (Assume primary seeded restaurant unless clarified.) – Owner: @amankumarshrestha; Due: before querying.
- What timezone should “19:45” use if DB stores UTC? – Owner: @amankumarshrestha; Due: before final numbers.

## Recommended Direction (with rationale)

- Use Supabase MCP/CLI against the remote project to list restaurants and confirm the correct tenant, then compute availability for 2025-11-26 at 19:45.
- Derive unoccupied tables by joining `table_inventory` with `booking_table_assignments` overlapping the target window; cross-check with `booking_slots` counters if populated.
- Document any timezone/restaurant assumptions in the task folder and final answer for transparency.
