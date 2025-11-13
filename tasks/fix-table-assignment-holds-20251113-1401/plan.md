# Implementation Plan: Persist Hold Conflict Enforcement

## Objective

Ensure `set_hold_conflict_enforcement` actually keeps the strict-conflict GUC enabled for the PostgREST session **and** fix hold expiry calculations so inline/async table assignment stops failing with faux hold conflicts.

## Success Criteria

- [x] Migration updates `set_hold_conflict_enforcement(enabled boolean)` to call `set_config(..., false)` (session scope) with clear commentary.
- [x] Migration applied to the remote Supabase instance (document evidence/command).
- [x] Update hold expiry logic so `expires_at >= end_at` even for far-future reservations.
- [x] Booking flow re-tested; inline table assignment no longer immediately logs `hold not available` due solely to missing enforcement (real capacity conflicts may still happen, but not for an empty restaurant).

## Architecture & Components

- `supabase/migrations/20251113131500_fix_hold_conflict_enforcement_session_scope.sql`: new migration that replaces the function definition.
- `server/capacity/table-assignment/quote.ts`: adjust `expiresAt` to be based on the booking window end (plus TTL buffer) so DB constraints are satisfied.

## Data Flow & API Contracts

- RPC signature stays the same; only behavior changes (session vs transaction scope). Triggers `sync_table_hold_windows` and `update_table_hold_windows` already consult `is_holds_strict_conflicts_enabled`, so once the GUC stays set they will populate `table_hold_windows`, letting the exclusion constraint fire correctly.
- Hold inserts now set `expires_at` to `requestedWindowEnd + holdTtlSeconds`, so the `table_holds_time_order_check` constraint is satisfied for every reservation.

## Testing Strategy

- Apply the migration + code change, then exercise the booking wizard (via Chrome DevTools MCP) to ensure inline auto-assign attempts no longer fail immediately.
- Observe server logs: `[bookings][POST][inline-auto-assign] confirm completed` should appear, and the earlier `table_holds_time_order_check` failure should disappear.

## Rollout

- Migration is backwards compatible; if needed we can revert by re-running the previous function body.
- No feature flags involved; function change takes effect immediately after deployment.
