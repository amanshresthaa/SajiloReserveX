# Research: Booking confirmation 500 error

## What we saw

- Reproduced server log from `/api/bookings` POST during the “Review and confirm” step. Supabase responds with `code: "42P10"` and message `"there is no unique or exclusion constraint matching the ON CONFLICT specification"`.
- The stack trace shows the error surfaces inside `useReservationWizard` after `errorReporter.capture`, confirming the API call fails before completing the booking.

## Relevant code paths

- `app/api/bookings/route.ts:251-268` calls `upsertCustomer` before inserting the booking. This is the only place the failing request can originate.
- `server/customers.ts:48-96` implements `upsertCustomer`. It uses `client.from("customers").upsert(insertPayload, { onConflict: CUSTOMER_CONFLICT_KEY })` with `CUSTOMER_CONFLICT_KEY = "restaurant_id,email_normalized,phone_normalized"`.
- Supabase schema (`supabase/migrations/20241006000001_initial_schema.sql:55-71` and `current.sql:101-105`) defines generated columns `email_normalized` and `phone_normalized`, plus unique constraints on `(restaurant_id, email_normalized)`\_partial and `(restaurant_id, email_normalized, phone_normalized)`.

## Hypothesis

- The ON CONFLICT clause requires a matching unique or exclusion constraint on the target database. The error indicates the environment handling the user’s request is missing the composite unique constraint on `(restaurant_id, email_normalized, phone_normalized)`.
- Possibilities:
  - Local database schema is stale (migration `20241006000003_add_customer_contact_unique.sql` not applied).
  - Supabase project (if remote) never received the composite unique constraint.
  - Another environment recreated the `customers` table without the composite index.
- Because there _are_ unique constraints on `(restaurant_id, email_normalized)` and `(restaurant_id, phone_normalized)` individually, the composite clause fails even though the columns exist.

## Patterns in codebase

- Other scripts (e.g. `scripts/db/backfill-customers-loyalty.sql:31-34`) rely on the same composite ON CONFLICT clause, implying the intended constraint should exist.
- When conflicts are expected, the code usually tries the insert and, on unique violation (`23505`), looks up existing records and reuses them (see `app/api/bookings/route.ts:298-341`).

## Open questions / validation ideas

- Confirm whether local Supabase migrations are up to date (`supabase db reset` or `supabase db push`?).
- Should the application gracefully handle missing composite constraint by falling back to a lookup + update path instead of relying on `ON CONFLICT`? This would harden the API even if the migration lags.
- Do we have to support legacy environments where only the individual unique constraints exist? If yes, code change is required; otherwise a migration fix might suffice.

## New findings (permission denied)

- After adding code fallback, the `/api/bookings` POST now fails with Postgres error `42501` (`permission denied for table customers`).
- The failing statement is still the customer upsert. When the database honours the composite `ON CONFLICT` target the insert runs, but the current database role is prevented from inserting into `public.customers`.
- Schema review: `supabase/migrations/20241006000001_initial_schema.sql:320-348` enables RLS on `public.customers` and adds policies that allow staff (restaurant members) to `SELECT/INSERT/UPDATE` rows. The app uses `getServiceSupabaseClient()` which should authenticate with the Supabase service role and bypass RLS. A pure permission error means the connected role does not have basic `INSERT` privileges on `public.customers`.
- In the same migration, explicit grants are given to the `authenticated` role (`GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;`). No grant is issued to `service_role`. If the service key maps to the `service_role` database role (rather than a superuser), that role needs its own grant.
- Other tables (e.g. `public.bookings`) receive similar grants; since bookings inserts succeed, it’s possible the Supabase project already has implicit privileges for those tables or custom grants have been applied manually. The missing grant on `public.customers` is likely the source of the `42501` response.

## Hypothesis

- The Supabase instance backing this environment was provisioned without granting `INSERT` on `public.customers` to the `service_role`. The fallback code now reaches the insert path, exposing this misconfiguration. Running the migration `20241006000003_add_customer_contact_unique.sql` alone does not add the needed grant.
- Fixing the database grant (either manually or via migration) should unblock the booking flow without further code changes.
