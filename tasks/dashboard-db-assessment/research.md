# Dashboard DB Assessment — Research

## Task Outline & Subtasks

- Understand dashboard MVP data needs (list, edit/reschedule, cancel, telemetry) and map them to database entities.
- Inspect existing schema + policies to determine available fields, constraints, and access patterns.
- Review seed data to confirm representative records for upcoming/past bookings and customer linkage.
- Identify potential schema/index gaps or risks impacting `/api/bookings?me=1` and mutation flows.

## Inputs & Verification Methods

- Primary sources: `database/database.sql`, `database/seed.sql` (inspected via `sed`).
- Targeted searches: `rg` to locate booking triggers, indexes, policies (validate assumptions around computed times & RLS).
- Cross-check: Re-examined seeds for upcoming/past coverage and ownership data, ensured triggers align with query needs.
- External best-practice check: validated Postgres email lookup indexing guidance (see Plan step for rationale integration).

## Data Requirements vs Existing Schema

1. **Customer filtering (`?me=1`)**
   - Booking ownership stored via `bookings.customer_id`, `customer_email`, `customer_phone`; `customers` table enforces normalized email/phone per restaurant.
   - No direct unique link to Supabase user yet (`auth_user_id` nullable on bookings/customers); optional RLS story (E3) hints future addition.
   - Indexes exist on `(restaurant_id, booking_date, start_time)` and `(restaurant_id, idempotency_key)` but none on `customer_email` nor `customer_id` for quick user-scoped lookups.
2. **List fields**
   - `start_at`, `end_at` computed by trigger from `booking_date`, `start_time`, `end_time`; `slot` generated column for overlap; satisfies ISO conversions.
   - `status` enum matches dashboard states (`confirmed`, `pending`, `pending_allocation`, `cancelled`).
   - `restaurant_id` foreign key -> restaurant name via join; seeds create eight restaurants with stable IDs.
3. **Editing/Rescheduling**
   - Overlap prevention via `bookings_no_overlap` GiST constraint on `(table_id, slot)` covering relevant statuses.
   - `client_request_id`, `idempotency_key` ensure idempotent updates; triggers recompute times when updating.
   - No explicit cutoff metadata stored in table; assumption: enforced at application/service layer.
4. **Cancelling**
   - `status` column updates allowed; service layer likely enforces audit/logging. `updated_at` auto-touched by trigger.
   - Soft-delete approach; `loyalty_points` etc. not auto-cascading.
5. **Pagination & Sorting**
   - Sorting by `start_at` possible (timestamptz). Need composite index for `(customer_email_lower, start_at)` or `(customer_id, start_at)` for performant queries.
6. **Observability/Events**
   - `analytics_events` table exists but focused on server-side events; no immediate DB changes needed for client telemetry (handled via API).

## Seed Coverage & Sample Data

- Seed script populates restaurants, areas, tables, customers with deterministic email patterns per restaurant.
- Bookings generated for ~90 days past to 14 days future, covering `confirmed` statuses and subsequent updates to mark ~40 past bookings `cancelled`.
- Ensures both upcoming and past bookings exist; includes optional notes.
- No seeded linkage to `auth_user_id`, meaning `/api/bookings?me=1` must rely on email/phone matching initially.

## Policies & Access

- RLS currently grants tenant-level read via `tenant_permitted(restaurant_id)` to authenticated; no customer-facing policies. API likely uses service role or bypass via `service_role` key.
- No customer-level RLS preventing cross-tenant access when using service role. Optional Story E3 suggests adding `supabase_user_id` and policies for future-proofing.

## Identified Risks & Gaps

- **Lookup performance**: Missing index on `lower(customer_email)` (or `customer_id`) may cause sequential scans when fetching bookings by session email across restaurants. Potential composite index with `start_at` aids sorting/pagination.
- **Email normalization mismatch**: `bookings.customer_email` constraint enforces lowercase (via domain?). Domain uses regex but not case-fold; table lacks automatic lower-case generation. Need to verify that insert path lowercases email to match session `lower(email)`. Seeds use lowercase, but enforcement relies on application.
- **Phone normalization**: `bookings` table stores raw phone string, not normalized; queries relying on phone for ownership may need normalization or join via `customers.phone_normalized`.
- **Auth linkage**: Without populated `auth_user_id` / `supabase_user_id`, account merges across restaurants depend solely on email. This is acceptable short-term but should be documented.
- **Time zone handling**: Trigger recalculates `start_at` on updates; need to ensure dashboard uses `start_at` to avoid recompute issues from `booking_date` & times if they ever get out-of-sync.

## Open Questions / Uncertainties

- Source of cutoff policy data (not stored in DB). Assuming handled algorithmically elsewhere; note for plan.
- Whether `customers_restaurant_contact_uidx` uniqueness causes issues for users changing phone numbers; likely manageable but needs app-level flow.
- Confirm domain `email_address` enforces lowercase: check domain definition to ensure case-insensitive regex. (Regex uses `~*` with uppercase pattern plus case-insensitive flag, so both upper/lower accepted; no automatic lowercase.)
