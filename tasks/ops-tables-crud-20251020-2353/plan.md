# Implementation Plan: Ops Tables CRUD

## Objective

We will enable operations staff to manage restaurant table inventory (list, create, update, delete, adjacency) from `/ops/tables`, using the live Supabase schema as the single source of truth, so that table management stays consistent with remote data and current constraints.

## Success Criteria

- [ ] `/ops/tables` loads tables + summary from `public.table_inventory` via API without schema mismatches (verified against remote supabase pull).
- [ ] Users with access can create, edit, and delete tables end-to-end; validation errors (duplicate number, FK issues) surface clear UI messaging.
- [ ] Adjacency management respects zone constraints and persists correctly; maintenance/availability status updates sync with allocations logic.
- [ ] Zones can be created, renamed, and deleted inline from `/ops/tables`, with tables list reflecting updates immediately.
- [ ] API layer covered by unit/integration tests for happy path and key failure scenarios.
- [ ] Chrome DevTools MCP QA completed for the rebuilt UI (console/network/a11y/perf).

## Architecture & Components

- `src/app/api/ops/tables`:
  - Refactor GET/POST to use a shared Supabase repository module that maps typed rows (via `types/supabase.ts`), centralizes zone lookups/access control, and upserts missing allowed-capacity rows automatically.
  - `[id]/route.ts` to reuse the repository for PATCH/DELETE, ensuring maintenance allocation logic stays intact.
  - `[id]/adjacent/route.ts` to leverage repository helpers for adjacency validation.
- Shared data helpers:
  - New `src/server/ops/tables-repository.ts` (or similar) encapsulating Supabase queries (list/summary, insert, update, delete, adjacency) to keep handlers thin and typed.
- Client:
  - Rebuild `TableInventoryClient` into composable pieces:
    - `useTableInventory` hook wrapping React Query + service,
    - `TableInventoryTable` for list view,
    - `TableFormDialog` + `TableAdjacencyDialog` for create/update/adjacency flows.
  - Service layer (`src/services/ops/tables.ts`) updated to match repository response shape and to lean on typed DTOs (mapping supabase fields → camelCase).
- UI stays Shadcn-based, mobile-first responsive, with accessible form controls and descriptive toast messaging.

## Data Flow & API Contracts

- `GET /api/ops/tables?restaurantId=<uuid>&section?=&status?=`  
  Returns `{ tables: TableDto[]; summary: { totalTables, totalCapacity, availableTables, zones: {id,name}[] } }`, where `TableDto` mirrors supabase row plus derived `zone` + `mergeEligible`.
- `POST /api/ops/tables`  
  Request: `{ restaurantId, tableNumber, capacity, minPartySize, maxPartySize?, section?, category, seatingType, mobility, zoneId, status, active, position?, notes? }`  
  Response: `{ table: TableDto }` or validation errors (409 for duplicate, 404 for missing zone, 422 when Supabase FK rejects unconfigured capacity).
- `PATCH /api/ops/tables/:id`  
  Request: partial of POST payload + optional maintenance `{ maintenance: { startIso, endIso, reason? } }`  
  Response: `{ table: TableDto }`, ensures allocations updated when status becomes/ceases `out_of_service`.
- `DELETE /api/ops/tables/:id`  
  Response: `{ success: true, deletedTableNumber }`, 409 when future assignments exist.
- `GET/PUT /api/ops/tables/:id/adjacent`  
  Maintains symmetry in `table_adjacencies` with `{ tableId, adjacentIds[] }`.
- Errors normalized to `{ error: string, ...context }` for UI consumption.

## UI/UX States

- Loading: skeleton cards + table placeholder while queries resolve; dialog forms show spinner on submit.
- Empty: show call-to-action card when no tables exist yet, with guidance to configure zones/capacities.
- Error: toast + inline Alert for fetch failures, field-level validation hints within dialogs.
- Success: toast confirmations, updated list + summary within 1s via React Query invalidation.
- Disabled states for buttons when lacking permissions or while network requests pending.

## Edge Cases

- Restaurant lacks allowed capacities → block create/update with actionable message.
- No zones configured → disable zone select, advise to configure zones first.
- Duplicate table numbers → surface conflict error from API to UI.
- Maintenance scheduling conflicts (allocations insert/delete failures) → show descriptive errors.
- Adjacency across zones or with inactive tables → reject with error message.
- RLS/auth failures → handle 401/403 gracefully (redirect or inline messaging).

## Testing Strategy

- Unit: repository functions (mock supabase client) + DTO mapping helpers (table → domain).
- Integration (API): Vitest route tests covering GET success, POST validation, PATCH maintenance path, DELETE guard, adjacency invariants.
- E2E: Playwright smoke for `/ops/tables` CRUD flow (create/edit/delete) using seeded data (remote safe subset).
- Accessibility: axe/a11y check for dialog focus order + keyboard-only flows.
- Manual QA: Chrome DevTools MCP across mobile/tablet/desktop, verify network, performance, and accessible semantics.

## Rollout

- Feature flag: none (replace existing implementation in-place).
- Exposure: ship to all ops users once tests + QA pass.
- Monitoring: observe Supabase logs for table_inventory errors + allocations, add Sentry breadcrumbs around CRUD mutations for quick regression detection.
