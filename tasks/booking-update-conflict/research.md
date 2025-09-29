# Booking Update Conflict — Research

## What we saw

- Editing a booking from the customer dashboard hits `PUT /api/bookings/:id` and the handler returns HTTP 409; the toast reads “Conflict” because the response body omits a `message`/`code` that our `normalizeError` helper expects.
- Supabase slow query logs show the route logging analytics events (`booking_edit_opened`, `booking_edit_submitted`, `booking_edit_failed`) before bailing out, so the failure happens inside the dashboard-specific branch (`handleDashboardUpdate`).

## Server-side behaviour

- `app/api/bookings/[id]/route.ts` parses the dashboard payload (`{ startIso, endIso, partySize, notes }`) and attempts to reuse the existing table. We only fall back to the `findAvailableTable(...)` helper — and eventually emit the 409 — when `nextTableId` becomes `null`.
- `findAvailableTable` and `rangesOverlap` rely purely on same-day overlaps against `BOOKING_BLOCKING_STATUSES`; a conflict should only be raised when _another_ active booking overlaps the requested range or no table of sufficient capacity exists.
- When the 409 path is hit we currently respond with `{ error: "No availability for the requested slot" }`, so callers never receive a structured `code` such as `OVERLAP_DETECTED` and the UI cannot show the friendly copy defined in `EditBookingDialog`.

## Data check (Supabase)

- Looked up booking `12796b04-2365-40ee-89b5-ff7158319130`: restaurant `a8d8f8c0-888e-4da3-a0e2-7c38e6f85aa3`, table `fde98471-1f50-4588-9674-9eba3e15d4cd`, window 12:30–14:00, party size 2, seating `any`.
- Queried `restaurant_tables` for that venue — two tables exist (capacities 2 and 4) and neither is blocked at 12:30 on 2025‑11‑13.
- Overlap query for the same table/date only returns the booking itself, meaning `findAvailableTable(..., ignoreBookingId)` should keep the allocation instead of reporting “No availability”.

## Working hypotheses

- The dashboard flow is incorrectly nulling `nextTableId` (likely because `currentTable` lookup sometimes returns `null` or mis-evaluates `tableSupportsParty`), which immediately forces a new-table search; when `findAvailableTable` walks the candidate list it still returns `null`, incorrectly concluding that no tables are free.
- Independent of the root cause above, API error responses should include a structured `{ message, code }` payload so the client can surface the mapped copy (“That time overlaps an existing booking”).

## Open questions / next steps

- Confirm what values are flowing into `handleDashboardUpdate` at runtime (log or reproduce locally) to see why `nextTableId` becomes `null` despite the booking owning a table of sufficient capacity.
- Verify whether the issue is tied to timezone conversion (e.g. customer editing in non-restaurant timezone) affecting `bookingDate`/`startTime` derivation before we change the allocation logic.
- Update the API to return consistent error shapes once the availability check determines the real failure reason.
