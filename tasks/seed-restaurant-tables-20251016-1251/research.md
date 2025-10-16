# Research: Seed Tables For All Restaurants

## Existing Patterns & Reuse

- `supabase/migrations/20251016091800_create_table_inventory.sql` defines the `table_inventory` schema, constraints, and unique key `(restaurant_id, table_number)`.
- `supabase/migrations/TEST_CAPACITY_ENGINE.sql` seeds synthetic tables using `INSERT ... SELECT ... generate_series` with `ON CONFLICT DO NOTHING`; good template for bulk seeding logic.
- `supabase/seed.sql` is the main dataset seed; truncates bookings/restaurants and repopulates them (currently no table inventory seed).

## External Resources

- Supabase generated types (`types/supabase.ts`) for column defaults and enum names (`table_status`, `seating_type`).

## Constraints & Risks

- Script must be idempotent: rerunning should not duplicate tables (use unique constraint with `ON CONFLICT DO NOTHING` or pre-delete).
- Need to support all existing restaurants (production + seeded) without assuming specific IDs beyond data present.
- Capacity engine expects a reasonable spread of table sizes (2/4/6/8 tops) and sections for UI.
- Supabase seeds run remotely only; ensure script safe for remote execution and does not affect production-specific custom data.

## Open Questions (and answers if resolved)

- Q: Should tables be regenerated on every seed run or only inserted if missing?
  A: Favor additive `ON CONFLICT DO NOTHING` so script can run without disrupting manual edits; optionally include cleanup instructions in comments.
- Q: How many tables per restaurant are needed for capacity features?
  A: Follow TEST_CAPACITY_ENGINE baseline (≈10 tables) but expand to ~16 to better cover party sizes; rationale documented in plan.

## Recommended Direction (with rationale)

- Create `supabase/seeds/table-inventory.sql` that inserts a balanced mix of table sizes (2/4/6/8 seats) for every restaurant using `generate_series`, labeling sections (`Main Floor`, `Patio`, `Bar`) and ensuring idempotency via `ON CONFLICT DO NOTHING`. This keeps logic in SQL, matches existing seeding style, and is safe to run in remote Supabase.
