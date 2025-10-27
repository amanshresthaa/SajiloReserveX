# Research: Precise Table Assignments

## Existing Patterns & Reuse

- Supabase function `assign_tables_atomic_v2` (`supabase/migrations/20251027000001_fix_assign_tables_atomic_v2_table_id_v2.sql`) currently derives `v_start_at`/`v_end_at` from booking date/time fields and stores only slot + metadata in `booking_table_assignments`.
- Allocation overlap prevention today relies on `public.allocations` GiST range constraint; manual flows clamp windows after RPC in `server/capacity/tables.ts:1205`.
- Server wrappers (`server/capacity/tables.ts`, `server/capacity/holds.ts`) already compute buffered windows via `computeBookingWindow` before/after calling the RPC.
- Wrapper stopgap still needs to persist `start_at`/`end_at` on `booking_table_assignments`; current logic only updates allocations/idempotency when `needsUpdate` triggers.
- `isTableAvailableV2` fetch currently omits booking start/end columns, effectively making overlap checks rely on null fallbacks.

## External Resources

- `appendix.md` section "RPC v2 core checks" outlines expected safeguards (zone, adjacency, GiST overlap) for manual assignments.
- Existing migration `20251019102432_consolidated_schema.sql:1839` shows `booking_table_assignments` lacks `start_at`/`end_at`, so new columns + constraint must be introduced explicitly.
- Supabase type definitions (`types/supabase.ts:416` and `types/supabase.ts:1584`) document current RPC signature/columns and will require regeneration or manual alignment.

## Constraints & Risks

- Changing RPC signature impacts every call site; wrappers/tests must pass new parameters (`p_start_at`, `p_end_at`) consistently to avoid runtime failures.
- Adding non-null columns risks backfill complexity; must allow nulls initially or populate via computed booking windows during migration to avoid locking large tables.
- New exclusion constraint may fail migration if existing overlapping records exist; need to evaluate and potentially clean or defer enforcement (`NOT VALID` then `VALIDATE`) depending on data.
- Must ensure advisory locking and slot linkage continue functioning when window start precedes dining start due to buffer.
- Stopgap writes should avoid infinite update loops (only run when mismatch) and work against mocked Supabase clients in tests.
- Schema scan (rg against migrations) shows no day-level unique/exclusion constraints; existing policies already rely on timestamptz ranges.

## Open Questions (and answers if resolved)

- Q: Should `p_start_at`/`p_end_at` be optional or required?
  A: Optional with fallback to legacy derivation keeps backward compatibility for automated callers (e.g., tests, potential future scripts) while encouraging TS layer to supply precise values.
- Q: Do we need to backfill existing `booking_table_assignments` with start/end?
  A: Yes, to enforce constraint; can compute using booking window logic within migration using booking data + venue policy approximations or default to booking.start_at if present.

## Recommended Direction (with rationale)

- Extend RPC signature to accept optional `p_start_at`, `p_end_at`; when absent, fallback to existing booking-derived times to preserve compatibility, but prioritize passed-in precise values.
- Add `start_at` & `end_at` columns to `booking_table_assignments`, populate using migration-time query (preferring booking.start_at/end_at or derived from `booking_slots` data), then update RPC upsert to set them.
- Introduce GiST exclusion constraint on `(table_id, tstzrange(start_at, end_at, '[)'))`, guarded by `btree_gist` extension, to enforce non-overlapping windows at the table level.
- Update TypeScript wrappers/tests to compute `computeBookingWindow(...).block` and pass `p_start_at`/`p_end_at`, ensuring returned assignments already match expected range to eliminate follow-up clamping.
