# Research: Table Management System

## Existing Patterns & Reuse

- Supabase schema: `public.table_inventory` holds physical tables with capacity guardrails and status enum (`supabase/migrations/20251016091800_create_table_inventory.sql`). Follow-on migration introduces zones, adjacency, merge metadata, and allocation scaffolding (`supabase/migrations/20251018103000_inventory_foundations.sql`).
- Assignments: `public.booking_table_assignments` plus RPC helpers (`assign_table_to_booking`, `unassign_table_from_booking`) manage linkage and mutate table status (`supabase/migrations/20251016092000_create_booking_table_assignments.sql`). Node layer wraps these via `server/capacity/tables.ts:879-941`.
- API layer: `/api/ops/tables` endpoints expose CRUD and adjacency management with zod validation and Supabase route clients (`src/app/api/ops/tables/route.ts`, `[id]/route.ts`, `[id]/adjacent/route.ts`).
- Client services: `src/services/ops/tables.ts` provides typed access consumed by contexts (`src/contexts/ops-services.tsx`) and UI (`src/components/features/tables/TableInventoryClient.tsx`).
- Booking dashboards reuse table merge utilities (`src/utils/ops/table-merges.ts`, `server/ops/bookings.ts:123-211`) to display combined tables consistently.
- Auto-assignment engine centralizes selection, scheduling, and rollback logic (`server/capacity/tables.ts:300-780`) while sharing policy helpers with other capacity services (`server/capacity/policy.ts`).

## External Resources

- Supabase RLS, triggers, and enums ensure data integrity (verified across migrations and generated typings `types/supabase.ts:1375-1449`).
- Luxon handles timezone-aware booking windows (`server/capacity/tables.ts:1-140`).
- Zod enforces API contracts end-to-end (`src/app/api/ops/tables/route.ts:19-74`, `[id]/route.ts:17-64`, `[id]/adjacent/route.ts:3-14`).

## Constraints & Risks

- Capacity limited to `{2,4,5,7}` via DB constraints and API schemas; expanding requires coordinated migrations and contract updates.
- Zones mandatory: adjacency and merges demand same-zone tables (`supabase/migrations/20251018103000_inventory_foundations.sql:93-218`, `src/app/api/ops/tables/[id]/adjacent/route.ts:66-142`).
- Table status depends on RPC path; updating rows directly risks desyncing `status` from actual bookings (`supabase/migrations/20251016092000_create_booking_table_assignments.sql:149-188`).
- Auto-assignment requires complete booking metadata; missing start times or invalid policies cause skips and manual intervention (`server/capacity/tables.ts:374-454`).
- Merge eligibility derived from category/seating/mobility; inconsistent CRUD inputs can hinder auto merges (`src/app/api/ops/tables/route.ts:93-124`, `server/capacity/tables.ts:682-856`).
- RLS bound to `user_restaurants()`; incorrect client selection leads to permissions errors (`supabase/migrations` policies in `20251016091800` and `20251016092000`).

## Comprehensive Analysis

- **Lifecycle Overview**
  - `table_inventory` persists physical tables, status, and capacity checks (`supabase/migrations/20251016091800_create_table_inventory.sql`). Type bindings confirm field availability (`types/supabase.ts:1375-1449`).
  - Zones/adjacency/merge scaffolding ensure tables can be grouped logically (`supabase/migrations/20251018103000_inventory_foundations.sql`).
  - `booking_table_assignments` tracks assignments, enforces uniqueness, and logs audit events (`supabase/migrations/20251016092000_create_booking_table_assignments.sql:9-160`).
  - Assignment RPC auto-links to `booking_slots`, aligning table reservations with slot capacity tracking (`supabase/migrations/20251016092000_create_booking_table_assignments.sql:149-188`, `supabase/migrations/20251016091900_create_booking_slots.sql:1-160`).
