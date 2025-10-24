# Research: Auto-assignment Logic Alignment

## Existing Patterns & Reuse

- `server/capacity/tables.ts` already implements the auto-assignment pipeline: load inventory (`table_inventory`), fetch bookings (`bookings` + `booking_table_assignments`), build adjacency from `table_adjacencies`, compute booking windows via `server/capacity/policy.ts`, generate candidate plans with `server/capacity/selector.ts`, and call the `assign_tables_atomic` RPC.
- Table metadata lives in `table_inventory` with fields (`mobility`, `capacity`, `zone_id`, `section`, `status`, `active`). The code maps these rows into the `Table` type used by the selector.
- Merge adjacency is encoded through `table_adjacencies` rows (pairs of table IDs); the selector consumes this adjacency map instead of a merge-group string.
- Service configuration and buffers rely on `restaurants` (`reservation_default_duration_minutes`, `reservation_last_seating_buffer_minutes`, `reservation_interval_minutes`) plus `restaurant_service_periods` and the policy helpers in `server/capacity/policy.ts`.
- Allowed capacities per venue are stored in `allowed_capacities` and enforced via an FK from `table_inventory`.
- Supabase seeding already truncates inventory-related tables in `supabase/seed.sql`; we can extend that script (or add a sibling) using the existing CTE-heavy style that iterates over `public.restaurants`.
- `table_inventory` requires `allowed_capacities` and `zones` rows to exist first (`allowed_capacities` composite PK and `zones_restaurant_name_idx` on `lower(name)`), so any seed must insert into those tables before touching `table_inventory`.

## External Resources

- Internal policy helpers (`server/capacity/policy.ts`) define turn bands, buffers, and service windows. No external specs referenced beyond Supabase schema.

## Constraints & Risks

- Mergeability is boolean via `table_inventory.mobility = 'movable'`; no dedicated merge-group column—adjacency must be respected using `table_adjacencies`.
- `booking_status` enum values differ from earlier description (`pending_allocation`, `pending`, `confirmed`, etc.).
- Assignments must go through the `assign_tables_atomic` RPC; direct writes to `booking_table_assignments` bypass surrounding consistency checks.
- `table_inventory` rows include `min_party_size`/`max_party_size`; logic must respect them when evaluating feasibility.
- Duration/turn calculations should use policy helpers to avoid diverging from `bandDuration`/`serviceWindowFor`.

## Open Questions (and answers if resolved)

- Q: Where do merge combinations live now that merge tables were dropped?  
  A: In-memory combos are built from adjacency graph (`table_adjacencies`) and movable tables. No persisted merge rules remain.

- Q: How are areas or zones represented?  
  A: `table_inventory.zone_id` references `zones`, which map to Indoor/Outdoor/Bar style areas; `section` provides additional grouping.

## Recommended Direction (with rationale)

- Anchor the documented logic to current entities: `table_inventory`, `table_adjacencies`, `allowed_capacities`, `restaurant_service_periods`, `booking_table_assignments`, and the policy helpers already in use.
- Describe merge combos as adjacency-driven unions of `mobility='movable'` tables, capped by selector config (`maxTables`) rather than a merge-group attribute.
- Frame status transitions around `booking_status` enum values and highlight that bookings stay `pending_allocation` until the `assign_tables_atomic` RPC succeeds.
- Reuse slot/block computation from `computeBookingWindow` instead of introducing a new grid abstraction; we can mention bitset availability checks conceptually but tie them back to the schedule map already implemented.
- For seeds, rely on composable CTEs that derive per-restaurant data (`allowed_capacities`, a default `Main Dining` zone, then the four requested tables) so reruns stay idempotent via `ON CONFLICT`.
