# Implementation Checklist

## Migration & Infrastructure

- [x] Finalize `supabase/migrations/20251113131500_fix_hold_conflict_enforcement_session_scope.sql` to set session scope.
- [x] Apply migration to remote Supabase via `psql $SUPABASE_DB_URL -f ...`.

## Hold Expiry Logic

- [x] Ensure `server/capacity/table-assignment/quote.ts` sets `expiresAt` relative to the booking window end (with TTL buffer) so it satisfies `table_holds_time_order_check`.

## Verification

- [x] Re-run the reservation booking flow (Chrome DevTools MCP) and confirm inline auto-assign completes instead of failing immediately.
- [x] Capture server log snippet showing `[bookings][POST][inline-auto-assign] confirm completed`.
