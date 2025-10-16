# Implementation Plan: Table Assignment Enhancements

## Objective

We will enable ops staff to view, auto-assign, and manually manage table assignments for daily reservations so that the service team can eliminate “pending allocation” states and keep floor operations synchronized.

## Success Criteria

- [ ] Reservations list displays an accessible label that reflects table assignment status (assigned tables vs. action required).
- [ ] “Auto assign tables” action successfully assigns available tables to all unallocated bookings for the selected date and refreshes the dashboard.
- [ ] Booking details dialog supports assigning and unassigning tables manually, with optimistic UI and validation against conflicting bookings.

## Architecture & Components

- `server/ops/bookings.getTodayBookingsSummary` returns bookings enriched with `tableAssignments`.
- New capacity helper (`autoAssignTablesForDate`) orchestrates bulk assignment using `assignTableToBooking` / `unassignTableFromBooking`.
- API routes:
  - `POST /api/ops/dashboard/assign-tables` → run auto assignment for restaurant/date.
  - `POST /api/ops/bookings/[id]/tables` → assign a specific table to booking.
  - `DELETE /api/ops/bookings/[id]/tables/[tableId]` → remove assignment.
- Client services (`src/services/ops/bookings.ts`) expose assignment methods consumed via new hook `useOpsTableAssignmentActions`.
- UI updates:
  - `BookingsList` shows assignment badge.
  - `BookingDetailsDialog` gains table assignment section with list, assign select, unassign controls, and integrates new hook.

## Data Flow & API Contracts

Endpoint: `POST /api/ops/dashboard/assign-tables`  
Request: `{ "restaurantId": string, "date": string | null }` (date defaults to today in restaurant TZ)  
Response: `{ assigned: { bookingId: string; tableIds: string[] }[], skipped: { bookingId: string; reason: string }[] }`  
Errors: `401` unauthenticated, `403` membership, `409` if no tables, `500` unexpected.

Endpoint: `POST /api/ops/bookings/[id]/tables`  
Request: `{ "tableId": string }`  
Response: `{ tableAssignments: TableAssignmentDto[] }` (all current assignments for booking)  
Errors: `400` invalid input, `403` membership mismatch, `409` conflict/unavailable, `500` unexpected.

Endpoint: `DELETE /api/ops/bookings/[id]/tables/[tableId]`  
Response: `{ tableAssignments: TableAssignmentDto[] }`  
Errors: same as above.

`OpsTodayBooking` gains `tableAssignments: { tableId: string; tableNumber: string; capacity: number; section: string | null }[]` plus `requiresTableAssignment: boolean`.

## UI/UX States

- Loading: Buttons show spinner/disabled while mutations run; detail dialog select indicates loading tables.
- Empty: Badge displays “Table assignment required”; manual section shows helper text + disabled controls if no tables exist.
- Error: Toast notifications for assignment failures; inline message inside dialog when table fetch fails.
- Success: Badge updates dynamically; detail section lists assigned tables with remove buttons; auto assign button reports summary toast.

## Edge Cases

- No available tables → auto assign returns skipped results; manual select disabled with explanation.
- Overlapping bookings near closing time (missing `end_time`) → algorithm uses default 90-minute window; ensure we guard when times are null.
- Multiple tables required for large parties → algorithm evaluates combinations prioritizing minimal seat waste.
- Concurrent staff actions → mutations revalidate React Query caches (`summary`, `tables`) to avoid stale UI.

## Testing Strategy

- Unit: Add tests for helper that selects table combinations + summary enrichment logic.
- Integration: Extend `getTodayBookingsSummary` test with table assignment payloads; add API route tests covering assign/unassign.
- E2E: Manual verification via dashboard interaction (DevTools MCP) after implementation.
- Accessibility: Check keyboard focus within dialog, ensure new buttons/badges have appropriate aria-labels and contrast.

## Rollout

- Feature flag: none (ships to all ops users).
- Exposure: immediate once deployed; rely on existing auth checks.
- Monitoring: Supabase logs for RPC errors; consider logging skipped bookings for follow-up (append to Sentry/console as interim).
