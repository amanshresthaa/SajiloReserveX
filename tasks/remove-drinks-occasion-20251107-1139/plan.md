# Implementation Plan: Remove Drinks Occasion from Booking Flow

## Objective

Ensure the booking wizard no longer surfaces the `drinks` occasion by eliminating any backend data that marks it active or references it.

## Success Criteria

- [ ] `booking_occasions` shows `drinks` with `is_active = false` (or no row).
- [ ] No `restaurant_service_periods` rows reference `booking_option = 'drinks'`.
- [ ] Schedule endpoint stops returning `drinks` for all restaurants after cache refresh.

## Architecture & Components

- Data layer only; no code changes expected unless data update fails and schema logic must be adjusted.
- Source tables: `booking_occasions`, `restaurant_service_periods` (Supabase Postgres).

## Data Flow & API Contracts

- Schedule API reads from `booking_occasions` and `restaurant_service_periods`. Once data is updated, downstream API responses will automatically exclude `drinks`.

## UI/UX States

- Implicit: Booking wizard options list should no longer include `drinks`. Same loading/error handling remains unchanged.

## Edge Cases

- Restaurants that legitimately need `drinks` must be identified before removing. Capture evidence if exceptions exist.
- Existing reservations tagged with `drinks` remain but should not impact new booking options.

## Testing Strategy

- Data verification via Supabase queries before/after updates.
- Optional schedule endpoint fetch (if tooling available) to confirm removal post-update.

## Rollout

- Direct DB update (remote Supabase). Changes take effect immediately; no feature flag.
- Document SQL statements and results in task files for audit/rollback.
