# Verification

## Commands run

- `supabase db lint`

## Follow-up validation

- After applying the migrations to production, verify via Supabase SQL (service role) that inserts/selects on `public.bookings`, `public.customer_profiles`, and `public.loyalty_programs` succeed.
- Exercise POST `/api/bookings` in production to ensure bookings are created without permission or missing-table errors and that downstream updates (customer profiles, loyalty) behave.
- Optionally smoke-test loyalty accrual flows now that the schema and grants align.