- **Management Interfaces**
  - REST endpoints validate payloads, enforce restaurant ownership, and surface merge eligibility metadata (`src/app/api/ops/tables/route.ts:19-207`).
  - Update/delete paths guard against cross-restaurant actions and block deletion when future assignments exist (`src/app/api/ops/tables/[id]/route.ts:17-206`).
  - Adjacency handlers rebuild symmetric links under same-zone constraints (`src/app/api/ops/tables/[id]/adjacent/route.ts:3-210`).
  - Assignment APIs authenticate staff, then escalate through service-role RPCs for mutation before returning updated assignments (`src/app/api/ops/bookings/[id]/tables/route.ts:1-88`, `[tableId]/route.ts:1-102`).
  - Frontend services ingest DTOs, normalize positions, and provide adjacency editing flows (`src/services/ops/tables.ts:1-210`, `src/components/features/tables/TableInventoryClient.tsx:1-340`).
- **Assignment Workflow**
  - Manual: RPC `assign_table_to_booking` sets table `status` to `reserved` but relies on operator vigilance for conflict avoidance (`supabase/migrations/20251016092000_create_booking_table_assignments.sql:149-188`).
  - Auto: `loadAssignmentContext` builds schedule and adjacency maps; `assignTablesForBooking` filters availability, handles merges, and rolls back on failure (`server/capacity/tables.ts:518-780`).
  - Merge logic generates deterministic group IDs but doesn’t persist merge_groups records yet, leaving `merge_groups` tables unused (`server/capacity/tables.ts:320-420` vs `supabase/migrations/20251018103000_inventory_foundations.sql:400-470`).
  - Conflict detection: scheduling map prevents double-booking within auto flow, but manual RPC path lacks overlap checks (`server/capacity/tables.ts:200-271`, `src/app/api/ops/bookings/[id]/tables/route.ts:35-74`).
- **Dependencies & Data Flow**
  - UI ➜ service ➜ API ➜ Supabase route client ➜ service-role RPC pipeline respects RLS while keeping React Query caches consistent (`src/contexts/ops-services.tsx:35-78`, `server/supabase.ts:1-88`).
  - Booking summaries pull table metadata and merge info for dashboards (`server/ops/bookings.ts:123-211`, `src/utils/ops/table-merges.ts:1-74`).

## Open Questions (and answers if resolved)

- Q: How are tables transitioned to `occupied` or `out_of_service`?
  A: No handlers observed. Current workflow toggles only between `available` and `reserved` via RPC; post check-in flow likely unimplemented.
- Q: Are merge groups persisted?
  A: Merge tables exist but no writes discovered; auto-assign simply composes IDs in memory. Consider future linkage.
- Q: Who syncs booking slot capacity with assignments?
  A: RPC ties assignments to existing slots but doesn’t alter capacity counters beyond `reserved_count`; capacity adjustments happen elsewhere (outside table module).

## Bottlenecks, Redundancies & Scalability Issues

- Manual assignment lacks overlap prevention, risking double-booking under concurrent operators.
- Auto-assignment runs sequentially per request, meaning high-volume days could tax the Node process and suffer race conditions without DB-level locks.
- Table status lifecycle incomplete—status may stagnate at `reserved`, eroding floor plan accuracy.
- Enforcement of `{2,4,5,7}` capacity simplifies merges but constrains diverse layouts; future changes require cross-layer updates.
- Merge infrastructure partially deployed (merge_groups, allocations) but unused, generating maintenance cost without delivering value.

## Optimization Recommendations

1. Introduce conflict detection (trigger or RPC validation) before assigning tables to prevent overlapping reservations.
2. Persist merge groups/allocations when combining tables so downstream analytics and cleanup operate on durable records.
3. Automate status transitions based on booking check-in/out to keep inventory accurate.
4. Bundle auto-assignment operations into single transactional RPC to lower round-trips and guard against partial writes.

## Recommended Direction (with rationale)

