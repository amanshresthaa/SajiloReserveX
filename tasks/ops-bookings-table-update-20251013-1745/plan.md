# Implementation Plan: Ops Bookings Table Update

## Objective

Enable ops team members to identify guest context directly from the bookings table by swapping the restaurant column for customer data, surface reservation notes inline, and provide a “Details” dialog similar to the main ops dashboard.

## Success Criteria

- [ ] Desktop table at `/ops/bookings` shows Date, Time, Party, Customer, Notes, Status, Actions (with Details button) while `/my-bookings` table remains unchanged.
- [ ] Details button opens a dialog with guest/date/notes information drawn from the booking row.
- [ ] Customer name and notes appear in both desktop and mobile variants without breaking existing pagination/search flows.

## Architecture & Components

- `hooks/useBookings` / API routes: extend `BookingDTO` shape with `customerName`/`customerEmail`; ensure serializers populate them (ops → data, guest → `null` defaults).
- `components/dashboard/BookingsTable`: add `variant` prop to toggle column sets; forward variant to `BookingRow` and `BookingsListMobile`.
- `components/dashboard/BookingRow`: render customer + notes columns when `variant === "ops"`; include `Details` button hooking into new dialog.
- `components/features/bookings/OpsBookingDetailsDialog` (new): lightweight dialog using shadcn `Dialog`, accepts `BookingDTO` and renders available data.
- `components/dashboard/BookingsListMobile`: switch labels to customer-centric copy under ops variant while preserving guest experience.
- `components/features/bookings/OpsBookingsClient`: map `OpsBookingListItem` into enriched `BookingDTO`; pass `variant="ops"` and wire dialog state.
- Existing `MyBookingsClient` keeps default guest variant (no prop change).

## Data Flow & API Contracts

Endpoint: `GET /api/ops/bookings` (unchanged URL).
Response additions: each `items[]` entry now exposes `customerName` (string | null) and `customerEmail` (string | null) already selected; ensure returned JSON includes them.

Endpoint: `GET /api/bookings?me=1`
Response additions: include `customerName: null`, `customerEmail: null` for compatibility.

No request changes; clients already include notes field.

## UI/UX States

- Loading: skeleton rows updated to mirror new column widths; mobile skeleton remains consistent.
- Empty: table empty state unchanged (variant agnostic).
- Error: same alert path; ensure dialog cannot open without booking data.
- Success: ops table displays new fields; details dialog handles missing notes/email gracefully with fallback copy.

## Edge Cases

- Bookings lacking customer name → show “Guest name unavailable”.
- Notes absent → render `—` in table and hide notes section in dialog.
- Cancelled/past bookings: Actions already disable; ensure Details button remains available.

## Testing Strategy

- Unit: update `BookingsListMobile` test snapshot/assertions for new variant.
- If present, adjust any fixtures using `BookingDTO` to include `customerName`.
- Manual smoke on `/ops/bookings` for table layout + dialog; confirm `/my-bookings` unaffected.

## Rollout

- No feature flag—ship directly.
- Monitor ops feedback; regression risk low once manual QA completes.
