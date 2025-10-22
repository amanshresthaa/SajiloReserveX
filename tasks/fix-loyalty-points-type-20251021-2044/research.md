# Research: Fix loyalty points type error

## Existing Patterns & Reuse

- `types/supabase.ts` defines `TablesInsert<"bookings">`; other booking-related modules rely on this generated type.
- `server/bookings.ts` and capacity transactions already handle `loyalty_points_awarded` in runtime payloads.

## External Resources

- Supabase migrations (`supabase/migrations/20251019102432_consolidated_schema.sql`) define `bookings.loyalty_points_awarded INTEGER DEFAULT 0`.
- Done list entry (`DoneList.md:2905`) confirms the column was added recently.

## Constraints & Risks

- `types/supabase.ts` is generated; manual edits must stay consistent with future regeneration or highlight need to regenerate.
- Any mismatch between type definitions and actual schema blocks builds; ensure `Row`, `Insert`, and `Update` shapes stay aligned.

## Open Questions (and answers if resolved)

- Q: Do Supabase types already include the column in other environments?
  A: No; current generated file omits `loyalty_points_awarded`, causing the build failure.

## Recommended Direction (with rationale)

- Update `types/supabase.ts` to include `loyalty_points_awarded` in the `bookings` table definitions (`Row`, `Insert`, `Update`) so that runtime usage matches static types and the build can succeed.
