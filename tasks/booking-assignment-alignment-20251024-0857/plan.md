# Implementation Plan: Auto-assignment Logic Alignment

## Objective

Clarify and document the reservations auto-assignment flow so it matches our current Supabase schema and capacity engine code (`server/capacity/*`), then backfill Supabase seeds so every restaurant has a baseline set of tables (capacities 2, 4, 7, 9).

## Success Criteria

- [ ] Logic outline cites the actual tables/fields (`table_inventory`, `table_adjacencies`, etc.) and current enum values.
- [ ] Constraints and heuristics mirror what `server/capacity/tables.ts` + `selector.ts` execute today.
- [ ] Documented flow references `assign_tables_atomic` RPC and booking status usage.
- [ ] Seed script populates `allowed_capacities`, a default zone, and four tables (capacities 2, 4, 7, 9) per restaurant without violating FK/unique constraints.
- [ ] Seed reruns are safe (`ON CONFLICT`/UPSERT) and adopt existing CTE structure in `supabase/seed.sql`.

## Architecture & Components

- `server/capacity/tables.ts`: orchestrates scheduling, availability filtering, selector ranking, and atomic assignment RPC.
- `server/capacity/policy.ts`: provides service windows, turn durations, buffer rules, timezone handling.
- `server/capacity/selector.ts`: scores candidate table plans (adjacency-aware, limits table count/overage).
- Supabase tables: `table_inventory`, `table_adjacencies`, `allowed_capacities`, `bookings`, `booking_table_assignments`, `restaurant_service_periods`, `restaurants`, `zones`.
- Seed targets: `allowed_capacities`, `zones`, `table_inventory` (dependent order).

## Data Flow & API Contracts

- Input bookings (`booking_status` in `{pending_allocation,pending,confirmed}`) pulled for a date.
- Inventory fetched from `table_inventory` filtered by `restaurant_id`.
- Adjacency graph built from `table_adjacencies`.
- `assign_tables_atomic` RPC invoked with `booking_id`, `table_ids`, ISO block window, producing rows in `booking_table_assignments`.
- Seeds: iterate over `public.restaurants`, cross-join with desired capacities, generate zone + table rows, and insert via UPSERT.

## UI/UX States

- Not applicable — deliverable is backend logic documentation.

## Edge Cases

- `mobility='fixed'` tables never merge; `min_party_size`/`max_party_size` guard assignments.
- Inactive bookings (`cancelled`, `no_show`) ignored when seeding schedule.
- Policy exceptions (service overrun) raise `ServiceOverrunError` and skip booking.
- Adjacency gaps limit combo generation despite movable tables.
- Seed order must respect FK dependencies; ensure zone insert uses deterministic naming to avoid duplicate conflicts.

## Testing Strategy

- Consistency check: cross-read with `types/supabase.ts` to verify referenced fields.
- Spot-check against auto-assign tests (`tests/server/capacity/autoAssignTables.test.ts`) for behavioural match.
- Peer review to confirm parity with runtime logic.
- Run Supabase lint (`supabase db lint`) if available, or at minimum parse/format script; ensure script compiles by running through `psql -f` (dry run). (Manual execution deferred to maintainer per remote-only rule.)

## Rollout

- Update documentation only; no code changes or feature flags required.
- Provide seed script in repo; execution occurs against remote Supabase following standard ops checklist.
