# Implementation Plan: Fix hold window migration

## Objective

Ensure the `table_hold_windows` schema migration runs remotely without syntax errors while preserving conflict enforcement logic and keeping application code in sync.

## Success Criteria

- [ ] Supabase migration applies successfully on the remote database.
- [ ] Application code compiles and uses the updated column name for range overlap queries.
- [ ] Supabase type definitions reflect the new column name.

## Architecture & Components

- `supabase/migrations/20251029183500_hold_windows_and_availability.sql`: rename the generated range column, update constraint definitions, and align the booking status filter inside `is_table_available_v2`.
- `server/capacity/holds.ts`: adjust the overlap filter to target the new column name.
- `types/supabase.ts`: update table definitions and RPC typings to reference the new column name.

## Data Flow & API Contracts

- The exclusion constraint relies on the generated range column; renaming it must keep the constraint using the same computed range.
- RPC `is_table_available_v2` should evaluate against statuses that exist in `booking_status`; replace the outdated `'seated'` literal with `'checked_in'`.

## UI/UX States

- No UI changes; existing flows rely on server-side availability checks.

## Edge Cases

- Deployment environments where the migration partially applied should still be able to rerun safely via `IF EXISTS/IF NOT EXISTS` guards.
- Ensure the generated column remains stored, so the exclusion constraint functions correctly.

## Testing Strategy

- `supabase db push` against the remote database to confirm migration success.
- Run targeted TypeScript type checking (`pnpm tsc --noEmit`) if necessary to catch typing mismatches.
- No UI QA required (no UI change).

## Rollout

- No feature flag involved; once migration succeeds, code change can ship immediately.
- Monitor Supabase logs for migration success; rollback would require dropping/recreating the table if needed.
