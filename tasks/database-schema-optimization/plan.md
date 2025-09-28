# Plan – Database Schema Optimisation & Code Alignment

## 0. Canonical Schema Decision & Scope Guardrails

1. Treat `database/database.sql` as the source of truth for the optimised schema (includes V2 columns: `start_at`, `slot`, idempotency + pending refs, analytics policies). Harmonise `database/migrations/index.sql` and `database/seed.sql` to match.
2. Retain supportive tables (`audit_logs`, `analytics_events`, `observability_events`, `stripe_events`, loyalty tables). Flag `booking_drafts` / `pending_bookings` as dormant but keep unless product says otherwise (document in changelog).
3. Enforce Postgres extensions (`pgcrypto`, `uuid-ossp`, `btree_gist`) at migration entry to keep exclusion constraint viable.

## 1. Schema Updates (SQL)

1. **Bookings table**:
   - Keep `start_at`, `end_at`, computed `slot` range, `client_request_id`, `pending_ref`, `idempotency_key`, `details`.
   - Add explicit defaults where operationally needed (`client_request_id` via trigger or default?) Decide after code audit; aim for the code to always send values while providing safe default fallback.
   - Ensure unique indexes exist (`pending_ref`, `(restaurant_id, idempotency_key)`, `(restaurant_id, client_request_id)`), matching comment lines in `database/database.sql:286-294`.
2. **Migrations**:
   - Update `database/migrations/index.sql` so a fresh bootstrap yields the optimised schema (mirror the revised DDL + constraints + policies).
   - Consider separate delta migration file if repo expects incremental patches; document whichever path is taken.
3. **Triggers & policies**: Verify `tg__bookings_compute_times` and policy DO blocks compile after changes. Cross-check with `current.sql` for regressions.

## 2. Seed Data

1. Align inserts with final column list (already includes `client_request_id`, `idempotency_key`, `details`, but update if column defaults change).
2. Ensure waitlist, loyalty, stripe, observability fixtures still satisfy constraints (e.g., unique indexes, new NOT NULL fields).
3. Re-run script in dry-run (psql or textual validation) to confirm idempotency/path coverage.

## 3. Supabase Type Definitions

1. Update `types/supabase.ts` to reflect the optimised schema—especially `bookings`, `restaurant_tables`, `customers`, and any table whose shape changed (include `start_at`, `end_at`, `slot`, `auth_user_id`, `client_request_id`, `pending_ref`, `idempotency_key`, `details`).
2. Ensure enums mirror schema (booking statuses/prefs already aligned but recheck after edits).
3. Cross-verify by generating lightweight TypeScript compile check (e.g., `tsc --noEmit`).

## 4. Server-Side Code Alignment

1. `server/bookings.ts`
   - Expand payload contracts for `insertBookingRecord` / `updateBookingRecord` to handle new fields.
   - Generate and persist `client_request_id` & `pending_ref` when creating bookings; accept optional `idempotency_key` from callers.
   - Surface `details` JSON (build helper to assemble metadata from request—e.g., marketing flag, platform, device?).
   - Ensure audit snapshots include new fields where relevant (`AUDIT_BOOKING_FIELDS`).
2. `app/api/bookings/route.ts`
   - Accept `Idempotency-Key` header (and optional body override) to populate `idempotency_key` + `client_request_id`.
   - Add request-scope UUID fallback plus `pending_ref` creation.
   - Return these identifiers in responses for observability (and to inform client retries).
   - Update waitlist branch to forward `pending_ref` + `client_request_id`.
3. `app/api/bookings/[id]/route.ts`
   - Persist idempotency data on updates if provided.
   - Ensure responses include the enriched fields.
4. `server/analytics.ts` & downstream logging: extend payload metadata to include `pending_ref`, idempotency info when available.
5. `server/emails/bookings.ts`: if `start_at/end_at` now reliable (post-trigger), use them when formatting dates (avoid time zone drift).
6. Update any other modules referencing `Tables<"bookings">` to accommodate new fields (e.g., `server/customers.ts` when recording statistics, `server/observability.ts` context).

## 5. Client-Side Alignment

1. Reservation flow (`components/reserve/booking-flow/index.tsx`):
   - Generate a stable UUID per submission attempt (e.g., `useRef(crypto.randomUUID())`) and send via `Idempotency-Key` header + optional body field for server fallback.
   - Include the new response fields in reducer state if useful (store `pending_ref`, `client_request_id`).
2. Any other consumers (Vite app under `reserve/`): audit `reserve/features/reservations/wizard/api/*` to ensure they pass idempotency/pending data through.

## 6. Cleaning Up Dormant Structures (Optional)

- If time permits, either remove `booking_drafts` / `pending_bookings` or add TODO documentation clarifying they’re reserved for future use.
- Ensure removal decision aligns with product expectations (for now plan assumes keep, but code remains detached).

## 7. Verification Strategy

1. Static checks: `npm run lint`, `npm run typecheck` (or narrower `tsc --noEmit server/**/*.ts app/api/**/*.ts`) to confirm type alignment.
2. Unit / integration: run focused Vitest suites touching booking services (`tests/server`), plus targeted new tests if we add helpers.
3. Manual validation checklist:
   - Create booking via UI & confirm 200 response, inspect DB insert (simulate via Supabase or logging) for `client_request_id`, `pending_ref`, `idempotency_key`.
   - Repeat POST with same idempotency key to ensure rejection (409) and confirm server logs/analytics reflect dedupe.
   - Update & cancel flows still succeed; waitlist path returns `pending_ref`.
   - Supabase auth (magic link) unaffected (run through `npm run dev` smoke or rely on existing Playwright script if available).
   - Stripe webhook: seed-based dry run to ensure schema still matches handler expectations.
4. Document verification results + manual steps in final summary.

## 8. Documentation & Follow-Up

1. Update `database/schema.md` (or create new changelog) describing optimisations and how to apply them.
2. Add README snippet (or developer docs) explaining new idempotency requirements for clients.
3. Outline next steps / risks (e.g., enforce front-end retries to reuse `Idempotency-Key`).
