# Research: Database-backed Reservation Availability

## Initial Requirements

- Replace hard-coded reservation schedule data with database-driven values for both customer (/reserve) and restaurant management flows.
- Ensure time slot selection ("pick a time") reflects persisted operating hours/service periods.
- Update or extend database schema/seed if current tables cannot represent required configuration.

## Success Criteria

- Customer-facing booking flow reads schedule data from Supabase (via API) rather than static config files/env.
- Restaurant management UI displays and updates the same database-backed schedule.
- Availability logic remains consistent between customer and restaurant views, with automated tests updated accordingly.

## Existing Patterns

- Owner dashboard (`components/ops/manage/ManageRestaurantShell.tsx`) already consumes Supabase-backed APIs (`/api/owner/restaurants/[id]/hours` and `/service-periods`) via React Query hooks.
- Server utilities (`server/restaurants/operatingHours.ts`, `server/restaurants/servicePeriods.ts`) encapsulate Supabase CRUD with validation and can be reused for read-only contexts.
- Customer booking wizard time-slot logic (`reserve/features/reservations/wizard/services/timeSlots.ts`) currently depends on static config from `reserve/shared/config/reservations.ts`.
- Booking wizard uses shared hooks (`usePlanStepForm` → `useTimeSlots`) that can accept injected configuration.

## Relevant Data Sources

- Supabase tables: `restaurant_operating_hours`, `restaurant_service_periods`, and `restaurants` (timezone, capacity, contact info).
- Existing migrations define structure and RLS policies allowing service-role access for backend APIs.
- Seeds (`supabase/seed.sql`) populate restaurants but do **not** insert service period/hour rows yet.

## Technical Constraints & Considerations

- Customer-side app relies on its own API client hitting Next.js `/api` routes; public endpoints must not require owner auth but can use service-role server client.
- Need to map database records (weekly schedule + overrides + named service periods) into the booking wizard’s slot/availability model.
- Current time-slot tests assume deterministic 12:00–23:00 windows with 15 minute intervals; those expectations must align with database-driven config or be updated.
- Any new migrations must maintain Supabase compatibility (SQL files under `supabase/migrations`).
- Must keep mobile-first and accessibility standards for UI changes; avoid regressing React Query state handling.

## External Resources

- Supabase RLS policies already in repo (no external docs referenced yet).

## Open Questions

- How should service period names map to booking options (Lunch/Dinner/Drinks)? Is there a canonical mapping or stored metadata?
- Should availability honor operating-hour overrides (effective_date) for the selected booking date?
- What is the desired fallback when no DB config exists—show no slots or use defaults?

## Recommendations & Next Steps

- Introduce server-layer helper that reads operating hours + service periods for a specific restaurant/date and produces normalized slot descriptors.
- Expose a public API route (e.g., `/api/restaurants/[slug]/availability`) that returns computed slots and availability, leveraging service role client.
- Update reserve booking wizard hooks (`useTimeSlots`, `PlanStepForm`) to call the new API via React Query instead of static config.
- Seed representative operating hours/service periods to ensure dev/test parity; adjust tests to mock Supabase data or API responses.
