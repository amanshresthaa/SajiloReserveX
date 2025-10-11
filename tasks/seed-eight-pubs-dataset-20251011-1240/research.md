# Research: Eight Pub Seed Dataset

## Existing Seed Behaviour

- Previous `supabase/seed.sql` truncated core booking tables, deleted tracked pubs, and reseeded them with generated data.
- Only one pub used a fixed UUID; others used `gen_random_uuid()`, conflicting with the desire for deterministic IDs.
- Bookings were generated per restaurant (150 each) with mixed past/today/future distribution, totaling >1k records.
- Customer profiles were derived from inserted bookings.

## Requirements

- Seed exactly eight provided pubs with fixed IDs and contact metadata.
- Populate associated tables (operating hours, service periods, customers, bookings, customer_profiles) for those pubs only.
- Ensure total bookings ≥ 250 with distribution: 100 past, 40 today, remaining future within current month.
- Maintain varied booking statuses and metadata for realism.
- Scripts must remain idempotent and safe for remote Supabase usage.

## Constraints

- Must continue truncating relevant tables and reinsert deterministic data.
- Use UTC timezone for consistency.
- Avoid modifying Supabase-managed schemas outside `public`.

## Opportunities

- Replace `gen_random_uuid()` with provided IDs.
- Generate bookings globally to satisfy distribution counts while rotating across pubs.
- Provide validation query to verify distribution after seeding.
