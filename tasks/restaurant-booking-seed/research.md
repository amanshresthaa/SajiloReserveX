# Research – Restaurant Booking Seed

## Source Material

- `supabase/migrations/20251006170446_remote_schema.sql` defines the relevant tables (`public.restaurants`, `public.customers`, `public.bookings`, `public.restaurant_memberships`, etc.) including required columns, defaults, and constraints.
- `types/supabase.ts` mirrors the generated Supabase types and confirms optional vs. required fields on inserts for the above tables.
- `scripts/update-real-restaurant-contacts.ts` lists the eight La Pen Inns pubs with contact details that match the user-provided data (names, domains, emails, phone numbers, addresses, booking policies).
- `scripts/verify-seed.mjs` and `scripts/verify-sql.sh` show the current verification expectations (8 restaurants, 96 restaurant_tables entries, 640 customers, 400 bookings with a 120/40/240 past‑today‑future split); these numbers no longer align with the new request (150 bookings per restaurant, i.e., 1,200 total, with 60/20/70 distribution per restaurant).
- `app/api/test/bookings/route.ts` demonstrates how bookings are currently created (start/end time handling, customer creation, default values, JSON `details`, etc.) and is a good pattern to follow for timestamps/statuses.
- `server/supabase.ts` reveals the default restaurant ID fallback (`39cb...`) and how the app resolves a default restaurant via slug, which we should maintain in seeded data.

## Key Constraints & Patterns

- `public.restaurants`
  - Required: `name`, `slug`, `timezone` (defaults to `Europe/London`), `created_at`, `updated_at`.
  - `slug` must match regex `^[a-z0-9]+(-[a-z0-9]+)*$` and is UNIQUE.
  - Optional: `capacity`, `contact_email`, `contact_phone`, `address`, `booking_policy`.
- `public.customers`
  - Required: `restaurant_id`, `full_name`, `email` (must already be lowercase), `phone`, `marketing_opt_in` (default `false`), `created_at`, `updated_at`.
  - Generated columns handle normalized email & phone; uniqueness constraints apply per restaurant.
- `public.bookings`
  - Required: `restaurant_id`, `customer_id`, `booking_date`, `start_time`, `end_time`, `party_size`, `customer_name`, `customer_email`, `customer_phone`, `reference`, `start_at`/`end_at` must respect `start_at < end_at`.
  - Defaults: `booking_type` (`dinner`), `status` (`confirmed`), `seating_preference` (`any`), `source` (`web`), `client_request_id` (`gen_random_uuid()`), `marketing_opt_in` (`false`).
  - `reference` must be unique; `start_at` / `end_at` should be timezone-aware ISO strings to satisfy downstream usage.
- `public.restaurant_memberships`
  - Required: `user_id`, `restaurant_id`, `role`; used to tie staff/owners to restaurants.
- Email `amanshresthaaaaa@gmail.com` must receive “a few” bookings; we can create a dedicated customer per restaurant using this email (or allocate bookings across multiple restaurants) while ensuring we also create other customers so uniqueness constraints permit 150 bookings.

## Gaps / Considerations

- There is currently **no** `supabase/seed.sql` in the repo, so we will add one (or equivalent script) aligned with Supabase CLI expectations.
- Verification scripts (`scripts/verify-seed*.{mjs,sh}`) will need updating to reflect new totals after the seed changes; otherwise `npm run db:verify` will fail. Need to coordinate plan accordingly.
- `scripts/verify-seed.mjs` references `public.restaurant_tables`, but the schema file/types do not define that table—this may be legacy or managed elsewhere; seed should either populate if the table exists locally or the verification script must be adjusted.
- We must decide on deterministic slugs/IDs (either fixed UUIDs or generated via `gen_random_uuid()`) to keep references stable between restaurants, customers, and bookings.
- Booking distribution requirement: 150 per restaurant split into 60 past, 20 “current” (assume “today”), and 70 future bookings. Need consistent date windows so tests/regression tolerant (e.g., base on `DATE '2024-01-01'` relative to `CURRENT_DATE`?); using relative dates in seed ensures the expectation holds at seed execution time.
- Ensure at least a subset of bookings use the provided customer email while not violating unique constraints (same email per restaurant is allowed, but consider if multiple bookings per customer are acceptable—likely yes).
