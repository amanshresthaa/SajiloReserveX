# Implementation Plan: Table Management System Analysis

## Objective

We will enable stakeholders to understand table lifecycle and logic so that optimization decisions are well-informed.

## Success Criteria

- [ ] Document current architecture and data flow for tables.
- [ ] Identify bottlenecks and scalability risks in table management.

## Architecture & Components

- **Database Layer**: `table_inventory`, `table_adjacencies`, `merge_groups`, `merge_group_members`, `allocations`, `booking_table_assignments`, supporting enums and RPCs (primary logic in Supabase migrations dated 2025-10-16 to 2025-10-18).
- **Server Capacity Engine**: `server/capacity/tables.ts` auto-assignment workflow, schedule construction, and RPC wrappers; policy helpers from `server/capacity/policy.ts`.
- **API Routes**: `/api/ops/tables` CRUD + adjacency endpoints, `/api/ops/bookings/[id]/tables` assign/unassign routes bridging UI and capacity layer.
- **Client Services/UI**: `src/services/ops/tables.ts`, `src/components/features/tables/TableInventoryClient.tsx`, booking dashboard components leveraging merge utilities.

## Data Flow & API Contracts

Endpoint:

- `GET/POST /api/ops/tables` – list/create tables (requires `restaurantId` query/body).
- `PATCH/DELETE /api/ops/tables/:id`, `GET/PUT /api/ops/tables/:id/adjacent`.
- `POST /api/ops/bookings/:id/tables`, `DELETE /api/ops/bookings/:id/tables/:tableId`.
  Request:
- Create table payload matches `createTableSchema` (capacity restricted to `[2,4,5,7]`, validated zone).
- Assignment payload `{ tableId: uuid }`.
  Response:
- Table endpoints return DTO with merge eligibility and summary stats; booking assignment returns `tableAssignments` array.
  Errors:
- 4xx on validation/access, 409 on conflicts (duplicate table number or unable to assign), 500 for unexpected Supabase errors.

## UI/UX States

- Loading: N/A (analysis)
- Empty: N/A
- Error: N/A
- Success: N/A

## Edge Cases

- Duplicate table numbers rejected server-side.
- Delete table blocked if future assignments exist.
- Auto-assignment skips bookings missing scheduling data or with conflicting merges.
- Adjacency updates enforce same zone/restaurant and prevent self-links.

## Testing Strategy

- N/A (analysis only)

## Rollout

- N/A
