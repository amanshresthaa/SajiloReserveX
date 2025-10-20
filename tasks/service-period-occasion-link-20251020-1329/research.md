# Research: Link Service Periods and Occasions

## Existing Patterns & Reuse

- Restaurant-facing service periods live in `src/components/features/restaurant-settings/ServicePeriodsSection.tsx`, persisting through `src/app/api/owner/restaurants/[id]/service-periods/route.ts` and `server/restaurants/servicePeriods.ts` with `booking_option` metadata.
- Customer-facing schedules (`GET /restaurants/[slug]/schedule`) are assembled in `server/restaurants/schedule.ts`, mapping service periods to slots and emitting `ServiceAvailability`.
- The reservation wizard consumes that schedule in `reserve/features/reservations/wizard/services/useTimeSlots.ts`; the Occasion picker (`…/OccasionPicker.tsx`) toggles options based on `serviceAvailability.services`.
- Slot grouping labels and badges (“Happy hour”, “Drinks only”) already derive from service-period data returned by the schedule endpoint.

## External Resources

- `documentation/FEATURES_SUMMARY.md` §5.3 “Configure Service Periods” — admin UX reference.
- Seed scenarios in `supabase/seeds/seed.sql` illustrate lunch/dinner/drinks period combinations.

## Constraints & Risks

- Booking options are constrained to `'lunch' | 'dinner' | 'drinks'` (DB check + API validation).
- Occasion UI assumes fixed ordering (`['lunch', 'dinner', 'drinks']`); updated logic must preserve deterministic, accessible state.
- `buildAvailability` today flags `drinks` as enabled whenever the venue is open, even if no drinks period exists—leading to customer-facing options without operational backing.
- Schedule output feeds analytics/tests; changes must retain backward compatibility where intended and update fixtures otherwise.

## Open Questions (and answers if resolved)

- Q: Should customer occasions be limited strictly to configured service periods (e.g., disable “Drinks” when no drinks period exists for the date)?  
  A: Assumed yes per request to relate the two surfaces.
- Q: Are additional booking options (e.g., breakfast) on the roadmap immediately?  
  A: No indication yet; keep approach extensible but work within current enum.

## Recommended Direction (with rationale)

- Compute `services[option]` from actual service-period coverage per slot (rather than defaulting “Drinks” to enabled) so customer toggles reflect restaurant configuration.
- Surface aggregate daily availability (e.g., set of configured booking options) for disabling occasion toggles entirely when no period exists.
- Extend/adjust associated unit & API tests to codify the linkage between service periods and customer occasion availability.
