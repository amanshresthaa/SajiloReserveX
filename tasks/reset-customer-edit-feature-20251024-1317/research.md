# Research: Reset Customer Edit Feature

## Existing Patterns & Reuse

- Edit in My Bookings is wired via shared dashboard components:
  - components/dashboard/BookingsTable.tsx → passes onEdit to row/mobile
  - components/dashboard/BookingRow.tsx → renders Edit/Cancel buttons
  - components/dashboard/BookingsListMobile.tsx → renders Edit/Cancel buttons
  - src/app/(authed)/my-bookings/MyBookingsClient.tsx → previously mounts EditBookingDialog and passes onEdit
- Reservation detail page also exposed Edit:
  - src/app/reserve/[reservationId]/ReservationDetailClient.tsx → shows Edit button and EditBookingDialog

## External Resources

- N/A

## Constraints & Risks

- Removing edit may affect routes, UI navigation, and API endpoints.
- Downstream components may expect edit-related props/handlers.

## Open Questions (and answers if resolved)

- Q: Which routes/components implement customer-facing edit for bookings?
  A: My Bookings client (guest) and Reservation Detail page. Ops/admin remains separate via variant/props.

## Recommended Direction (with rationale)

- Add an allowEdit flag to shared components (default true) and set it to false for guest My Bookings to avoid impacting Ops. Remove Edit and Edit dialog from reservation details. Keep Cancel intact.
