# Infrastructure, Database, and Testing Insights

## Bookings Table Schema (`supabase/migrations/20251019102432_consolidated_schema.sql`)

- **Purpose**: Defines canonical bookings table with lifecycle metadata, capacity integration fields, and constraints.
- **Key Columns**: `restaurant_id`, `customer_id`, `booking_date`, `start_time`, `end_time`, `booking_type`, `status`, `reference`, `client_request_id`, `idempotency_key`, `details`, confirmation token fields, loyalty points.
- **Constraints**:
  - `bookings_party_size_check` ensures positive party size.
  - `chk_time_order` ensures `start_at < end_at`.
  - `bookings_checked_out_after_checked_in` for lifecycle ordering.
- **Indexes**: On `restaurant_id`, `booking_date`, `status`, `start_at`, `reference`, `idempotency_key`, etc. Supports capacity queries and uniqueness lookups.
- **Triggers**: `set_booking_instants`, `set_booking_reference`, `update_updated_at`, `on_booking_status_refresh` for derived columns + lifecycle.
- **Policies**: Row-level security enabling staff CRUD, admin deletes, membership-based access.
- **Improvement Ideas**: Add partial index for high-frequency filters (e.g., `status IN ('pending','confirmed')`), ensure triggers tested for new fields.

## Capacity Integration Test (`tests/integration/capacity-api.test.ts`)

- **Scope**: Validates Supabase RPC metrics increment and override storage end-to-end.
- **Setup**: Grabs active restaurant, seeds/upserts customer and capacity rules, inserts override for test date, records metrics.
- **Assertions**: Confirms metrics increments (`success_count`, `conflict_count`, `capacity_exceeded_count`) and override metadata fields.
- **Notes**: Relies on actual Supabase instance; ensure environment variables set for CI.
- **Suggested Enhancements**: Add teardown deleting inserted override, incorporate booking creation flow to test full pipeline.

## Continuous Integration Workflow (`.github/workflows/ci.yml`)

- **Jobs**: Single `build-and-test` job on `ubuntu-latest`.
- **Steps**:
  1. Checkout code, setup pnpm@9, Node 20 with pnpm cache.
  2. Install dependencies (`pnpm install --frozen-lockfile`).
  3. Run lint (`pnpm lint`), type-check (`pnpm typecheck`), unit tests (`pnpm test`).
  4. Build Next app (`pnpm build`) and Reserve bundle (`pnpm reserve:build`).
  5. Install Playwright browsers, start production server, wait for readiness.
  6. Execute Playwright mobile smoke test (`pnpm test:e2e --project=mobile-chrome --grep @mobile-smoke`), tear down server.
- **Observations**: Sequential workflow ensures deterministic results; overall duration could be improved by parallelizing lint/typecheck/test.
- **Improvements**:
  - Split lint/typecheck/tests into matrix for faster feedback.
  - Cache Next build artifacts to speed up repeated runs.
  - Add artifact upload for Playwright traces/screenshots automatically.

## Overall Testing Posture

- **Unit**: Vitest configured with jsdom, targeted includes for server/ops/emails tests.
- **Integration**: Uses Supabase service key; ensures capacity metrics path verified.
- **E2E**: Playwright multi-browser matrix defined (Chromium, Firefox, WebKit, mobile) though CI runs only mobile smoke by default.
- **Gaps**:
  - Lack of automated coverage for rate limiter fallback, PastBooking guard, Reserve reducer.
  - Storybook/visual regression not integrated into CI.
- **Recommendations**:
  1. Add vitest suites for booking audit + rate limiter.
  2. Expand Playwright smoke to include desktop flows post build stabilization.
  3. Introduce lint rule/test to ensure Supabase migrations align with runtime enums.
