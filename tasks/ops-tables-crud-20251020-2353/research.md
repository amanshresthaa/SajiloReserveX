# Research: Ops Tables CRUD

## Existing Patterns & Reuse

- `src/app/(ops)/ops/(app)/tables/page.tsx` renders a simple shell that defers to the client component; this matches other ops sections and keeps routing consistent.
- `src/components/features/tables/TableInventoryClient.tsx` already wires CRUD + adjacency flows: it relies on React Query, Shadcn UI primitives, and context-provided services (`useTableInventoryService`, `useOpsSession`, `useToast`) for mutations.
- `src/services/ops/tables.ts` maps API DTOs to domain objects and exposes `list/create/update/remove/getAdjacency/updateAdjacency`; it depends on `fetchJson` and reuses `queryKeys.opsTables` for cache invalidation.
- API routes live under `src/app/api/ops/tables`:
  - `route.ts` implements GET/POST with Supabase row level security checks and zone lookups (DB constraint enforces optional capacity configuration).
  - `[id]/route.ts` handles PATCH/DELETE, enforces membership, and syncs maintenance allocations through the service-role client.
  - `[id]/adjacent/route.ts` persists table adjacency pairs in `table_adjacencies`.
- `src/services/ops/allowedCapacities.ts` and `/api/ops/allowed-capacities` already manage the supporting `allowed_capacities` table used in table validation.
- Shared infra: `getRouteHandlerSupabaseClient`, `getServiceSupabaseClient`, `useOpsSession`, Shadcn Dialog/Input/Select primitives, and React Query mutation patterns can be reused instead of rebuilding plumbing.

## External Resources

- Remote schema snapshot pulled via `pnpm run db:pull` → `supabase/migrations/20251020235523_remote_schema.sql` (diff) and consolidated definition `supabase/migrations/20251019102432_consolidated_schema.sql`.
  - `public.table_inventory`: columns (`id`, `restaurant_id`, `table_number`, `capacity`, `min_party_size`, `max_party_size`, `section`, `status`, `position`, `notes`, timestamps, `zone_id`, `category`, `seating_type`, `mobility`, `active`) with checks on party sizes, FK to `restaurants`, FK to `zones`, FK `(restaurant_id, capacity)` → `allowed_capacities`, and unique `(restaurant_id, table_number)`.
  - `public.allowed_capacities`: `(restaurant_id uuid, capacity smallint)` with uniqueness by composite PK and FK target for `table_inventory`.
  - `public.table_adjacencies`: pairs `table_a/table_b` with cascade deletes, used for adjacency editing.
  - `public.zones`: `id`, `restaurant_id`, `name`, `sort_order`; FK to restaurants.
- Supabase row level security policies in schema (e.g., “Staff can manage table inventory”) confirm that API calls must originate from authenticated contexts to satisfy RLS.

## Constraints & Risks

- CRUD must respect remote constraints: the `(restaurant_id, capacity)` FK remains in Supabase (DB will reject missing configs unless we upsert on demand), `max_party_size` should be `>= min_party_size`, and table numbers must remain unique per restaurant.
- FK to `zones` means we need accurate zone IDs from supabase; UI must guard against empty zone lists and provide fallbacks.
- RLS + membership checks require we continue verifying user access (owner/admin for destructive actions) through Supabase; server handlers must keep using service-role client only when RLS-safe.
- Maintenance allocation side effects in PATCH can fail; need defensive rollback + clear messaging (already partially present).
- Deleting a table with future assignments is blocked; UI should surface API error states gracefully.
- We have to keep the Shadcn UI + accessibility patterns intact (labels, focus management) and run Chrome DevTools MCP QA before completion.
- Approval policy `never` means we cannot ask for elevated commands; all tooling must succeed under default permissions.

## Open Questions (and answers if resolved)

- Q: Do we need to alter existing React Query/service plumbing or can we reuse it?
  A: The patterns align with other ops surfaces; we can reuse them and focus on reconciling DTOs with the current schema.
- Q: Are there schema fields not surfaced in the UI (e.g., `position`, maintenance windows) that need CRUD coverage?
  A: `position` remains optional (`jsonb`); remote schema doesn’t add new mandatory columns, so we can keep it null until floor-plan editing is designed.
- Q: Should CRUD rely on additional Supabase RPCs introduced in recent migrations?
  A: Latest migrations `20251020193000_update_capacity_rpc.sql` + `20251020232438_remove_capacity_schema.sql` don’t introduce new RPCs required for tables; current direct table access remains valid.

## Recommended Direction (with rationale)

- Keep the existing service + API layering but realign DTO typing and validation strictly to the remote schema (generate or reference Supabase types to avoid drift).
- Rework the client UI workflow to load zones before presenting form controls and rely on the API to upsert capacity allowances as needed.
- Harden server handlers against schema constraints (explicit error messages for FK/constraint failures) and ensure merge-eligible flag is derived consistently from schema-backed fields.
- Extend verification to include adjacency and maintenance flows after CRUD actions, leveraging Chrome DevTools MCP for accessibility/performance validation.
