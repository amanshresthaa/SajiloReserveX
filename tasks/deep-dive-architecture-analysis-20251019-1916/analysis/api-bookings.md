# Bookings API Route (`src/app/api/bookings/route.ts`)

## Purpose

Guest booking lookups and creation endpoint handling validation, capacity checks, loyalty, and side-effects.

## Dependencies

- Domain: `env`, booking utilities (`deriveEndTime`, `fetchBookingsForContact`, etc.), capacity engine (`checkSlotAvailability`, `createBookingWithCapacityCheck`).
- Security/infra: rate limiting (`consumeRateLimit`), guest lookup hashing, observability, Supabase clients.
- Validation: Zod schemas for query/body enforcement.

## Exports

- `GET(req: NextRequest)`
- `POST(req: NextRequest)`

## Implementation Details

1. **Input Validation**: Uses zod for contact lookup and booking body; `handleZodError` returns 400 with flattened errors.
2. **Rate Limiting**: Both lookup and create paths call `consumeRateLimit` with structured identifiers and propagate `Retry-After` headers.
3. **Guest Lookup**: When feature flag + pepper set, calls Supabase RPC `get_guest_bookings` with hashed identifiers, falling back to legacy query.
4. **Operating Hours/Past Blocking**:
   - Retrieves restaurant schedule via Supabase.
   - Validates time slot with `assertBookingWithinOperatingWindow`.
   - Optionally enforces `assertBookingNotInPast` with configurable grace.
5. **Capacity Pre-check**: `checkSlotAvailability` ensures covers/parties limit before invoking booking RPC.
6. **Alternatives**: When pre-check fails, fetches `findAlternativeSlots` and responds 409 with metadata and suggestions.
7. **Booking Creation**:
   - Upserts customer (normalized email/phone).
   - Calls `createBookingWithCapacityCheck`; handles duplicate reuse, loyalty award application, audit logging, job enqueueing, confirmation token creation.
8. **Responses**: Returns aggregated booking list for contact, capacity metadata, idempotency echo headers.
9. **Error Handling**: Detailed logging via `recordObservabilityEvent`, special casing `OperatingHoursError` (400), `PastBookingError` (422), capacity conflicts (409).

## Data Structures

- `bookingSchema`: enforces party size, contact info, enumerated booking type/seating.
- `PageResponse<T>` for paginated my-bookings flow.
- Observability payload includes anonymized IP and error codes.

## Edge Cases

- Missing restaurant schedule: surfaces as 500 since validation throws.
- Rate limiter fallback to memory ensures single-instance use still works.
- Duplicate booking detection based on idempotency key sets status 200 with `duplicate: true`.

## Performance Notes

- Pre-check avoids expensive RPC when capacity full.
- Multiple Supabase calls (schedule, customer, bookings); caching schedule could reduce latency.

## Testing Coverage

- `src/app/api/bookings/route.test.ts` and `__tests__/timeValidation.test.ts` cover validation.
- Lacks automated tests for guest lookup hash branch and PastBooking feature flag.

## Improvement Opportunities

1. Add unit test covering hashed guest lookup and ensure fallback logs correctly.
2. Centralize repeated Supabase client instantiation via dependency injection for easier testing.
3. Cache schedule queries per request to avoid duplicate fetch when capacity check reruns.

## Code Example

```ts
const availabilityCheck = await checkSlotAvailability({
  restaurantId,
  date: data.date,
  time: startTime,
  partySize: data.party,
  seatingPreference: data.seating,
});

if (!availabilityCheck.available) {
  const alternatives = await findAlternativeSlots({
    restaurantId,
    date: data.date,
    partySize: data.party,
    preferredTime: startTime,
  });
  return NextResponse.json(
    {
      error: 'CAPACITY_EXCEEDED',
      message: availabilityCheck.reason ?? 'No capacity available for this time slot',
      details: { ...availabilityCheck.metadata },
      alternatives: alternatives.map((slot) => ({
        time: slot.time,
        available: slot.available,
        utilizationPercent: slot.utilizationPercent,
      })),
    },
    { status: 409 },
  );
}
```