- Publish an end-to-end lifecycle doc tying CRUD, adjacency, assignments, and auto workflows together—current logic spans migrations, RPC, API, and UI layers.
- Address conflict detection and status lifecycle gaps to improve reliability ahead of scaling auto-assignment.
- Activate merge infrastructure or prune it to reduce cognitive load until the feature is fully adopted.

---

## Detailed Architecture Analysis

### 1. Data Storage & Schema Guarantees

**Core table model (`public.table_inventory`)**

- Columns cover identity, capacity, party size thresholds, section labeling, seating metadata, JSON `position`, operational `status`, and `active` flag (`supabase/migrations/20251016091800_create_table_inventory.sql:23-68`).
- Constraints enforce positive capacity and party sizes, uniqueness of `(restaurant_id, table_number)`, and ensure max ≥ min party size (`supabase/migrations/20251016091800_create_table_inventory.sql:23-44`).
- Later migration normalizes capacity into `{2,4,5,7}`, adds `zone_id`, `category`, `seating_type`, `mobility`, and `active` columns with NOT NULL enforcement plus FK to `zones` (`supabase/migrations/20251018103000_inventory_foundations.sql:93-218`). This standardization supports merge strategies but constrains custom layouts.
- Index trio: `(restaurant_id,status,capacity)` for availability lookups and `(restaurant_id,section)` for floor-plan filters (`supabase/migrations/20251016091800_create_table_inventory.sql:64-68`). Zone index appended later (`supabase/migrations/20251018103000_inventory_foundations.sql:218-219`).

**Supporting entities**

- `zones`: canonicalizes spatial grouping; RLS restricts management to staff with restaurant membership (`supabase/migrations/20251018103000_inventory_foundations.sql:26-70`).
- `table_adjacencies`: symmetric adjacency pairs with triggers guaranteeing same-zone membership and automatic reciprocal edges (`supabase/migrations/20251018103000_inventory_foundations.sql:240-308`).
- Merge infrastructure (`merge_rules`, `merge_groups`, `merge_group_members`, `allocations`) sets foundation for tracking combined seating and temporal allocations but is not yet used by runtime code (`supabase/migrations/20251018103000_inventory_foundations.sql:325-470`).
- Enum ladder `table_category`, `table_mobility`, `table_seating_type`, `table_status` standardizes classification; generated TypeScript definitions mirror these (`types/supabase.ts:1375-1449`).

**Assignment ledger (`public.booking_table_assignments`)**

- Stores assignment lineage with audit triggers, redundancy on `assigned_by`, optional `slot_id`, and ensures uniqueness of table per booking (`supabase/migrations/20251016092000_create_booking_table_assignments.sql:9-160`).
- RPC `assign_table_to_booking` verifies booking/table restaurant alignment, links to booking slot, inserts or refreshes assignment, and sets table status `reserved` (`supabase/migrations/20251016092000_create_booking_table_assignments.sql:149-188`).
- RPC `unassign_table_from_booking` removes assignment, flips table to `available` unless other active bookings remain (`supabase/migrations/20251016092000_create_booking_table_assignments.sql:200-236`).
- Audit trigger logs assignment changes to `audit_logs` when table is added/removed, useful for traceability across manual overrides.

**Access controls**

- Row-Level Security policies across tables restrict operations to service role and staff associated with restaurant membership; adjacency and merge policies reuse `user_restaurants()` to limit scope (`supabase/migrations/20251016091800_create_table_inventory.sql:75-119`, `supabase/migrations/20251018103000_inventory_foundations.sql:70-164`).
- Generated supabase client wrappers differentiate between anon/service role usage; service operations require `getServiceSupabaseClient()` to bypass RLS (`server/supabase.ts:20-63`).

### 2. Table Creation & Maintenance Workflow

**Step-by-step (manual creation):**

