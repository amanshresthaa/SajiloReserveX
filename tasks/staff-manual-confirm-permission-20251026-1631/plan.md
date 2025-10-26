# Implementation Plan: Staff Manual Confirm Permission Fix

## Objective

We will enable staff to confirm manual holds so that they can complete the booking flow without permission errors.

## Success Criteria

- [ ] Manual confirm endpoint succeeds for authorized staff with valid hold.
- [ ] No regression to existing manual hold validation/hold steps.

## Architecture & Components

- Supabase migrations: add a new SQL migration under `supabase/migrations/` that grants `SELECT` on `table_holds` and `table_hold_members` to the `authenticated` role (and optionally reaffirms access for `service_role` for clarity).
- API code (`src/app/api/staff/manual/confirm/route.ts`) remains unchanged; once privileges update, the existing route handler client can read hold rows as intended.

## Data Flow & API Contracts

Endpoint: `POST /api/staff/manual/confirm`
Request: `{ bookingId: uuid, holdId: uuid, idempotencyKey: string, requireAdjacency?: boolean }`
Response: `{ holdId: uuid, bookingId: uuid, assignments: Assignment[] }`
Errors: unaffected; expect removal of `HOLD_LOOKUP_FAILED` 500 due to permission error.

## UI/UX States

- Loading: Existing UI spinners while confirm mutation in flight (no changes).
- Empty: Not applicable.
- Error: Ensure backend no longer surfaces `HOLD_LOOKUP_FAILED`; existing conflict/error handling unchanged.
- Success: Confirm modal completes and returns assignments payload for UI to render.

## Edge Cases

- Migration should be safe to run multiple times; `GRANT` statements are idempotent.
- Confirm that holds created by other staff remain accessible; no additional privileges needed beyond SELECT.

## Testing Strategy

- Unit: No code changes.
- Integration: Rely on existing server tests; consider adding regression coverage if privilege issues recur.
- E2E: Manual verification via running the confirm flow against dev API after migration.
- Accessibility: Not impacted (no UI changes).

## Rollout

- Feature flag: None.
- Exposure: Deploy migration with app code; once applied, confirm API works for all staff.
- Monitoring: Watch server logs for `[staff/manual/confirm] hold lookup failed` after rollout to ensure errors disappear.
