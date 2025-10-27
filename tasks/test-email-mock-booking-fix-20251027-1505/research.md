# Research: Test Email Mock Booking Fix

## Existing Patterns & Reuse

- `BookingRecord` is exported from `server/bookings.ts` as an alias to `Tables<"bookings">` (Supabase typed rows).
- Existing email flows (e.g., `server/emails/bookings.ts#sendBookingConfirmationEmail`) accept full booking rows, so reusing the Supabase-backed shape is required.

## External Resources

- Supabase generated types in `types/supabase.ts` define `bookings.Row`, confirming required fields like `table_id`.

## Constraints & Risks

- Mock data in `src/app/api/test-email/route.ts` must satisfy every non-optional column on the Supabase `bookings` table; missing fields break the build.
- `table_id` is nullable but mandatory on the row type, so we must include it (likely as `null` for a test record).

## Open Questions (and answers if resolved)

- Q: Are additional fields (beyond `table_id`) missing from the mock?
  A: The current mock already includes all other required fields from `bookings.Row`; only `table_id` is omitted.

## Recommended Direction (with rationale)

- Update the mock booking payload in `src/app/api/test-email/route.ts` to include `table_id: null`, aligning with the Supabase row definition and restoring type safety without altering runtime behavior.
