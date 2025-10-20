# Research: Booking API Error

## Existing Patterns & Reuse

- `src/app/api/bookings/route.ts` delegates POST handling to `createBookingWithCapacityCheck` in `server/capacity/transaction.ts`, which wraps a Supabase RPC (`create_booking_with_capacity_check`) for race-safe inserts.
- The capacity wrapper already emits observability events and logs structured payloads; any fix should reuse this path so API-level logic remains unchanged.
- Supabase DDL is centralised in `supabase/migrations/20251019102432_consolidated_schema.sql`, which defines the `create_booking_with_capacity_check` function.

## External Resources

- Supabase RPC: `create_booking_with_capacity_check` (defined in `supabase/migrations/20251019102432_consolidated_schema.sql`).
- Enum definitions in `lib/enums.ts` (mirrors expected booking type values).
- Capabilities overview in `tasks/deep-dive-architecture-analysis-20251019-1916/analysis/api-bookings.md` (confirms POST flow and supabase dependency).

## Constraints & Risks

- Supabase environment is **remote-only**; any schema change must ship via migration and be backward compatible during rollout.
- Current production database appears to be on an earlier schema without the new `booking_type` enum; casting to the enum fails and aborts the RPC.
- The RPC’s error payload places `sqlstate`/`sqlerrm` at the top level, so `bookingResult.details` is `null`; API logs lose diagnostic detail unless we adapt.
- Removing the explicit enum cast must not break environments where the enum already exists (e.g., fresh databases seeded from the consolidated migration).

## Open Questions (and answers if resolved)

- Q: Why does Supabase return `"type \"booking_type\" does not exist"` even though the consolidated migration defines it?
  A: The remote instance has not yet run the consolidated migration, so the RPC executes against a schema without the `booking_type` enum but with the new PL/pgSQL body already deployed.
- Q: Can we rely on implicit casting from `text` to the column’s enum type?
  A: Yes—Postgres will coerce text literals to the enum when the target column is typed, and the plan includes using `%TYPE` variables to avoid hard-coding enum names.

## Recommended Direction (with rationale)

- Update the Supabase function to avoid hard-coded casts to `booking_type` by using `%TYPE` variables (e.g., `bookings.booking_type%TYPE`), ensuring compatibility with both old (text) and new (enum) schemas.
- While touching the function, add a structured `details` object wrapping `sqlstate`/`sqlerrm` so the JS layer receives actionable diagnostics without changing existing API contracts.
- No changes needed in Next.js API route beyond improved error surfacing once the RPC returns richer detail.
