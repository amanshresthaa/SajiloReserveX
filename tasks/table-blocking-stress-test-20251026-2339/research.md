# Research: Table Blocking Stress Test

## Existing Patterns & Reuse

- `server/capacity/tables.ts` drives all allocation writes, including the helper `computeBookingWindow` and `assignTablesForBooking` loops that generate `allocations` rows and call the Supabase RPC (`assign_tables_atomic_v2`).
- Table availability is ultimately surfaced from `table_inventory.status`, which is mutated inside Supabase by the `public.refresh_table_status` function whenever allocations change (see `supabase/migrations/20251026221500_refresh_table_status_active_window.sql`).
- Existing Vitest suites (`tests/server/capacity/…`) already mock Supabase clients; the `selector.scoring` suite shows how to build deterministic fixtures for allocator behaviour. We can reuse that pattern for a stress harness, focusing on overlap windows rather than scoring.

## External Resources

- `supabase/migrations/20251026221500_refresh_table_status_active_window.sql` – latest definition of `refresh_table_status`, which now only marks tables reserved when `a."window" @> now()`.
- `supabase/migrations/20251026192000_update_refresh_table_status_v2.sql` – prior iteration of the same function; useful for understanding historical behaviour that treated any future allocation as reserved.
- `tasks/table-blocking-bug-20251026-1852/` and `tasks/table-availability-logic-20251026-2204/` – earlier investigations documenting how stale reservations surfaced in Ops UI.

## Constraints & Risks

- Supabase is remote-only; we cannot spin up a local instance, so any stress test that touches persistence must either (a) run against the remote staging DB (risky) or (b) mock the RPC layer to simulate Supabase responses.
- The allocator relies on time-based logic (`now()` on the database). Stress simulations must control or stub time, otherwise the behaviour will depend on wall-clock progression and be flaky.
- Production data integrity is critical; a stress test that writes real allocations via RPC could pollute live schedules if pointed at a shared environment. We need to confine the test harness to a controlled dataset or pure in-memory simulation.

## Open Questions (and answers if resolved)

- Q: Does the updated `refresh_table_status` function deploy automatically in development?  
  A: Not yet; the new migration exists locally but has not been applied. Until it runs against the remote database, the legacy behaviour (blocking until `upper(window) > now()`) persists.
- Q: Can we reproduce the issue solely within application code without touching the database?  
  A: Partially. We can simulate allocation windows finishing and validate that subsequent `refresh_table_status` invocations would flip the status, but to confirm table unblocking we need to exercise the actual PL/pgSQL or at least verify its logic via unit tests.

## Recommended Direction (with rationale)

- Build a focused stress harness that:
  1. Generates a batch of allocation windows surrounding the current time (before/during/after) to validate how `refresh_table_status` should classify them.
  2. Invokes the Supabase function logic in isolation (via a lightweight PL/pgSQL regression test or TypeScript port) to confirm expected outcomes.
  3. If direct DB execution is off-limits, leverage `postgres.js` with a transactional sandbox or extend existing Vitest suites to mock `now()` and assert post-window releases.
- This keeps the investigation deterministic, avoids mutating remote data, and produces concrete evidence of whether the current function satisfies the requirement. If the function still marks tables reserved after `upper(window) < now()`, we document the failing scenario and prepare migration fixes.
- Initial smoke run against the live function confirmed expected behaviour (reserved during active window, available otherwise), so next steps should target the specific tables/users exhibiting lingering reservations—likely due to overlapping allocations or the old function still running in certain environments.
