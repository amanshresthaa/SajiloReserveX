# Implementation Plan: Manual Hold Confirmation RLS Fix

## Objective

We will enable staff manual confirmations to proceed by ensuring RLS policies allow required access so that manual hold confirmations no longer return permission errors.

## Success Criteria

- [ ] Authenticated staff can `SELECT` their restaurant’s row from `table_holds` (manual confirm route no longer returns 500/42501).
- [ ] Supabase service client retains full CRUD on `table_holds` / `table_hold_members`.
- [ ] No unauthorized cross-restaurant data leakage through new policies.

## Architecture & Components

- `supabase/migrations/<timestamp>_table_holds_rls.sql`: enable RLS, grants, and policies for `table_holds` and `table_hold_members`.
  - Policies: `service_role` full access (`USING (true)`), `authenticated` `SELECT` scoped by `public.user_restaurants()`.
- Existing helper functions (`public.user_restaurants`, `public.user_restaurants_admin`) provide reusable membership checks; no application code changes expected.

## Data Flow & API Contracts

Endpoint: `POST /api/staff/manual/confirm`
Request: `{ bookingId: uuid, holdId: uuid, idempotencyKey: string, requireAdjacency?: boolean }`
Response: `{ holdId: uuid, bookingId: uuid, assignments: Array<{ tableId: uuid, ... }> }`
Errors: `{ error: string, code: string, details?: unknown, hint?: string }`

- The route authenticates via Supabase JWT, selects `table_holds` to validate restaurant ownership, then delegates to allocator helpers using the service client.
- Any RLS failure at the `table_holds` lookup currently throws Postgres 42501 → Next.js 500; success criteria ensure policy lets authorized staff through while still blocking outsiders.

## UI/UX States

- No direct UI changes; downstream Ops dashboard surfaces existing success/error toasts once API returns 200/4xx instead of 500.

## Edge Cases

- Holds tied to different bookings should still yield 409 conflicts (policy must allow checking `booking_id`).
- Holds with `created_by = NULL` must remain visible to staff of the restaurant.
- Unauthorized staff (no membership) should continue to receive 403 via membership check (policy should not leak row existence through RLS).

## Testing Strategy

- Unit: `pnpm test tests/server/capacity/manualConfirm.test.ts` (ensures route contract stays intact).
- Integration: `pnpm test tests/server/ops/manualAssignmentRoutes.test.ts` (mocks Supabase client; ensures route wiring unaffected).
- Manual: exercise `POST /api/staff/manual/confirm` against local dev with a seeded hold to verify 200 and absence of 500 errors.
- Accessibility/E2E: Not applicable (backend change only).

## Rollout

- No feature flag; change ships with DB migration.
- Roll forward: deploy migration → verify manual confirm flow in staging dashboards.
- Rollback: apply migration down script to drop policies + disable RLS if needed (ensure backup taken per Supabase SOP).
