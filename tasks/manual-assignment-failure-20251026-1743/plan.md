# Implementation Plan: Manual Assignment Failure

## Objective

We will restore manual and automated table assignment flows for ops staff so that valid holds confirm successfully and the dashboard’s auto-assign action no longer skips bookings due to the `assign_tables_atomic_v2` ambiguity bug.

## Success Criteria

- [ ] `assign_tables_atomic_v2` no longer raises `42702` for the provided booking/table set; manual confirm returns 200 with assignments.
- [ ] `POST /api/ops/dashboard/assign-tables` succeeds without skipping bookings because of SQL errors (verified via targeted script).
- [ ] Manual confirm responses surface actionable error messages by populating the `message` field alongside existing `error`/`code` keys.

## Architecture & Components

- `supabase/migrations/*_assign_tables_atomic_v2.sql`: add a corrective migration that `CREATE OR REPLACE` the function, qualifying `table_id` references and guarding against future ambiguity.
- `server/capacity/tables.ts`: no structural changes anticipated, but we will re-run `confirmHoldAssignment` post-migration to ensure telemetry path remains intact.
- `src/app/api/staff/manual/confirm/route.ts`: adjust error envelope to include `message` so `fetchJson` surfaces Supabase-provided context.
  State: Manual booking details dialog relies on TanStack Query caches (`manualAssign.context`), invalidated after successful confirmation.

## Data Flow & API Contracts

Endpoint: POST `/api/staff/manual/confirm`  
Request: `{ bookingId: uuid, holdId: uuid, idempotencyKey: string, requireAdjacency?: boolean }`  
Response (success): `{ bookingId, holdId, assignments: { tableId, assignmentId?, startAt?, endAt? }[] }`  
Errors: `{ message, error, code, details?, hint? }` → `message` mirrors `error` for backward compatibility; `code` propagates Supabase SQLSTATE when available.

## UI/UX States

- Loading: confirm button shows progress via existing mutation pending state.
- Error: toast shows specific `message` from response (e.g., hold expired, conflict) instead of generic `Request failed with status 409`.
- Success: toast “Tables assigned” (unchanged) and dialog updates assignment list.

## Edge Cases

- Confirming holds with multiple table ids (ensures qualified `t.table_id` still dedupes correctly).
- Reconfirming with a new idempotency key after success (RPC should return stored assignments).
- Holds expiring mid-confirm — expect `HoldConflictError` to propagate with descriptive message.

## Testing Strategy

- Unit: add/extend Supabase-level regression via script (or Vitest harness) that invokes `assign_tables_atomic_v2` with a sample array and asserts no `42702` is thrown.
- Integration: run targeted node script against remote Supabase (service client) to confirm booking `c2f8218e-dac4-4ca2-a1e7-22aed90f2cba` now assigns successfully.
- E2E: once dev server is up, exercise manual confirm via UI (Chrome DevTools MCP) to ensure toast/error handling works (tracked in verification phase).
- Accessibility: no new UI elements; rely on existing dialog semantics.

## Rollout

- Feature flag: none; hotfix via migration + API tweak.
- Exposure: immediate once Supabase migration is deployed remotely (`supabase db push` with production safeguards).
- Monitoring: watch `capacity.rpc.conflict` telemetry and manual assignment error logs for lingering 42702 messages after rollout.
