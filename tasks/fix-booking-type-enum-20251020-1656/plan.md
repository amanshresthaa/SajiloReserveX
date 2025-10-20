# Implementation Plan: Fix Booking Type Enum Migration

## Objective

We will unblock deployment of the booking occasions migration by ensuring its data-fix steps run without enum coercion errors so the catalog and foreign keys can be established.

## Success Criteria

- [ ] `supabase db push` applies `20251020140700_add_booking_occasions_catalog.sql` without errors.
- [ ] Migration remains idempotent and safe to rerun.

## Architecture & Components

- Modify `supabase/migrations/20251020140700_add_booking_occasions_catalog.sql`.
- Leverage text casting when comparing/normalizing enum-origin values.

## Data Flow & API Contracts

Endpoint: N/A (database migration)
Request: N/A
Response: N/A
Errors: Migration should avoid enum coercion failures.

## UI/UX States

- Loading: N/A
- Empty: N/A
- Error: N/A
- Success: N/A

## Edge Cases

- Re-running migration after partial failure must succeed; comparisons should tolerate both enum and text column types.
- Ensure no unintended updates occur if data already normalized.

## Testing Strategy

- Unit: N/A
- Integration: Run `supabase db push` against remote (as per workflow) to confirm migration succeeds.
- E2E: N/A
- Accessibility: N/A

## Rollout

- Deploy via standard migration push; no feature flag needed.
