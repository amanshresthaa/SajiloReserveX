# Research: Resolve Missing Supabase Function For Booking Creation

## Existing Patterns & Reuse

- `src/app/api/bookings/route.ts` delegates non-experimental booking creation to `createBookingWithCapacityCheck` from `@/server/capacity`.
- `server/capacity/transaction.ts` wraps Supabase RPC calls (`create_booking_with_capacity_check`, `update_booking_with_capacity_check`) and normalises results/errors.
- `server/bookings.ts` already exposes `insertBookingRecord` and other helpers for directly inserting bookings without the RPC; ops routes reuse these today.
- `server/booking/serviceFactory.ts` (validation service) still invokes the same RPC for its commit phase.

## External Resources

- Supabase migration `supabase/migrations/20251020232438_remove_capacity_schema.sql` – explicitly drops `public.create_booking_with_capacity_check` along with capacity tables/types.
- Supabase RPC definition history: `supabase/migrations/20251020193000_update_capacity_rpc.sql` shows prior signature used by the application (useful for parity checks if we need a replacement).

## Constraints & Risks

- Current production schema (post-migration) no longer provides the RPC; any attempt to call it yields `PGRST202` (function missing) and surfaces as a 500 for `/api/bookings`.
- Several modules (`server/capacity`, booking validation service) assume capacity tables (`restaurant_capacity_rules`, etc.) still exist—those were dropped in the same migration, so continued usage risks additional runtime errors.
- Restoring the RPC would contradict the "remove capacity management" migration intent and reintroduce dependencies on removed tables.
- Directly inserting bookings must preserve behaviours handled by the RPC (duplicate detection, audit metadata, idempotency); need to ensure the replacement logic covers these cases.

## Open Questions (and answers if resolved)

- Q: Do any active code paths still require detailed capacity enforcement data from the old tables?
  A: Customer booking flow (`/api/bookings`) still calls into the capacity module, but ops booking APIs already bypass it. With the schema removed, capacity enforcement is effectively non-functional, so we must refactor callers.
- Q: Is there an existing abstraction we can reuse for insert/duplicate handling without capacity RPC?
  A: `insertBookingRecord` in `server/bookings.ts` provides direct insert + audit hooks; duplicates/idempotency currently handled at API level (needs verification).

## Recommended Direction (with rationale)

- Refactor booking creation flows to stop invoking `createBookingWithCapacityCheck` and instead rely on application-layer insert helpers (`insertBookingRecord`) plus any necessary duplicate/idempotency guards. This aligns with the migration that removed capacity schema, prevents 500s, and keeps logic server-side.
- Update or temporarily retire pieces of `server/capacity` that assume the dropped schema to avoid future runtime errors; consider introducing a lightweight wrapper or flag to bypass the old RPC until a new capacity strategy ships.
