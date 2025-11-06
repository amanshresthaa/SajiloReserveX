# Implementation Plan: Loyalty Points Schema Mismatch

## Objective

We will realign loyalty award persistence with the deployed Supabase schema so bookings can store loyalty accruals without errors.

## Success Criteria

- [ ] Booking API records loyalty awards without Supabase column errors.
- [ ] Loyalty balances update in `loyalty_points` using `total_points` and remain visible in Ops views.
- [ ] Loyalty event logging succeeds with existing table structure.

## Architecture & Components

- `server/loyalty.ts`: adjust select/upsert/insert payloads to match current columns.
  State: none persisted locally beyond Supabase writes.

## Data Flow & API Contracts

- Supabase table `loyalty_points` expects `{ restaurant_id, customer_id, total_points, tier, updated_at }` when upserting.
- Supabase table `loyalty_point_events` expects `{ restaurant_id, customer_id, booking_id, points_change, event_type, schema_version, metadata, created_at }`.
- Booking endpoints call `applyLoyaltyAward` during confirmation.

## UI/UX States

- No direct UI change; Ops dashboards should continue displaying tiers/points with updated data.

## Edge Cases

- Zero or negative award amounts should no-op or deduct safely without going below zero.
- Repeated bookings for same customer should update the same row (conflict on restaurant+customer).

## Testing Strategy

- Existing lint/type checks.
- Manual: exercise booking API locally (already triggered during dev); ensure log no longer emits missing column error after change (post-verification noted in `verification.md`).

## Rollout

- No flags required.
- Monitor booking logs post-deploy for absence of Supabase column errors.
- Rollback by reverting `server/loyalty.ts` changes if needed.
