# Implementation Plan: Fix Build Type Errors

## Objective

We will enable the build to succeed by resolving type errors so that the Next.js build can complete without failures.

## Success Criteria

- [x] `pnpm run build` completes successfully without type errors.
- [x] Updated code paths align with existing data contracts and pass TypeScript checks.

## Architecture & Components

- `src/app/api/ops/bookings/[id]/tables/[tableId]/route.ts`: adjust handler signature to use synchronous `params` and reuse existing parsing flow.
- `server/ops/bookings.ts`: introduce a typed projection for the Supabase query result to avoid over-broad casts; reuse `TodayBooking` mapping logic.
- `src/hooks/ops/useOpsTableAssignments.ts`: allow null-aware params and guard cache invalidations.
- `src/components/features/dashboard/OpsDashboardClient.tsx`: instantiate assignment hook unconditionally (before early returns) and gate handlers when prerequisites missing.

## Data Flow & API Contracts

Endpoint: `DELETE /api/ops/bookings/:id/tables/:tableId`
Request: path params `{ id: string; tableId: string }`
Response: `{ tableAssignments: Array<{ tableId: string; tableNumber: string; capacity: number | null; section: string | null }> }` on success; `{ error: string }` on failures (status 400/401/403/409/500).
Errors: maintain existing semantics (invalid ids, auth failure, booking not found, forbidden, unassign failure, fetch failure).

## UI/UX States

- Not applicable (server-side focus)

## Edge Cases

- Ensure handler still guards invalid UUID params and unauthenticated users.
- Handle bookings lacking any table assignments (should return empty array, `requiresTableAssignment` stays true).
- Accommodate bookings where nested table inventory data is missing (`table_inventory` nullable).
- Ops dashboard should not attempt table mutations when restaurant context is absent.

## Testing Strategy

- Unit: adjust/extend existing route handler tests if present to cover new signature.
- Integration: rely on existing Supabase-backed tests; ensure TypeScript catches mismatches.
- UI smoke: exercise Ops dashboard flows to confirm no hook warnings and interactions succeed.
- Accessibility: Not applicable

## Rollout

- Feature flag: Not applicable
- Exposure: 100%
- Monitoring: Build pipeline success rate
