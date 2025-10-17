# Research: Reservation Logic Audit

## Existing Patterns & Reuse

- **Capacity/assignment engine** lives under `server/capacity/`. Public exports in `server/capacity/index.ts` route API callers (e.g., `src/app/api/ops/dashboard/assign-tables/route.ts`) toward table assignment helpers.
- **Auto-assignment implementation** is concentrated in [`server/capacity/tables.ts`](server/capacity/tables.ts) (window math, schedule build, greedy combination, RPC calls).
- **Availability/capacity summaries** (`server/capacity/service.ts`, `server/ops/capacity.ts`) operate purely on cover counts; they do not integrate with per-table logic.
- **Database-side primitives** for assignments reside in [`supabase/migrations/20251016092000_create_booking_table_assignments.sql`](supabase/migrations/20251016092000_create_booking_table_assignments.sql) via RPC functions `assign_table_to_booking` / `unassign_table_from_booking` and table/index definitions.
- **Tests**: targeted Vitest coverage for auto-assignment at `tests/server/capacity/autoAssignTables.test.ts` (mock Supabase client). Broader booking summaries in `tests/server/ops`.
- **Seeds/config**: table inventory seeded via `supabase/seeds/seed-table-inventory.sql` → 16 default tables per restaurant spanning capacities 2–8.

## External Resources

- Supabase RPC functions defined in migration above (assign/unassign helpers).
- No direct third-party scheduling libs; relies on bespoke TypeScript implementations in repo.

## Constraints & Risks

- Auto-assigner assumes **default 90m duration** (`DEFAULT_BOOKING_DURATION_MINUTES`) when booking lacks `end_time`; ignores party-size/service window rules.
- **No cleaning buffer** concept in table schedule; `windowsOverlap` only compares raw windows.
- **Combinations** allow 1–3 tables arbitrarily; permitted merges are not codified.
- RPC `assign_table_to_booking` lacks overlap guard or transactional locking; concurrent calls may double-book.
- Seeds diverge from required 10-table (3×2, 5×4, 2×7) setup; business rules must be enforced in code, not data.
- Time computations operate on local HH:MM strings with no timezone normalization; potential DST ambiguity.
- Assignment logic builds per-day schedules **in-memory** without database locking; race windows exist between availability check and RPC call.

## Open Questions (and answers if resolved)

- **Where are service windows defined?** Capacity service periods via `restaurant_service_periods` (queried in `server/ops/capacity.ts`), but not applied during assignment → effectively ignored for booking length.
- **Are buffers configurable?** No buffer inputs detected; no config surfaces for pre/post cleaning.
- **Is there max merge depth?** None; combination search explores up to triples, fallback greedy with any number of tables.
- **How are start/end stored?** Bookings store `start_time`/`end_time` as `time` columns; `computeBookingWindow` falls back to +90m when `end_time` missing.

## Recommended Direction (with rationale)

- Document current behavior: general-purpose greedy assignment without rule checks.
- Focus audit on `server/capacity/tables.ts` for gaps vs. mandated inventory/merge/buffer policies and on RPC layer for missing safeguards.
- Map interactions between availability service and assignment to highlight mismatches (covers vs. actual seats).
