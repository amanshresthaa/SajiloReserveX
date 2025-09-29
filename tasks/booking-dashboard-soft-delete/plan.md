# Plan

1. **Investigate 409 on booking edits**
   - Reproduce the failure path in `app/api/bookings/[id]/route.ts` and confirm whether availability checks or table reuse logic rejects valid updates after the schema change.
   - Adjust overlap detection so the current booking’s slot always remains valid unless the update truly conflicts.

2. **Keep cancelled bookings visible in dashboard lists**
   - Revisit the `/api/bookings?me=1` handler to ensure default queries include `cancelled` rows while still supporting filters for active-only views when explicitly requested.
   - Update the dashboard filters/UI to make “Active” optional rather than default, aligning with the request to surface cancelled records by default.

3. **Verification**
   - Run `pnpm typecheck` (acknowledging pre-existing test typing gaps) and manually sanity-check the dashboard flows if possible.
