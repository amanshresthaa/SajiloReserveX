# Plan: Fix `/api/bookings` customer upsert failure

1. Code resiliency (done)
   - Keep the upsert fallback logic in place to handle environments missing the composite constraint.

2. Database permissions grant
   - Add a Supabase migration that grants `SELECT, INSERT, UPDATE, DELETE` on `public.customers` to the `service_role` role so service-key operations can bypass RLS safely.
   - Include the same grant for `public.customer_profiles` to keep follow-on writes consistent (they run in the same request).

3. Verification
   - Run `pnpm run lint` to ensure TypeScript compilation still passes after touching migration files.
   - Encourage the user to apply the new migration (`supabase db push` or run SQL manually) and retry the booking flow to confirm the `42501` error disappears.
