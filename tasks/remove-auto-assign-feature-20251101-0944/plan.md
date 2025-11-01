# Implementation Plan: Remove Auto Assign Feature

## Objective

We will remove the table auto-assignment capability from the Ops dashboard end-to-end (UI, API, services, capacity engine, logs) so that only manual table assignment workflows remain.

## Success Criteria

- [ ] Ops dashboard renders without an “Auto assign tables” action and no client-side code references the feature.
- [ ] `POST /api/ops/dashboard/assign-tables` is removed; build/tests succeed with no imports pointing to the deleted endpoint or capacity helpers.
- [ ] Capacity engine no longer exports `autoAssignTables*` or writes decision logs, and associated unit/benchmark tests are deleted.
- [ ] Supabase artifacts/log directories dedicated to auto assign are gone; manual assignment paths remain functional under existing tests.

## Architecture & Components

- `src/components/features/dashboard/OpsDashboardClient.tsx`: remove the button, pending state usage, and mutation call for auto assign; adjust layout copy if needed.
- `src/hooks/ops/useOpsTableAssignments.ts`: drop the `autoAssignTables` mutation, return shape, and toast logic; retain manual assign/unassign and cache invalidation.
- `src/services/ops/bookings.ts` (+ BookingService types): delete the `autoAssignTables` method and supporting response types; update mocks (e.g., `NotImplementedBookingService`) and contexts/tests relying on the method.
- `src/app/api/ops/dashboard/assign-tables/route.ts`: delete the route entirely and clean any exports/index references.
- `server/capacity`: remove `autoAssignTables`/`autoAssignTablesForDate`, `AutoAssignResult`, decision snapshot helpers, and related telemetry/logging. Update `index.ts` barrel exports, clean imports, and ensure remaining manual-assignment helpers compile.
- Ancillary assets: drop `tests/server/capacity/autoAssignTables.test.ts`, `tests/benchmarks/autoAssignTables.bench.ts`, UI tests expecting the button, and the `logs/auto-assign` directory / consolidated artifact entries referencing auto assign.

## Data Flow & API Contracts

- Retire `POST /api/ops/dashboard/assign-tables`; no new endpoint replaces it. Manual assignment continues to use existing REST operations (`POST/DELETE /ops/bookings/:id/tables`).
- Ensure removal of the API route is reflected by deleting client request helpers and any associated DTOs (`AutoAssignTablesResponse`, decision telemetry payloads).

## UI/UX States

- Loading/empty/error/success states for the reservations section continue without the auto-assign CTA; verify the layout still communicates when assignments are locked for past dates.
- No new states introduced—manual assignment UI remains unchanged.

## Edge Cases

- Confirm dashboard still handles past-date locking messaging after removing the conditional branch with the button.
- Ensure toast notifications remain meaningful (only manual assignment toasts fire).
- Deleting filesystem log helpers must not break environments where directories were expected; guard manual code against missing folders if required (likely by removing persistence entirely).

## Testing Strategy

- Unit: update/remove Vitest suites covering auto assign (e.g., `tests/server/capacity/autoAssignTables.test.ts`, `tests/ops/clients.test.ts` assertions); ensure capacity manual tests (`manualConfirm`, `manualSelection`) still pass.
- Integration/component: run relevant ops dashboard tests (`pnpm test -- tests/ops/clients.test.ts`) after updates to verify rendering logic.
- Benchmarks: delete `tests/benchmarks/autoAssignTables.bench.ts` and ensure benchmark scripts still run without it.
- TypeScript/build: run `pnpm lint` or `pnpm tsc --noEmit` if feasible to catch lingering references (priority after code edits).

## Rollout

- Feature flag: none (hard removal).
- Exposure: deploy immediately once merged; no staged rollout.
- Monitoring: rely on existing manual assignment telemetry; remove auto assign observability events if they become unreachable.
- Kill-switch: not applicable post-removal.
