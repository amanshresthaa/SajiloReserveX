# Verification Report

## Migration

- [x] `psql $SUPABASE_DB_URL -v ON_ERROR_STOP=1 -f supabase/migrations/20251113131500_fix_hold_conflict_enforcement_session_scope.sql`

## Manual QA — Chrome DevTools (MCP)

- [x] Booking wizard moves through Plan → Confirmation without repeated `hold not available` errors (flow exercised twice on 4001, see `/tmp/srx-dev.log` for successful run).
- [x] Server log shows inline auto-assign logging `confirm completed` with `hasHold: true` (`/tmp/srx-dev.log`: `bookingId b8738935-0804-4685-84d7-d3707476e453`).

## Notes

- PostgREST still logs `PGRST204` about `table_hold_members` schema cache; fallback path succeeds but we should schedule a cache invalidation separately.
- `[capacity.hold] strict conflict enforcement not honored` warnings persist because PostgREST connections rotate; tracked in backlog but not blocking table assignment now that holds no longer violate the time-order constraint.