1. Ops UI triggers `tableService.create(restaurantId, payload)` (`src/services/ops/tables.ts:236-276`), normalizing merge eligibility locally.
2. Service issues POST `/api/ops/tables`; handler authenticates user via Supabase route client, validates payload (zod), checks user membership, ensures zone matches restaurant, and rejects duplicate `table_number` (`src/app/api/ops/tables/route.ts:52-188`).
3. Handler inserts row into `table_inventory`, returning normalized DTO with merge metadata for UI caching (`src/app/api/ops/tables/route.ts:193-213`).
4. React Query invalidates caches to refresh list; UI summarises totals and merge eligibility (`src/components/features/tables/TableInventoryClient.tsx:120-210`).

**Updates:**

- PATCH endpoint merges partial updates, re-validates zone relationship, preserves party size ordering, and re-computes merge eligibility (`src/app/api/ops/tables/[id]/route.ts:51-177`).
- Delete path enforces admin/owner role and blocks removal if future assignments exist by checking `booking_table_assignments` with `bookings.booking_date >= tomorrow` (`src/app/api/ops/tables/[id]/route.ts:206-262`).

**Adjacency maintenance:**

- GET fetches adjacency edges if user has restaurant access (`src/app/api/ops/tables/[id]/adjacent/route.ts:18-74`).
- PUT validates adjacency IDs, ensures same zone/restaurant via Supabase lookups, clears existing pairs, and reinserts sorted pairings which triggers DB-level symmetry insertion (`src/app/api/ops/tables/[id]/adjacent/route.ts:89-198`). This double-layered validation (application + trigger) prevents drift.
- UI adjacency dialog loads candidate tables same zone and persists selection, providing multi-table merge prospects (`src/components/features/tables/TableInventoryClient.tsx:228-332`).

**Duplicate safeguards:**

- Unique constraint on `(restaurant_id, table_number)` is mirrored by API check; conflict results in HTTP 409 with descriptive error (`src/app/api/ops/tables/route.ts:220-233`).
- Capacity schema ensures only cardinalities the auto-merge logic expects, reducing edge combinations.

### 3. Table Assignment Logic

**Manual assignment (Ops dashboard)**

1. UI calls `bookingService.assignTable` (not shown) which hits `POST /api/ops/bookings/:id/tables` with `{ tableId }` (`src/services/ops/bookings.ts:290-298`).
2. Endpoint validates IDs, loads booking, checks membership via `requireMembershipForRestaurant`, then uses service-role supabase client to call `assignTableToBooking` RPC (`src/app/api/ops/bookings/[id]/tables/route.ts:15-74`).
3. RPC ensures restaurant parity, links slot, upserts assignment, updates table status to `reserved`.
4. Endpoint fetches assignments using `getBookingTableAssignments`, returning normalized table info for UI display (`src/app/api/ops/bookings/[id]/tables/route.ts:76-86`, `server/capacity/tables.ts:905-940`).
5. No conflict detection occurs at API or RPC level beyond unique per booking; double booking is possible if two bookings target same table/time manually.

**Manual unassignment**

- Similar flow via DELETE `/api/ops/bookings/:id/tables/:tableId`, reusing membership guard and calling `unassignTableFromBooking` RPC to remove assignment and adjust table status if safe (`src/app/api/ops/bookings/[id]/tables/[tableId]/route.ts:23-93`, `supabase/migrations/20251016092000_create_booking_table_assignments.sql:200-236`).

**Auto-assignment engine**

