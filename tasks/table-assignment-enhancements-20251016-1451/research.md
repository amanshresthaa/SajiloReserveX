# Research: Table Assignment Enhancements

## Existing Patterns & Reuse

- `src/components/features/dashboard/OpsDashboardClient.tsx` orchestrates the reservations view and already uses React Query query keys for summary/heatmap refresh.
- `src/components/features/dashboard/BookingsList.tsx` renders each booking card; status badges + action buttons can be extended to surface table assignment state.
- `src/components/features/dashboard/BookingDetailsDialog.tsx` shows the booking detail sheet where manual table assignment controls can live.
- `lib/query/keys.ts` centralises React Query identifiers; any new invalidations should extend the existing `opsDashboard` or `opsTables` keys.
- `src/services/ops/bookings.ts` + `useBookingService` pattern wrap fetch calls—new assignment endpoints should extend this service.
- `server/ops/bookings.getTodayBookingsSummary` feeds the dashboard; extend this to include table assignment data instead of issuing per-booking calls.
- `server/capacity/tables.ts` already exposes `assignTableToBooking`, `unassignTableFromBooking`, `getBookingTableAssignments`, and stubs for `autoAssignTables`.
- Table inventory CRUD + UI patterns exist in `src/app/(ops)/ops/(app)/tables` and `TableInventoryClient.tsx`; their toast + selection patterns can inform manual assignment UX.

## External Resources

- `supabase/migrations/20251016092000_create_booking_table_assignments.sql` documents schema + RPC helpers for assigning/unassigning tables.
- `server/capacity/tables.ts` describes the intended auto-assignment algorithm outline (exact match → next size up → combinations).
- `tasks/capacity-availability-engine-20251016-0905/STORY4_*` provide background on capacity features and confirm manual assignment is currently v1.

## Constraints & Risks

- `autoAssignTables` currently throws—must implement server-side logic before wiring UI.
- Need to avoid N+1 Supabase queries when enriching bookings with assignments; prefer single select/joins.
- Table inventory may include tables marked `reserved/occupied/out_of_service`; auto/manual assignment should filter to genuinely available tables and prevent double booking.
- UI must remain mobile-friendly; new buttons/labels can't overflow the existing card layout and require accessible labeling.
- Table assignment changes should invalidate existing React Query caches to keep dashboard + any table inventory views in sync.
- Potential race conditions if multiple staff trigger auto assign; server logic should be idempotent and guard against conflicting writes.

## Open Questions (and answers if resolved)

- Q: Should the “Auto assign tables” action operate on a single booking or the entire day’s unassigned bookings?
  A: Assume the dashboard-level button assigns all unallocated bookings for the selected service date; manual overrides remain per booking through the details dialog.
- Q: Do we need granular combination logic (multi-table assignments) in v1?
  A: Yes—capacity engine schema allows multiple tables per booking, so algorithm should consider single-table and minimal multi-table combinations to fit party size.

## Recommended Direction (with rationale)

- Extend `getTodayBookingsSummary` + `OpsTodayBooking` to include `tableAssignments` (table + capacity metadata) so the list + dialog render current state without additional fetches.
- Implement `autoAssignTables` in `server/capacity/tables.ts` plus a new handler to iterate unassigned bookings for a date, reusing availability checks to avoid conflicts.
- Add REST endpoints under `/api/ops/dashboard` or `/api/ops/bookings/[id]/tables` for manual assign, unassign, and auto-assign actions; gate them with membership checks.
- Enhance `BookingsList` to display a badge: assigned tables summary or “Table assignment required” using existing `Badge` component styling.
- Update `BookingDetailsDialog` with a table assignment section: list current assignments, unassign buttons, select of available tables (via `tableInventoryService.list`), and assign action; ensure keyboard/focus compatibility.
- Provide a top-level “Auto assign tables” button in the reservations header that triggers the new endpoint and refreshes the summary query, matching existing button styling and using toast feedback.
