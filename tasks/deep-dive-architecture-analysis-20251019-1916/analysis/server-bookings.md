# Server Bookings Domain

## Module Overview

Location: `server/bookings.ts`, `server/bookings/timeValidation.ts`, `server/bookings/pastTimeValidation.ts`.

Serves as the server-side backbone for booking operations—normalizing payloads, enforcing business rules, and coordinating customer/profile updates.

## Dependencies

- Supabase types (`Tables`, `TablesInsert`) and client.
- Enum helpers (`ensureBookingStatus`, `ensureBookingType`, `ensureSeatingPreference`).
- Customer utilities (`findCustomerByContact`, `upsertCustomer`, profile recorders).
- Cache invalidation (`invalidateAvailabilitySnapshot`).
- Shared time helpers (`@reserve/shared/time`, `calculateDurationMinutes`).
- Roles (`RESTAURANT_ADMIN_ROLES`) for past booking overrides.

## Public API

- Booking helpers: `generateBookingReference`, `insertBookingRecord`, `updateBookingRecord`, `softCancelBooking`, `fetchBookingsForContact`.
- Time utilities: `calculateDurationMinutes`, `deriveEndTime`, `rangesOverlap`, `buildBookingAuditSnapshot`.
- Validation: `assertBookingWithinOperatingWindow`, `assertBookingNotInPast` plus error classes `OperatingHoursError`, `PastBookingError`.

## Implementation Notes

- **Audit Logging**: `buildBookingAuditSnapshot` diffing based on `AUDIT_BOOKING_FIELDS` to capture before/after state.
- **Record Insertion**: Normalizes booking type/seating/status, ensures null handling for optional fields, and updates customer profile stats after insert.
- **Cache Invalidation**: Each mutation invalidates availability cache asynchronously (`void invalidateAvailabilitySnapshot`).
- **Operating Hours**: Validates schedule slots and ensures booking duration does not exceed closing window.
- **Past Booking Guard**: Converts restaurant-local timestamps to UTC, applies grace period, and respects admin overrides via role checks.

## Data Structures

- `CreateBookingPayload` / `UpdateBookingPayload`: typed superset of Supabase schemas containing optional loyalty/idempotency info.
- `BookingOperatingWindow`: subset of restaurant schedule with slots/window meta.
- `PastTimeValidationOptions`: configuration for grace minutes and overrides.

## Edge Cases Handled

- Missing conflict constraint in Supabase (customer upsert) by retrying alternative indexes.
- DST and timezone conversion handled via `Intl.DateTimeFormat` though relies on locale conversions (potential risk).
- Admin override path for past bookings ensures blocked events still log context.

## Error Handling

- Propagates PostgREST errors directly; caller expected to catch.
- Throws typed errors (`OperatingHoursError`, `PastBookingError`) for validation-specific messaging.
- Wraps timezone parsing errors with descriptive message.

## Performance Considerations

- Heavy use of Supabase queries per operation—optimization possible via batching or stored procedures.
- Audit diff uses `JSON.stringify` for arrays; acceptable for small fields but could be optimized for large JSON details.

## Testing Coverage

- `timeValidation` covered by dedicated tests.
- Past booking guard lacks automated coverage (recommended to add DST and override tests).
- Booking CRUD logic indirectly exercised through API integration tests.

## Improvement Opportunities

1. Replace locale string conversions with `Temporal` or `luxon` to reduce DST ambiguity.
2. Add targeted unit tests for `buildBookingAuditSnapshot` and past booking guard.
3. Consider moving customer profile updates into database triggers for atomicity.

## Code Examples

```ts
export async function insertBookingRecord(
  client: DbClient,
  payload: CreateBookingPayload,
): Promise<BookingRecord> {
  const bookingType = ensureBookingType(payload.booking_type);
  const status = ensureBookingStatus(payload.status ?? 'confirmed');

  const insertPayload: TablesInsert<'bookings'> = {
    restaurant_id: payload.restaurant_id,
    booking_date: payload.booking_date,
    start_time: payload.start_time,
    end_time: payload.end_time,
    reference: payload.reference,
    party_size: payload.party_size,
    booking_type: bookingType,
    seating_preference: ensureSeatingPreference(payload.seating_preference),
    status,
    customer_name: payload.customer_name,
    customer_email: payload.customer_email,
    customer_phone: payload.customer_phone,
    notes: payload.notes ?? null,
    marketing_opt_in: payload.marketing_opt_in ?? false,
    source: payload.source ?? 'web',
    customer_id: payload.customer_id,
    client_request_id: payload.client_request_id,
    idempotency_key: payload.idempotency_key ?? null,
    details: payload.details ?? null,
  };

  const { data } = await client.from('bookings').insert(insertPayload).select('*').single();
  await recordBookingForCustomerProfile(client, {
    customerId: booking.customer_id,
    createdAt: booking.created_at,
    partySize: booking.party_size,
    marketingOptIn: booking.marketing_opt_in,
    status: booking.status,
  });
  void invalidateAvailabilitySnapshot(booking.restaurant_id, booking.booking_date);
  return booking;
}
```

```ts
export function assertBookingNotInPast(
  restaurantTimezone: string,
  bookingDate: string,
  startTime: string,
  options: PastTimeValidationOptions = {},
): void {
  const graceMinutes = options.graceMinutes ?? 5;
  const serverTime = getCurrentTimeInTimezone(restaurantTimezone);
  const bookingTime = parseBookingTime(restaurantTimezone, bookingDate, startTime);
  const timeDeltaMinutes = (bookingTime.getTime() - serverTime.getTime()) / (1000 * 60);
  if (timeDeltaMinutes < -graceMinutes) {
    if (options.allowOverride && canOverridePastBooking(options.actorRole)) {
      return;
    }
    throw new PastBookingError(
      'Booking time is in the past. Please select a future date and time.',
      {
        bookingTime: formatDateTimeForDisplay(bookingTime, restaurantTimezone),
        serverTime: formatDateTimeForDisplay(serverTime, restaurantTimezone),
        timezone: restaurantTimezone,
        gracePeriodMinutes: graceMinutes,
        timeDeltaMinutes: Math.round(timeDeltaMinutes),
      },
    );
  }
}
```