- Entrypoints `autoAssignTables` and `autoAssignTablesForDate` require `restaurantId`/`date`, optionally `assignedBy` for audit (`server/capacity/tables.ts:948-1050`).
- `loadAssignmentContext` concurrently loads table inventory, bookings for date, and restaurant timezone. It applies `mergeEligible` heuristics matching create logic, builds adjacency map from `table_adjacencies`, and constructs schedule map of existing assignments—skipping inactive statuses and invalid windows (`server/capacity/tables.ts:532-711`).
- For each booking lacking tables and in assignable status set (`pending`, `pending_allocation`, `confirmed`), the engine:
  1. Derives booking window using policy (service periods, buffers) via `computeBookingWindow`; invalid data yields skip reason (`server/capacity/tables.ts:160-278`, `server/capacity/policy.ts`).
  2. Filters available tables by active status, capacity range, seating/section preference, min party size, and schedule conflicts using `tableWindowIsFree` (calculates time overlap as half-open intervals) (`server/capacity/tables.ts:230-320`).
  3. Chooses table(s) using `selectTablesForParty`: tries single table (capacity ≥ party), else merges 2+4 or 4+4 combos requiring adjacency and merge eligibility, returning reason if impossible (`server/capacity/tables.ts:320-420`).
  4. Calls `assignTableToBooking` for each table, with rollback on failure by calling `unassignTableFromBooking` (ensures partial success does not persist) (`server/capacity/tables.ts:420-511`).
  5. Updates in-memory schedule to block future overlapping assignments within same run.
- Result aggregates `assigned` and `skipped` arrays to inform UI or logs (`server/capacity/tables.ts:720-780`).
- Merge group ID is composed in-memory using `composeMergeGroupId`, but no DB persistence occurs (no writes to `merge_groups` yet), meaning operations rely on in-memory constructs for runtime only.

### 4. Interactions & Data Flows

- **UI ↔ Service ↔ API:** React Query orchestrates data fetching and mutation with consistent DTO shapes, letting ops team manage tables and adjacency within single interface (`src/services/ops/tables.ts:1-210`, `src/components/features/tables/TableInventoryClient.tsx:78-260`).
- **Bookings summary integration:** `server/ops/bookings.ts:123-220` reads `booking_table_assignments` and uses `inferMergeInfo` to present table combos to staff dashboards, ensuring display data reflects table inventory merges.
- **Slot alignment:** RPC `assign_table_to_booking` optionally ties assignment to `booking_slots.id` by date/time, aligning seat assignment with capacity counters (though counters themselves are maintained elsewhere) (`supabase/migrations/20251016092000_create_booking_table_assignments.sql:149-188`).
- **Policy dependencies:** Auto assignment relies on `getVenuePolicy` and buffer configuration; missing or misconfigured policy could miscalculate windows, leading to either ServiceOverrun errors or overbooking risk (`server/capacity/tables.ts:160-238`, `server/capacity/policy.ts`).
- **Service client usage:** All mutating operations intentionally escalate to service role to bypass RLS restrictions while API-level membership checks enforce authorization (`server/supabase.ts:20-63`, `src/app/api/ops/tables/route.ts:64-122`).

### 5. Failure Modes & Edge Considerations

- **Double booking risk:** Manual RPC path lacks time-overlap checks—two bookings can assign same table if performed rapidly. Auto path prevents it but only within process memory; parallel auto invocations may race.
- **Status stagnation:** Without automation, tables remain `reserved` even after guests are seated/completed, affecting availability analytics and dashboards. No code path sets `status = 'occupied'` or `'out_of_service'` aside from manual PATCH (`src/app/api/ops/tables/[id]/route.ts:86-204`).
- **Merge data drift:** Because merge groups aren’t persisted, manual adjustments (e.g., editing table categories) may desync UI expectations vs auto assignment heuristics. Adjacency updates rely on staff to maintain accurate zone placements.
- **Schema rigidity:** Enforced capacity normalization may not fit restaurants with odd-size tables (e.g., 3-top). Changing allowed capacities requires migration, API schema update, validation update, and auto-assignment adjustments.
- **RLS reliance:** Any new client code must use service role for writes; forgetting leads to 401/403 errors. RLS also assumes `user_restaurants()` returns accurate set—if function lags membership updates, staff might lose access temporarily.
- **Temporal drift:** Auto engine sorts bookings by party size then start time; large parties with incomplete data are skipped, requiring manual attention. Without dashboard surfacing skip reasons, ops might miss unassigned bookings.
- **Allocation scaffolding unused:** `allocations` table has helper function `allocations_overlap`; lack of integration means concurrency-safe scheduling is unleveraged, leaving potential for migrating logic from TypeScript to SQL.

