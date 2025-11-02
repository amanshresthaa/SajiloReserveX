# Implementation Plan: RLS/Tenant Scoping Audit (E6-S1)

## Objective

Ensure RPCs and routes enforce restaurant scoping; cross‑tenant access fails closed.

## Success Criteria

- [ ] Cross‑tenant test fails closed; denial logged.
- [ ] Route queries explicitly filter by tenant.

## Architecture & Components

- Tests: add integration tests for assign/unassign with mismatched tenant.
- Routes: verify and add missing `.eq('restaurant_id', ...)` filters.

## Rollout

- Merge after tests green in CI.
