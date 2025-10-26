# Implementation Plan: Manual Hold Allocation Fix

## Objective

We will enable staff to create manual holds without allocation constraint errors so that operations teams can manage reservations reliably.

## Success Criteria

- [ ] Manual hold creation succeeds for valid table allocations.
- [ ] No regression in existing capacity allocation flows (automated + manual).

## Architecture & Components

- Supabase migration `20251026162123_allow_hold_allocations.sql` (new) drops + recreates `allocations_resource_type_check` to permit `'hold'` alongside legacy values.
- Manual hold flow (`src/app/api/staff/manual/hold/route.ts` → `server/capacity/tables.ts#createManualHold` → `server/capacity/holds.ts#createTableHold`) expects the schema change.

## Data Flow & API Contracts

Endpoint: `POST /api/staff/manual/hold`
Request: `{ bookingId: uuid, tableIds: uuid[], holdTtlSeconds?, requireAdjacency?, excludeHoldId? }`
Response: `{ hold: { id, expiresAt, startAt, endAt, zoneId, tableIds }, summary, validation }`
Errors: `500 { code: "INTERNAL_ERROR" }` currently thrown when Supabase rejects `resource_type='hold'`; should succeed once constraint updated.

## UI/UX States

- Staff dashboard modal currently displays API error toast when allocation mirror fails; no UI changes required, but success should result in confirmation state.

## Edge Cases

- Existing `allocations` rows with `resource_type='table'` or `'merge_group'` must remain valid—constraint change keeps them allowed.
- Migration must be idempotent; re-running should not error (guards already present).
- If remote database already updated, confirm manually to avoid unnecessary push.

## Testing Strategy

- Run `supabase db status` (or inspect constraint) before/after push to confirm schema state.
- After applying migration, trigger manual hold creation (via Ops UI or direct API call) and ensure server logs show success (no constraint violation).
- Spot-check `table_holds` and `allocations` tables via Supabase SQL inspector if accessible.

## Rollout

- Apply migration via `supabase db push` against the shared remote environment.
- Communicate completion and capture evidence in `verification.md` (successful manual hold & mirrored allocation).
