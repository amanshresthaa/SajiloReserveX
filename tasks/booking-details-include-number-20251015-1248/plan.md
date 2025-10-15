# Implementation Plan: Include Customer Number in Booking Details

## Objective

We will enable operators to view a guest's contact number within the booking details modal when the data exists so that they can reach out quickly.

## Success Criteria

- [ ] Booking details modal displays the customer's phone number when available.
- [ ] Detail rows gracefully fall back to `—` when the number is missing.
- [ ] API and shared DTOs expose `customerPhone` without breaking existing consumers.

## Architecture & Components

- `src/app/api/ops/bookings/route.ts`: include `customer_phone` in the query and response DTO (trim + nullable).
- `src/types/ops.ts`: extend `OpsBookingListItem` with `customerPhone`.
- `src/components/features/bookings/OpsBookingsClient.tsx`: propagate the new field when mapping to `BookingDTO`.
- `hooks/useBookings.ts`: add `customerPhone` to the shared DTO (nullable).
- `components/dashboard/OpsBookingDetailsDialog.tsx`: add an `InfoItem` line for the phone, reusing `tel:` sanitisation pattern.

## Data Flow & API Contracts

Endpoint: GET `/api/ops/bookings`
Response item fields: extend with `customerPhone: string | null`
Errors: unchanged (reuses existing handlers)

## UI/UX States

- Loading: unchanged
- Empty: display fallback when number missing
- Error: unchanged
- Success: shows phone number when present

## Edge Cases

- Numbers stored with spaces or punctuation → sanitize for `tel:` but display original trimmed value.
- Missing/blank phone numbers → show `—`.

## Testing Strategy

- Update/extend existing TypeScript fixtures to satisfy new type requirement.
- Rely on existing component tests; manually verify via local build after change.

## Rollout

- Feature flag: n/a
- Exposure: n/a
- Monitoring: existing logs
