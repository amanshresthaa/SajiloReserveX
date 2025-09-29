# Coordination Notes

## Auth User Capture

- Partner with the frontend/auth feature owners to begin populating `customers.auth_user_id` and `bookings.auth_user_id` whenever a session creates or updates a booking.
- Document the shape of the Supabase session payload (email + user id) so the API branch for `?me=1` can prefer `auth_user_id` when available, while falling back to email for legacy rows.
- Target: align with Epic E3 so that adding `supabase_user_id` to `customers` becomes a straightforward migration.

## QA & Validation

- Once the `/api/bookings?me=1` endpoint is implemented, rerun unit/integration suites that touch booking listings to validate new constraint/index behaviour.
- Suggested smoke test: `SELECT * FROM public.bookings WHERE lower(customer_email) = lower('test@example.com') ORDER BY start_at DESC LIMIT 5;` to confirm the new index usage (`EXPLAIN` should show `Index Scan using bookings_customer_email_start_idx`).
- Ensure any database deploy pipeline executes the new migration with `psql` in autocommit mode so `CREATE INDEX CONCURRENTLY` succeeds.
