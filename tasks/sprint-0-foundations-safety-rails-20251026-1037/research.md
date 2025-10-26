# Research: Sprint 0 Foundations & Safety Rails

## Existing Patterns & Reuse

- Supabase migrations live under `supabase/migrations/` and follow raw SQL files with down-migration blocks separated by `-- +goose Down`. Existing DDL for bookings/tables is defined in the consolidated schema migration (`20251019102432_...`) and later patch files (e.g., `2025102109450*_...`).
- `server/observability.ts` and `server/capacity/telemetry.ts` already write to an `observability_events` table, but no table exists in the current migrations—suggesting prior audit flagged this gap.
- `allocations` table presently has a check constraint limiting `resource_type` to `'table'` and `'merge_group'` (`allocations_resource_type_check`), matching prior merge implementation.
- `server/feature-flags.ts` simply reflects booleans from `env.featureFlags` without extra gating; `lib/env.ts` exposes a flat `featureFlags` object sourced from `config/env.schema.ts`.
- Tests under `tests/server/capacity/*.test.ts` mock `env.featureFlags` to toggle atomic assignment paths; there is no production override at present.
- Fixture structure: `tests/fixtures/` currently houses auth/data helpers; creating new shared fixtures for layouts/bookings will fit the existing pattern of exporting typed helpers (e.g., `tests/fixtures/auth.ts`).

## External Resources

- Appendix.md (lines 1-170) documents desired allocator behavior: table holds mirror into `allocations` with `resource_type='hold'`, TTL semantics, and telemetry requirements.
- Prior task notes in `tasks/repo-audit-auto-manual-assign-20251026-0955/research.md` call out missing `observability_events` DDL, reinforcing the need for this migration.

## Constraints & Risks

- Supabase policy: migrations must target remote DB only; we cannot validate via local Supabase, so SQL must be double-checked manually.
- Existing data must remain intact—new migrations cannot drop data or alter existing columns destructively.
- Feature flag hardening must ensure production cannot hit legacy RPCs; careless overrides could break staging flexibility.
- Updating `types/supabase.ts` manually is error-prone; need to ensure new table definitions and enums stay consistent with SQL changes.
- Holds mirror into `allocations`; schema must support future constraints (FKs, cascading deletion) without blocking current data.

## Open Questions (and answers if resolved)

- Q: Should `observability_events` include restaurant/bookings foreign keys?  
  A: Appendix emphasizes telemetry context but existing writer only sends `context` JSON; optional FK columns can be nullable for future enrichment without blocking current writes.
- Q: How to enforce `resource_type` domain now that `merge_group` tables were dropped?  
  A: Maintain `'merge_group'` option per acceptance criteria; future migrations can remove if strategy changes.
- Q: Where should default flag values live?  
  A: `lib/env.ts` can compute defaults per environment while allowing overrides via new env vars.

## Recommended Direction (with rationale)

- Implement four new migration files (Up/Down) matching filenames provided, adding:
  - `observability_events` table with severity enum enforcement, optional booking/restaurant FKs.
  - `table_holds` & `table_hold_members` tables tying into `bookings` and `table_inventory`; index on `expires_at` for TTL sweeper; cascade delete hold members.
  - Nullable `merge_group_id` on `booking_table_assignments` with FK to `allocations` (aligns with mirror strategy) and supporting index.
  - Updated `allocations_resource_type_check` constraint to allow `'hold'`.
- Extend `config/env.schema.ts` and `lib/env.ts` to expose new flags (`holds.enabled`, `allocator.merges.enabled`, `allocator.requireAdjacency`, `allocator.kMax`) plus enforce atomic assignment in production via `server/feature-flags.ts`.
- Add a vitest covering production override behavior and integrate new fixtures into an existing selector test to ensure they load successfully.
