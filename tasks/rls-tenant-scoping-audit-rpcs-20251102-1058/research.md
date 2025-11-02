# Research: RLS/Tenant Scoping Audit of RPCs (E6-S1)

## Requirements

- Functional:
  - Verify `assign_tables_atomic_v2` and `unassign_tables_atomic` consistently enforce `restaurant_id` scoping.
  - Add integration tests; lock down route queries with explicit tenant filters.
- Non‑functional:
  - Fail closed across tenants; log denied attempts.

## Existing Patterns & Reuse

- Routes already fetch booking and check membership.
- RPCs invoked from service role; must rely on RPC internal checks and/or explicit tenant parameter.

## Constraints & Risks

- RPC definitions are in DB; code changes limited to route filters and tests.

## Recommended Direction

- Confirm RPC signatures and validate they require/derive restaurant_id, enforcing it in their queries.
- Add explicit `.eq('restaurant_id', booking.restaurant_id)` filters in route‑level queries and any ad‑hoc selects.
- Integration tests for cross‑tenant attempt: ensure denial.