### 6. Scalability & Performance

- **Database indices** align with primary query patterns (restaurant lookups, status filters). However, heavy adjacency updates may incur multiple DELETE/INSERT operations; consider batching strategies if adjacency counts grow.
- **Auto assignment** currently sequential; for large booking volumes (hundreds per evening) this could strain Node event loop. Options include chunking by service period or offloading to background worker.
- **Concurrency controls** absent at DB level for assignment: no locks or range checks. Under high concurrency, rely on unique constraint and human vigilance; migrating overlap detection into stored procedure would scale better.
- **Caching**: React Query caches table lists for 30 seconds (`src/components/features/tables/TableInventoryClient.tsx:121-144`); ensures low-latency UI but may briefly show outdated status after manual assignments. Manual invalidations handle most cases but consider websockets for real-time floor plans.

### 7. Optimization & Redesign Scenarios

- **Conflict-safe assignment RPC:** Extend `assign_table_to_booking` to query existing assignments overlapping `block_start/block_end` using `allocations_overlap`, raising exception on conflict. Enforce at DB level ensures both manual and auto flows safe.
- **Merge persistence:** Use `merge_groups` to record merged table sets with `merge_group_members`, enabling reversal during unassignment and giving analytics insight into combined seating frequency.
- **Status automation:** Add trigger listening to booking status changes (e.g., `checked_in`, `completed`) to set table `status` accordingly, and maybe `occupied` on check-in, `available` on checkout. Could leverage existing `apply_booking_state_transition` if available elsewhere.
- **Capacity flexibility:** Introduce configuration table for allowed capacities, referenced in validation logic, making it easier to support custom furniture while still guiding merges.
- **Background auto scheduler:** Move auto-assignment into Supabase Edge Function or scheduled job to run on set cadence, capturing skip reasons into `allocations` table for operations follow-up.
- **UI Enhancements:** Provide “conflict warnings” when manual assignment chooses table already reserved within time window, retrieving schedule from `table_adjacencies` or schedule map service.

### 8. Verification Evidence & Methodology

- Schema details cross-confirmed by inspecting migrations (`supabase/migrations/...`) and TypeScript type generation (`types/supabase.ts:1375-1449`) to ensure runtime clients match DB structure.
- API contracts verified by reading handler logic and zod schemas (`src/app/api/ops/tables/route.ts:19-207`, `[id]/route.ts:17-206`, `[id]/adjacent/route.ts:3-210`), ensuring described payloads align with UI service expectations (`src/services/ops/tables.ts:1-210`).
- Assignment flows validated via server module review (`server/capacity/tables.ts:160-780`) and RPC definitions (`supabase/migrations/20251016092000_create_booking_table_assignments.sql:149-236`).
- Potential bottlenecks evaluated by contrasting manual RPC behavior with auto-scheduler logic—lack of overlap guards confirmed by absence of checks in both TypeScript and SQL functions.
- Merge infrastructure usage checked through `rg` search confirming no writes to `merge_groups` or `allocations` beyond migration seeds, supporting conclusion that these tables are dormant.
- Policy dependencies noted through references in `server/capacity/policy.ts` (imported at top of `server/capacity/tables.ts`), ensuring booking window calculations rely on consistent timezone/service data.

### 9. Open Risks & Follow-up Questions

- Should merge tables be activated or removed until needed? Current partial deployment risks confusion.
- How do booking status transitions integrate with table state? Need cross-team alignment to avoid conflicting updates.
- What monitoring exists for skip reasons from auto assignment? Logging or dashboard integration would help operations respond promptly.
- Are there reporting requirements on table utilisation that leverage `allocations`? Without adoption, analytics may miss combined-seating insights.

Documenting these considerations within the task folder preserves institutional knowledge and highlights areas requiring strategic decisions before scaling table automation further.
