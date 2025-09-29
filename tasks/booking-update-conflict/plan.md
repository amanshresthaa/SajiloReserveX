# Plan

1. **Reproduce the 409 path and capture state**
   - Mirror the dashboard `PUT /api/bookings/:id` call locally (script or integration test) to confirm we can trigger the conflict with the sample booking and record the values flowing into `handleDashboardUpdate` (table id, party size, derived times).
   - Document why `nextTableId` becomes `null` despite an available table — focus on the reuse branch before we fall back to `findAvailableTable`.

2. **Stabilise the dashboard update handler**
   - Adjust `handleDashboardUpdate` so notes-only changes (or unchanged slot/party) never clear the current table allocation.
   - When availability genuinely fails, respond with a structured `{ message, code }` payload (e.g. `OVERLAP_DETECTED`) so the client can surface descriptive copy.
   - Harden the overlap search (e.g. ensure the existing booking is ignored, double-check timezone conversions) and cover any edge case discovered in step 1.

3. **Verification**
   - Add targeted tests for the new logic (unit test against the handler helper or end-to-end through a mocked Supabase client) proving we keep the existing table when the slot is unchanged and that the error shape matches the client expectations.
   - Run the relevant test suite (Vitest for dashboard hooks) and spot-check the manual dashboard flow if possible.
