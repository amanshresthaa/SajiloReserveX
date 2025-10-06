# Plan: Fix service_role bookings flow regressions

1. Expand audit of service-client usage and resolve any missing objects (e.g., ensure `customer_profiles` table exists) alongside schema-wide privileges.
2. Update migrations to both create required tables (if absent) and grant `service_role` CRUD on all relevant public tables, sequences, and functions (with default privileges).
3. Re-run schema linting and document rollout/validation (service-role inserts, `/api/bookings` smoke test).
