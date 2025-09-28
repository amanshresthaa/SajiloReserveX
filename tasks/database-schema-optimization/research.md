# Research – Database Schema Optimisation & Code Alignment

## Sources Consulted

- Primary schema definition: `database/database.sql` (Postgres/Supabase compatible).
- Legacy/production snapshot: `current.sql` (warning header indicates non-executable dump).
- Migration entry point: `database/migrations/index.sql` (older schema baseline).
- Seed data: `database/seed.sql`.
- Application usage:
  - Booking service logic `server/bookings.ts`.
  - REST handlers `app/api/bookings/*.ts` & dashboard view `app/dashboard/page.tsx`.
  - Supporting modules (`server/customers.ts`, `server/analytics.ts`, `server/observability.ts`).
- Generated Supabase types: `types/supabase.ts`.
- Ancillary docs/scripts (`docs/observability`, `scripts/db/*`).

Cross-verification performed via `rg`, `nl`, and manual diff review across the above artefacts.

## Schema State & Gaps

- `database/database.sql` has expanded V2 schema: `bookings` now carries `start_at`, `end_at`, generated `slot` range, idempotency primitives (`client_request_id`, `pending_ref`, `idempotency_key`, `details` JSON). Verified at `database/database.sql:220-247`.
- Production snapshot (`current.sql`) lags: includes `client_request_id` default but **omits** `pending_ref`, `idempotency_key`, `slot`, etc. (`current.sql` entries stop at `client_request_id` default). This suggests the repo schema is ahead of deployed state.
- Migration entry (`database/migrations/index.sql`) matches older schema (no new columns). Running migrations alone would not materialise the V2 columns.
- RLS and policy blocks in `database/database.sql` are comprehensive but rely on dynamic `DO` blocks. Need to ensure any optimisation preserves idempotency and service-role policies.
- Seed script already writes the V2 columns (`client_request_id`, `idempotency_key`, `details`) for deterministic fixtures (`database/seed.sql:298-338`).

## Application Alignment Findings

- Generated Supabase types are stale:
  - `types/supabase.ts:85-154` lacks the new booking columns (`start_at`, `end_at`, `slot`, `auth_user_id`, `client_request_id`, `pending_ref`, `idempotency_key`, `details`).
  - Downstream TS relies on these types (e.g. `server/bookings.ts` typedef alias `BookingRecord = Tables<"bookings">`). Missing fields obstruct compile-time enforcement.
- Booking insert/update paths omit new required fields:
  - `server/bookings.ts:453-488` inserts omit `client_request_id`, `pending_ref`, `idempotency_key`, `details`, `start_at`, `end_at`. Schema currently demands at least `client_request_id` (no default) and expects the trigger `tg__bookings_compute_times` to backfill `start_at/end_at`. Without defaults, inserts will fail.
  - `app/api/bookings/route.ts` and `/[id]/route.ts` never generate `client_request_id` or idempotency keys, so any tightened schema will break runtime behaviour unless code is updated.
- Read paths (dashboard, API GET) select `*` or explicit column lists without the new fields; UI currently ignores richer data (e.g. `details` JSON, `start_at`). Opportunity to surface or at least tolerate these columns.
- Analytics, observability, loyalty modules interact with surrounding tables correctly but rely on the outdated `Tables` typing, so they too miss awareness of new columns (e.g. analytics events could log `pending_ref` when available).

## Potential Redundancies / Untapped Tables

- `booking_drafts` and `pending_bookings` exist in schema + seed but have **no application references** (confirmed via `rg`). Need to confirm with stakeholders whether to keep as future work or prune for clarity/perf.
- `observability_events`, `analytics_events`, `stripe_events`, `audit_logs` are actively used (API handlers & scripts). Retain but ensure schema indexes match query patterns (current indexes cover event type/time).

## Performance / Constraint Notes

- `bookings` adds a GiST exclusion constraint (`bookings_no_overlap`) on `(table_id, slot)` requiring `btree_gist`. Need to ensure migrations enable `btree_gist` (they currently do).
- Additional indexes: unique `(restaurant_id, client_request_id)` & `(restaurant_id, idempotency_key)` at `database/database.sql:286-294`. Code must enforce request IDs to leverage these.

## Testing & Verification Landscape

- Automated: Vitest (`npm run test`), Playwright (`test:e2e`), plus targeted server tests under `tests/` (booking reference generator, auth/email flows). No integration tests currently asserting DB schema alignment.
- Manual flows to verify post-change: API booking lifecycle (create/update/delete), Supabase auth (magic link) in Next app, Stripe webhook handling (relies on `stripe_events`).

## Open Questions / Risks

1. Should dormant tables (`booking_drafts`, `pending_bookings`) be removed or retained behind feature flags? No code references today.
2. Is `pending_ref` truly required by business logic? Not referenced yet; confirm before enforcing NOT NULL.
3. Need clarity on canonical schema source: migrations vs `database/database.sql`. Harmonisation required to avoid drift.
4. Updating Supabase types requires either regenerating via CLI or manual alignment; confirm preferred workflow.

Uncertainties flagged above will influence the planning phase; recommend resolving before implementation to avoid breaking live flows.
