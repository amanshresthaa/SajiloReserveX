# Verification Report

## Manual QA — Chrome DevTools (MCP)

Tool: Not applicable (database seed update only; QA to be completed after running seeds remotely)

## Database Verification Checklist

- [ ] Run `pnpm db:seed-only` (or equivalent service-role invocation) against staging and ensure the script completes without errors.
- [ ] Validate core counts:
  - `SELECT COUNT(*) FROM public.restaurants;` → expect **8**
  - `SELECT COUNT(*) FROM public.zones;` → expect **40**
  - `SELECT COUNT(*) FROM public.table_inventory;` → expect **320**
  - `SELECT COUNT(*) FROM public.customers;` → expect **960**
  - `SELECT COUNT(*) FROM public.bookings;` → expect **1440** (180 per restaurant)
  - `SELECT COUNT(*) FROM public.booking_table_assignments;` → expect **>= confirmed bookings** (one per booking)
- [ ] Spot check referential integrity (e.g., bookings joined to slots, assignments, holds).
- [ ] Inspect seeded feature flags / capacity rules for correctness.

## Test Outcomes

- [ ] Seed execution on staging (pending)
- [ ] Spot query verification (pending)
- [ ] Holds + window trigger behaviour confirmed (pending)

## Known Issues

- [ ] Pending remote execution validation (owner: engineering)

## Sign-off

- [ ] Engineering
- [ ] Design/PM
