# Implementation Plan: Strict Hold Conflict Enforcement (E1-S1)

## Objective

Enforce strict hold conflict prevention across all paths by initializing DB session enforcement at service start, pre‑checking direct assigns, and relying on DB constraints for final consistency.

## Success Criteria

- [ ] `set_hold_conflict_enforcement(true)` executed once per service client with self‑check.
- [ ] Direct assign rejects when any overlapping hold exists.
- [ ] Staging e2e confirms overlapping holds are rejected (manual + RPC paths).

## Architecture & Components

- Startup enforcement: `server/supabase.ts` initializes GUC on service client creation; caches “enforcement ok” status.
- Hold conflict check: `server/capacity/holds.ts:findHoldConflicts` reused; legacy fallback in place.
- API routes: `src/app/api/ops/bookings/[id]/tables/route.ts` pre‑checks holds before calling `assignTableToBooking`.

## Data Flow & API Contracts

- No new endpoints. Response errors include code `HOLD_CONFLICT` with fields: `{ tables: string[], window: { startAt, endAt }, blockingHoldIds: string[] }`.

## UI/UX States

- Error: Show actionable conflict details listing blocking holds and retry suggestion.

## Edge Cases

- Hold belongs to same booking: allow proceed (per current manual logic), but revalidate.
- GUC function missing (older DB): fallback to legacy find conflicts; log warning.

## Testing Strategy

- Unit: new tests for startup enforcement (mock RPC); pre‑check logic.
- Integration: e2e staging overlapping holds → assignment fails with `HOLD_CONFLICT`.
- Accessibility: N/A (server change only).

## Rollout

- Feature flag remains; enforcement enabled by default in staging → prod.
- Monitor logs for enforcement self‑check failures.
