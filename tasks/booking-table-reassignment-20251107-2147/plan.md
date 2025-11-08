# Implementation Plan: Booking Table Reassignment

## Objective

We will enable restaurateurs to ensure updated bookings trigger table reassignment so that oversized parties never remain mapped to undersized tables.

## Success Criteria

- [ ] Increasing a booking's party size beyond the assigned table capacity results in unassigned state or reassignment.
- [ ] Regression-free behaviour for unchanged or decreased party size edits.

## Architecture & Components

- `src/app/api/ops/bookings/[id]/route.ts`
  - Legacy (non-unified) PATCH branch: introduce `requiresTableRealignment` calculation mirroring guest route criteria (booking_date/start_time/end_time/party_size comparisons).
  - When realignment is true, attempt `updateBookingWithCapacityCheck` (capacity engine) using the tenant-scoped Supabase client; fall back to `updateBookingRecord` only when the capacity call fails.
  - On fallback, invoke `clearBookingTableAssignments` to release stale assignments.
- `server/bookings.ts` & `server/capacity/transaction.ts` already provide helpers; no structural changes needed there.

## Data Flow & API Contracts

1. Ops PATCH receives `{ startIso, endIso?, partySize, notes, override? }`.
2. After validation + schedule resolution, route builds update payload and detects realignment.
3. If realignment:
   - Call `updateBookingWithCapacityCheck` with booking + customer context to let allocator choose new tables.
   - If success → respond with returned booking (tables reassigned by RPC).
   - If failure → call `updateBookingRecord` with same fields, then `clearBookingTableAssignments` to leave booking unassigned.
4. If no realignment, reuse existing `updateBookingRecord` path.

## UI/UX States

- Loading: unchanged (ops UI already shows spinner during PATCH).
- Empty: N/A.
- Error: maintain current error handling (422 for validation, 500 fallback).
- Success: response payload identical; downstream clients already refetch table assignments separately.

## Edge Cases

- Booking already cancelled/past: covered by existing guards; no change.
- Capacity service failure/timeout: ensure we catch exceptions and proceed with fallback update + clear.
- Party size decreases: still trigger re-plan/clear, matching guest route behavior.

## Testing Strategy

- Unit: Extend `src/app/api/ops/bookings/[id]/route.test.ts` to assert `clearBookingTableAssignments` is invoked when `partySize` differs.
- Integration: Not planned (route already covered by unit-level NextRequest tests).
- E2E: N/A (API-only change).
- Accessibility: N/A.

## Rollout

- Feature highlight: none; change hidden behind existing endpoint.
- Verify via existing CI (lint + tests). No feature flags introduced.
