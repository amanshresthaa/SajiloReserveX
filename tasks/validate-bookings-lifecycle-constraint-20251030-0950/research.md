# Research: Validate bookings lifecycle constraint

## Requirements

- Functional:
  - Enforce lifecycle timestamp integrity by validating `bookings_lifecycle_timestamp_consistency`.
  - Introduce a global `user_profiles` entity linked 1:1 with `auth.users` and refactor `customers` to reference it.
  - Document ambiguous schema columns (`allocations.shadow`, `bookings.pending_ref`, `service_policy.allow_after_hours`).
  - Provide clear stored proc entrypoints for table assignments (single vs merged tables).
  - Enforce operating-hour checks inside `create_booking_with_capacity_check` and harden permissions to require the procedure.
  - Supply backfill scripts and constraint validation migrations in deterministic order.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Preserve production data integrity and minimize lock contention.
  - Ensure migrations are idempotent and safe on large datasets (statement timeout disabled within tx).
  - Maintain compatibility with existing API clients via updated Supabase types and explicit deprecation notes.

## Existing Patterns & Reuse

- `public.bookings` already defines the `bookings_lifecycle_timestamp_consistency` check constraint (currently `NOT VALID`).
- `public.customers` contains generated columns `email_normalized` / `phone_normalized` and nullable `auth_user_id`, providing anchors for the global profile backfill.
- Assignment logic lives in `public.assign_tables_atomic` / `public.assign_tables_atomic_v2`; we layer wrappers rather than rewrite core logic.
- `public.create_booking_with_capacity_check` is the canonical booking RPC; we extend it instead of introducing a new function to preserve capacity/idempotency semantics.

## External Resources

- [PostgreSQL `ALTER TABLE ... VALIDATE CONSTRAINT`](https://www.postgresql.org/docs/current/sql-altertable.html) — confirms the required command and behavior.
- [PostgreSQL `make_timestamptz`](https://www.postgresql.org/docs/current/functions-datetime.html) — used for timezone-aware booking windows.
- Supabase generated client (`types/supabase.ts`) for RPC signatures to update alongside new functions.

## Constraints & Risks

- Supabase operations must target the remote production project; no local databases per repo policy.
- Supabase MCP access token is not configured (`list_projects` returned `Unauthorized`), so SQL must execute via the existing `SUPABASE_DB_URL` environment variable — deviation logged.
- Lifecycle remediation scripts must be idempotent and avoid conflicting with application writes; chunking may be required for high-volume restaurants.
- `citext` extension creation requires superuser privileges; confirm availability before migration.
- Permission hardening (revoking direct inserts) can break clients still bypassing the RPC; rollout must coincide with application changes.

## Open Questions (owner, due)

- None currently; audit query returned zero inconsistent rows.

## Recommended Direction (with rationale)

- Run the lifecycle audit query (provided in migration 20251103090100) prior to remediation; confirmed `0` violations as of 2025-10-30 09:50 UTC.
- Apply ordered migrations:
  1. Remediate lifecycle data (20251103090100) and validate the constraint (20251103090700).
  2. Introduce `user_profiles`, add linking FK to `customers`, and backfill via staged email/phone matching (20251103090200 / 20251103090600).
  3. Document schema semantics (20251103090300) for downstream tooling.
  4. Add explicit assignment wrappers and deprecate legacy RPCs via comments while keeping logic centralized (20251103090400).
  5. Enhance `create_booking_with_capacity_check` with operating-hour enforcement and permissions hardening (20251103090500).
  6. Park future hardening (20251103090800) for when adoption is complete.
- Update Supabase TypeScript definitions to expose the new RPCs; ensure app code moves to the wrappers before removing legacy functions.
- Capture rollout dependencies (backups, staging dry-runs) in plan + verification docs for traceability.
