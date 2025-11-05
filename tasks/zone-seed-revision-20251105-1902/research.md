# Research: Zone Seed Revision

## Requirements

- Only 1 restaurant
- Zones: Dining 1, Dining 2
- D1: 3x T-2 (movable), 5x T-4 (movable), 1x T-7 (fixed)
- D2: 6x T-4 (movable), 2x T-2 (fixed)

## Existing Patterns & Reuse

- Modify `supabase/seeds/seed.sql` Stage 4 zone/table sections
- Use existing enums: public.table_mobility, table_category
- Respect FK to `allowed_capacities`

## Constraints & Risks

- FK requires allowed capacities to include 7 if used
- Downstream stress tests may assume generic layout

## Recommended Direction

- Seed 1 restaurant (keep first)
- Allowed capacities: 2,4,7 for that restaurant
- Zones: Dining 1, Dining 2
- Tables per spec; set mobility accordingly
