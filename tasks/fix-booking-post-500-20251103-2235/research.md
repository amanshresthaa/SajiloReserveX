# Research: Fix 500 on POST /api/bookings

## Requirements

- Functional: Prevent 500 when booking is created but RPC returns no record.
- Non-functional: Preserve existing validation, rate limiting, and side-effects. No schema changes.

## Existing Patterns & Reuse

- Capacity transaction layer (`server/capacity/transaction.ts`) may return success with `booking` undefined.
- Idempotency is supported via `idempotency_key` on `bookings`.
- Fetch helpers and Supabase service client are already used in route.

## External Resources

- N/A (internal service contracts only).

## Constraints & Risks

- RPC contract may vary across environments; avoid breaking changes. Fallback must be safe and idempotent.
- Must not leak secrets; keep logs minimal.

## Open Questions (owner, due)

- Q: Should 202 be returned if recovery fails?
  A: For now, keep 500 if truly unrecoverable; attempt two lookups first.

## Recommended Direction (with rationale)

- When `createBookingWithCapacityCheck` returns success without `booking`, try to recover the record:
  1. Lookup by `(restaurant_id, idempotency_key)` if present.
  2. Fallback lookup by `(restaurant_id, customer_id, booking_date, start_time, end_time)` ordered by `created_at` desc.
- If recovered, proceed as normal; emit an observability event `booking.create.recovered`.
- If not recovered, keep existing error handling.
