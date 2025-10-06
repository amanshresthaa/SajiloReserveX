# Research: Fix bookings permission error

## Error context

- Production POST `/api/bookings` failing with Postgres error `42501 permission denied for table bookings` surfaced via Supabase client.
- Supabase CLI reproduces the same error when attempting to insert into `public.bookings`, indicating a database privilege issue (not just API logic).

## Relevant server code

- `app/api/bookings/route.ts` (POST handler) calls `getServiceSupabaseClient()` before inserting into `bookings`. This path is used for both production and local environments.
- `server/supabase.ts#getServiceSupabaseClient` creates a Supabase client with the `SUPABASE_SERVICE_ROLE_KEY` (service role). This role bypasses RLS but still needs explicit table privileges.

## Database configuration findings

- `supabase/migrations/20241006000001_initial_schema.sql` enables RLS on `public.bookings` and grants `SELECT/INSERT/UPDATE/DELETE` **only** to the `authenticated` role (line 379). There is **no** grant to `service_role` for the `bookings` table.
- `supabase/migrations/20241006000004_grant_customers_service_role.sql` explicitly grants CRUD on `public.customers` to `service_role`, but there is no equivalent migration for `public.bookings`.
- No other migration (`rg "bookings TO service_role" supabase/migrations`) grants `bookings` privileges to `service_role`.

## Hypothesis

- The service client uses the `service_role` database role, which bypasses RLS but lacks explicit privileges on `public.bookings`. Postgres therefore raises `42501 permission denied` during insert.
- Granting `SELECT/INSERT/UPDATE/DELETE` on `public.bookings` (and potentially related sequences) to `service_role` should unblock the API while still letting RLS protect other clients.

## Open questions / confirmations needed

- Confirm whether any other API paths use `service_role` against tables without matching grants (e.g., `restaurant_tables`, `waiting_list`, etc.) to prevent similar failures.
- Determine if production migrations already ran up to the latest version; if not, ensure corresponding grant migration is deployed once created.

## Update (service role missing loyalty tables)

- New production error: `permission denied for table loyalty_programs` when POST `/api/bookings`.
- Confirms broader privilege gap: service_role lacks grants on loyalty tables created in `20241006000014_create_loyalty_tables.sql`.
- Current migration only covers bookings/audit tables; need schema-wide grants (or ensure every table touched by service role has explicit grants).

## Update (missing customer_profiles table)

- After expanding privileges, POST `/api/bookings` now fails with `Could not find the table 'public.customer_profiles'` (PGRST205). This indicates our database schema lacks the `customer_profiles` table expected by server code.
- Need to inspect migrations for creation of `customer_profiles` or determine intended table name (maybe `customer_loyalty_profiles`?).
- Verified existing migrations lacked `customer_profiles`; created new migration to add the table with aggregates and policies matching server expectations.
