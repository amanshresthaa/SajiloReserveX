# Plan – Restaurant Booking Seed

## Goal

Create a Supabase seed that provisions the eight La Pen Inns pubs with complete booking data (150 bookings per restaurant: 60 past, 20 current-day, 70 future) and ensures several bookings use `amanshresthaaaaa@gmail.com`. Align verification tooling/tests with the new dataset.

## Assumptions

- Seed will run on a clean database via `supabase db reset`; we can safely `TRUNCATE` core tables before inserting.
- `restaurant_tables` either exists locally or is legacy; verification scripts should handle its absence gracefully instead of failing.
- We only need to seed `restaurants`, `customers`, `bookings`, and supporting tables (`restaurant_memberships` if helpful). Loyalty/program tables not required for this request.
- Current date at seed time is the reference for “past/current/future” distribution.

## Implementation Steps

1. **Author deterministic restaurant seed**
   - Create `supabase/seed.sql` (or update if present) that wipes existing booking-related tables and inserts the eight provided pubs with stable `slug`, optional `capacity`, contact info, and booking policies lifted from `scripts/update-real-restaurant-contacts.ts`.
   - Capture inserted IDs for downstream inserts and ensure one restaurant uses the fallback ID/slug expected by `getDefaultRestaurantId`.

2. **Seed customers (including special email)**
   - For each restaurant, generate ~50 distinct customers (lowercase emails, unique phone numbers) via `generate_series`, ensuring one dedicated customer per restaurant uses `amanshresthaaaaa@gmail.com` with a unique phone.
   - (Optional) Populate `customer_profiles` to keep metrics consistent (total bookings, covers, timestamps) using aggregated booking data once bookings are inserted.

3. **Generate bookings with required distribution**
   - Using `generate_series`, create 150 bookings per restaurant tied to the customer pool:
     - Indices 1–60 → past dates (e.g., `current_date - n`), mark status `'completed'` / `'cancelled'` mix.
     - Indices 61–80 → `current_date` bookings, status `'confirmed'`.
     - Indices 81–150 → future dates (`current_date + n`), status `'confirmed'` / `'pending'`.
   - Derive `start_time`/`end_time` ranges, compute `start_at`/`end_at` using `AT TIME ZONE 'Europe/London'`, and set unique `reference` codes (e.g., slug prefix + padded index).
   - Ensure several bookings (e.g., first 3 per restaurant) point to the special customer/email.

4. **Update verification tooling (TDD)**
   - Adjust `scripts/verify-seed.mjs` and `scripts/verify-sql.sh` to expect the new totals (8 restaurants, 1,200 bookings, ~400 customers depending on seed) and updated distribution (per-restaurant loop still valid).
   - Make table count resilient: only query `restaurant_tables` if the table exists, or switch expectation to `NULL` when absent.

5. **Add lightweight validation hooks**
   - Document/test steps: run `supabase db reset` (or `npm run db:seed`) locally, then execute `npm run db:verify` to confirm counts match expectations.
   - If full reset is too heavy for CI, provide SQL snippet/instructions for verifying counts manually.

## Open Questions

- Should we seed `restaurant_memberships` or application users alongside the bookings? (Assuming not unless user requests access control.)
- Desired customer count per restaurant? (Plan uses 50 customers × 3 bookings, adjustable if different ratios preferred.)
- Do we also need to seed `restaurant_tables` or adjust schema to reintroduce it? Pending confirmation after running seed locally.
