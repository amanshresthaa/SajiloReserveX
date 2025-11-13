# Research: Table Assignment Hold Conflicts

## Requirements

- Functional: Inline/async table assignment must succeed when availability exists instead of failing with `Hold conflicts prevented all candidates` for every booking.
- Non-functional: Keep conflict enforcement at the database layer (GiST exclusion + triggers) so we don’t regress safety checks or rely on brittle client-side filtering.

## Existing Patterns & Reuse

- Hold orchestration lives in `server/capacity/holds.ts` and `server/capacity/table-assignment/quote.ts`. Before inserting a hold, these call `configureHoldStrictConflictSession`, which invokes `set_hold_conflict_enforcement(enabled)` and then checks `is_holds_strict_conflicts_enabled()` (`server/capacity/holds.ts:130-186`).
- The RPC `set_hold_conflict_enforcement` is defined in `supabase/migrations/20251029183500_hold_windows_and_availability.sql` using `set_config(..., true)`—transaction scope (see lines 60-72). PostgREST opens a fresh transaction per HTTP request, so the setting evaporates before the subsequent insert that is supposed to rely on it.
- `createTableHold` currently sets `expires_at` relative to `DateTime.now()` (line 563 of `server/capacity/table-assignment/quote.ts`), while the `table_holds` schema enforces `expires_at >= end_at` (`supabase/schema.sql:4243-4255`). For any booking in the future, `now + 180s` is far earlier than `end_at`, so the fallback insert path explodes with `table_holds_time_order_check`.
- Verification logs surface both issues: dev traces show repeated `[capacity.hold] strict conflict enforcement not honored by server (GUC off)` plus the concrete failure `[capacity.hold] fallback hold insert failed ... violates check constraint "table_holds_time_order_check"` when submitting `/reserve/r/white-horse-pub-waterbeach` (see `/tmp/srx-dev.log` excerpt around `bookingId 43b815b2-82cf-4a92-a44f-55c9b8d7d9f6`).

## External Resources

- None beyond the existing migration + hold docs in `docs/table-assignment-business-rules.md` (already aligned with the RPC).

## Constraints & Risks

- Changing the RPC definition must be done via a Supabase migration so all environments stay in sync; direct DB edits are not acceptable.
- The hold expiry fix must ensure we never set `expires_at` earlier than `end_at`, while still honoring the minimum TTL logic enforced inside `createTableHold`.
- After deploying the migration + expiry fix, we need to re-run the reservation flow to prove inline auto-assignment can proceed (or at least no longer fails immediately because of phantom hold conflicts).

## Open Questions

- Do we also need a one-off `SELECT set_hold_conflict_enforcement(true);` to seed existing connections? **Answer**: No; `server/supabase.ts` already calls the RPC when instantiating the long-lived service client, and hold helpers invoke it per request. Once the RPC actually sets the config at session scope, those calls are sufficient.

## Recommended Direction

1. Ship migration `20251113131500_fix_hold_conflict_enforcement_session_scope.sql` that changes the `set_config` third argument from `true` (transaction-only) to `false` (session scope) so the GUC survives beyond the RPC transaction.
2. Update `server/capacity/table-assignment/quote.ts` so `expiresAt` is anchored to `requestedWindowEnd` (plus the usual TTL buffer) rather than `DateTime.now()`, guaranteeing it satisfies `table_holds_time_order_check` even for bookings scheduled in the future.
3. Apply the migration to the remote Supabase environment (per policy) and re-run the reservation wizard end-to-end; inline table assignment should now complete (logs should emit `hasHold: true` and `confirm completed`).
