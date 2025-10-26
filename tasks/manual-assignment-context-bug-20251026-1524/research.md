# Research: Manual Assignment Context Bug

## Existing Patterns & Reuse

- `server/capacity/tables.ts:getManualAssignmentContext` already wraps `computeBookingWindow` errors and succeeds when service lookup fails, so we can mirror that defensive posture for Supabase lookups.
- `server/capacity/transaction.ts:isMissingCapacityRpcError` demonstrates how we normalize PostgREST error codes/messages (e.g. “no matches were found in the schema cache”) to gracefully degrade when backend migrations lag.
- `server/customers.ts` shows retry/fallback logic keyed off Postgres error codes (42P10) and message sniffing—useful precedent for recognizing missing schema artifacts without crashing.

## External Resources

- Supabase migration `supabase/migrations/20251026104700_add_table_holds.sql` defines `table_holds` and `table_hold_members` (confirms the table is new and may not exist in older environments).
- Repo docs `docs/runbooks/allocator.md` + `appendix.md` describe manual assignment holds; confirms feature flag gating expectation.

## Constraints & Risks

- Supabase is remote-only; we cannot patch the schema ourselves if a lower environment missed the migration.
- Manual assignment UI depends on context API; current 500 blocks entire flow, so fix must avoid breaking backwards compatibility.
- Need to avoid masking real query failures—fallback should only trigger when the table is genuinely missing (42P01 / schema cache message).
- Feature flag `FEATURE_HOLDS_ENABLED` defaults to true; environments with disabled holds should skip the query entirely.

## Open Questions (and answers if resolved)

- Q: Should we surface a signal to the UI when holds are unavailable due to missing table?
  A: Leaning no for this patch; existing UI already tolerates an empty `holds` array, and adding API shape changes would ripple through clients.
- Q: Does any other capacity endpoint need the same guard?
  A: Most hold operations live in `server/capacity/holds.ts`; scope this task to manual context to unblock ops dashboard, note follow-up if additional errors surface.

## Recommended Direction (with rationale)

- Introduce a helper to detect missing-table PostgREST errors (code 42P01 or schema cache wording) and reuse the existing pattern from `isMissingCapacityRpcError`.
- Gate the holds query in `getManualAssignmentContext` behind `isHoldsEnabled()` and gracefully return an empty list when the table is unavailable, logging a warning for observability.
- Maintain existing response shape (`holds` array + `activeHold`) so the UI keeps functioning without additional changes.
