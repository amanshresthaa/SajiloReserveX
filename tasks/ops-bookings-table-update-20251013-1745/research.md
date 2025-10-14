# Research: Ops Bookings Table Update

## Existing Patterns & Reuse

- `components/dashboard/BookingsTable.tsx` renders the desktop table for both guest (`MyBookingsClient`) and ops (`OpsBookingsClient`) flows. Column headers live here and rows are delegated to `BookingRow`.
- `components/dashboard/BookingRow.tsx` controls individual desktop rows and currently displays `restaurantName`.
- `components/dashboard/BookingsListMobile.tsx` is the shared mobile presentation; relies on `restaurantName` and `notes`.
- `src/components/features/dashboard/BookingDetailsDialog.tsx` provides the “Details” dialog on the ops dashboard (`/ops?date=…`). It uses `Dialog` from shadcn and a structured layout we can mirror, though its props expect `OpsTodayBooking`.
- `src/types/ops.ts` defines `OpsBookingListItem` which already includes `customerName`, `customerEmail`, and `notes`. These flow into `OpsBookingsClient`.
- `app/api/ops/bookings/route.ts` already returns `customer_name` and `notes`, but `BookingDTO` in `hooks/useBookings.ts` does not expose `customerName`, so the data is dropped during mapping.

## External Resources

- Shadcn UI dialog components already used in `BookingDetailsDialog.tsx`; reusing the same pattern keeps styling consistent.

## Constraints & Risks

- `BookingsTable` is shared with the consumer dashboard; any structural changes must preserve existing behaviour for `/my-bookings`.
- `BookingsListMobile` is also shared—removing the restaurant label outright would regress the guest experience.
- `BookingDTO` is consumed across multiple hooks/components/tests. Extending the type requires updating API route serializers and related fixtures/mocks.
- Ops list items lack several fields shown on the dashboard Details dialog (phone, tier, etc.), so the Ops bookings table dialog will have a slimmer dataset; need to set expectations in UI copy.

## Open Questions (and answers if resolved)

- Q: Do we need full guest profile data in the new Details dialog?
  A: Not currently available from `OpsBookingListItem`; scope limited to name, email, party, time, notes.
- Q: Should the mobile list mirror the new columns?
  A: Likely yes for consistency—display guest name and notes while preserving restaurant info for guests via configurable variant.

## Recommended Direction (with rationale)

- Introduce a `variant` (e.g., `"guest"` | `"ops"`) prop on `BookingsTable`, `BookingRow`, and `BookingsListMobile` to toggle column/label sets without duplicating components.
- Extend `BookingDTO` (front-end hook + API serializers) to include `customerName`, `customerEmail`, and reuse in ops mapping.
- Add an `OpsBookingDetailsDialog` (leaner variant of existing dialog) triggered by a new “Details” button in the actions column when `variant === "ops"`.
- Update skeleton rows/ARIA labels/tests to match the new column order and ensure the guest variant remains unchanged.
