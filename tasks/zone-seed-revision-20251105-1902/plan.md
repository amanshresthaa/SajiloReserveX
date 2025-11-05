# Implementation Plan: Zone Seed Revision

## Objective

Seed one restaurant with two zones and specific table counts/mobility.

## Success Criteria

- [ ] Seed executes without FK errors
- [ ] Zones named exactly 'Dining 1' and 'Dining 2'
- [ ] Tables match requested counts and mobility

## Architecture & Components

- Update SQL CTEs for zone defs and layout
- Adjust allowed capacities to include 7

## Testing Strategy

- Run db:seed-only in staging/dev
- Verify `public.table_inventory` counts by zone and mobility

## Rollout

- No production seeding. For dev/test only.
