# Dashboard DB Assessment — Implementation TODO

- [x] Backfill existing `bookings.customer_email` values to lowercase to satisfy new constraint.
- [x] Add `bookings_customer_email_lower` check constraint to enforce lowercase emails.
- [x] Create expression index on `lower(customer_email)` with `start_at` coverage for `/api/bookings?me=1`.
- [x] Create supporting `(customer_id, start_at)` covering index.
- [x] Add global index on `customers.email_normalized`.
- [x] Provide coordination note for capturing `auth_user_id` in future release and advise QA on rerunning API/unit tests.
