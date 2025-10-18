# Research: Fix Capacity Group Typing Error

## Existing Patterns & Reuse

- `server/capacity/tables.ts` already derives `capacitySum` for groups using table metadata; the logic simply needs a safe accessor for merge group capacity.
- Similar Supabase relationship selections elsewhere (e.g., in booking summary queries) convert potential arrays to single objects via `Array.isArray()` checks.
- Generated Supabase types (`types/supabase.ts`) declare relationship selects as arrays even for 1:1 relationships, which explains the type error.

## External Resources

- [Supabase Type Relationships Docs](https://supabase.com/docs/reference/javascript/select#selecting-data-from-related-tables) – notes that relationship selects can yield arrays based on table definitions.
- TypeScript narrowing via `Array.isArray()` is the standard pattern to reconcile union types containing arrays and objects.

## Constraints & Risks

- Must preserve runtime behavior: if Supabase ever returns multiple merge group rows, the first element should align with previous expectations (since logic assumed a single record).
- Avoid extra allocations that might affect performance inside loops—prefer local variable reuse.
- Ensure numeric conversion still happens when capacity value is provided as string/number.

## Open Questions (and answers if resolved)

- Q: Does `merge_group` ever return an array at runtime?
  A: Unconfirmed, but the generated type allows it, so we need a resilient accessor regardless.
- Q: Are there existing utilities for single-object extraction?
  A: None found via quick search; inline helper is acceptable for now.

## Recommended Direction (with rationale)

- Introduce a small helper that normalizes the Supabase relationship payload into a single object (take the first element if an array).
- Replace direct `mergeGroup?.capacity` checks with safe access to the normalized value before calculating `capacitySum`.
- Align downstream consumers (`server/ops/bookings.ts`, dashboard components) with the grouped assignment structure so the shared `OpsTodayBooking` contract stays consistent.
- Re-run the build to ensure TypeScript passes and confirm logic remains unchanged.
