# Research: Include Customer Number in Booking Details

## Existing Patterns & Reuse

- `components/dashboard/OpsBookingDetailsDialog.tsx` renders the modal shown in the screenshot and already centralises “info rows” via `InfoItem`.
- Customer phone numbers are surfaced elsewhere (e.g. `src/components/features/dashboard/BookingDetailsDialog.tsx`) using a sanitized `tel:` link (`replace(/[^+\d]/g, '')`); we can copy this approach.
- Data for the ops bookings table flows through `useOpsBookingsList` → `BookingService.listBookings` → `/api/ops/bookings` (see `src/app/api/ops/bookings/route.ts`) and currently maps into `OpsBookingListItem` (`src/types/ops.ts`) before being converted to the shared `BookingDTO`.
- Supabase rows already expose `customer_phone` (confirmed in `server/ops/bookings.ts` and reservation schemas).

## External Resources

- None required; all logic lives in-repo.

## Constraints & Risks

- API `BookingDTO` types in `/api/ops/bookings` and `hooks/useBookings.ts` currently omit `customerPhone`; adding the field must stay backwards-compatible (nullable, optional).
- Need to avoid leaking poorly formatted numbers; must trim and fall back gracefully when data missing.
- Updating types touches several consumer components (`CancelBookingDialog`, `EditBookingDialog`, tests) that rely on `BookingDTO`; ensure new property does not break expectations.

## Open Questions (and answers if resolved)

- Q: Do persisted bookings always include a phone number?  
  A: No—column is nullable; UI must only display when provided.

## Recommended Direction (with rationale)

- Extend the API response and shared DTOs to include `customerPhone` (trimmed or `null`).
- Update `OpsBookingDetailsDialog` to render a new `InfoItem` with a sanitized `tel:` link when the phone exists, otherwise show `—`, matching existing formatting.
- Adjust unit fixtures (if any rely on the shape) to include the new nullable property to keep TypeScript happy and tests compiling.
