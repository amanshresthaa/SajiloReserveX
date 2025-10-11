# Implementation Plan: Eight Pub Seed Refresh

## Objective

Refactor `supabase/seed.sql` to seed the eight specified pubs with deterministic data and a 260-booking dataset matching the requested distribution.

## Success Criteria

- [x] Restaurants inserted with provided IDs, metadata, reservation settings.
- [x] Supporting tables (operating hours, service periods, customers, customer_profiles) populated for those pubs only.
- [x] Total bookings ≥ 250 with:
  - [x] 100 past bookings,
  - [x] 40 bookings on current date,
  - [x] Remaining bookings within current month future dates.
- [x] Booking statuses and metadata varied appropriately.
- [x] Seed script remains idempotent and remote-safe.

## Approach

- Maintain truncate/delete preamble to reset relevant tables.
- Define constants for booking distribution.
- Hardcode restaurant tuples from provided data.
- Generate customers deterministically per restaurant.
- Build booking sequence that distributes counts across pubs and assigns statuses, times, party sizes.
- Insert bookings then compute customer profiles.
- Append validation snippet for quick distribution check.

## Steps

1. Replace restaurant CTE with provided records (including timestamps, reservation fields).
2. Ensure operations reset relevant tables and remove existing rows for those IDs.
3. Generate customer pool (60 per restaurant for headroom) with deterministic emails/phones.
4. Build booking timeline using constants and bucket logic.
5. Insert bookings with metadata and references; ensure start/end times align with service periods.
6. Seed customer profiles based on bookings.
7. Add helper query comment for manual verification.

## Verification

- Manual inspection of resulting SQL.
- Run validation query after executing seed against remote/local environment (outside scope here).
