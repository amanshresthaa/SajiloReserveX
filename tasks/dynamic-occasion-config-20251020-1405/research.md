# Research: Dynamic Occasion Config

## Existing Patterns & Reuse

- `restaurant_service_periods` (Supabase) stores the name, optional day-of-week, and `booking_option` for each window; server access lives in `server/restaurants/servicePeriods.ts` where `BOOKING_OPTIONS` is a hard-coded `Set(['lunch','dinner','drinks'])` and validation happens in `normalizeBookingOption()` (lines 18-52).
- Owner/ops UX for configuring those periods is handled by `src/components/features/restaurant-settings/ServicePeriodsSection.tsx`, which expects `bookingOption: 'lunch' | 'dinner' | 'drinks'` and renders select options from `BOOKING_OPTION_CHOICES` in `types.ts`.
- `/api/owner/restaurants/[id]/service-periods` (`route.ts`) validates payloads with `z.enum(['lunch','dinner','drinks'])`, so the API currently rejects any novel occasion key.
- Public restaurant schedules are computed in `server/restaurants/schedule.ts`, which assumes a `BookingOption` union of `['lunch','dinner','drinks']` for coverage calculations, available-option ordering, default labels, and availability flags.
- Customer booking flow re-exports those constants through `@reserve/shared/config/booking.ts` and downstream pieces—`planFormSchema` (`reserve/features/reservations/wizard/model/schemas.ts`), reducer defaults (`reducer.ts`), `OccasionPicker.tsx`, `TimeSlotGrid`, analytics tests, etc.—all rely on `BOOKING_TYPES_UI = ['lunch','dinner','drinks']`.
- Back-office booking APIs (`server/bookings.ts`) also share the same enum (`BOOKING_TYPES_UI`) and contain business logic such as `calculateDurationMinutes()` keyed to the fixed set.
- Type definitions for ops services (`src/services/ops/restaurants.ts`, `hooks/owner/useServicePeriods.ts`) and Supabase types (`types/supabase.ts`) currently expose `booking_option` as a string but the generated types & UI narrow it to the trio.

## External Resources

- `documentation/FEATURES_SUMMARY.md` section “Configure Service Periods” documents the existing admin workflow and constraints around booking options.
- `docs/database/migrations-and-patches.md` references migration `20251010165023_add_booking_option_and_reservation_columns.sql`, highlighting the present CHECK constraint on `restaurant_service_periods.booking_option`.

## Constraints & Risks

- Database constraint `restaurant_service_periods_booking_option_check` (see `supabase/migrations/20251019102432_consolidated_schema.sql`) forces `"booking_option" = ANY ('{lunch,dinner,drinks}')`; any dynamic value requires altering or replacing this guard.
- Static enums live in multiple places (`lib/enums.ts`, `@shared/config/booking.ts`, reservation reducer/tests), so refactoring must avoid drift and keep type safety without circular imports between runtime data and build-time constants.
- Business rules such as durations, availability labels, analytics events, and accessibility copy currently assume lunch/dinner/drinks; introducing seasonal events (e.g., Christmas Party) means defining new semantics (time windows, date gating, display labels) without breaking existing flows.
- Owner UX expects the booking option select to have a finite, pre-known list; introducing dynamic data needs to account for empty states, descriptive metadata, and validation so operators cannot select invalid combinations.
- Extensive automated test coverage references the legacy options; we need a migration path that keeps tests meaningful without brittle string comparisons.
- Remote Supabase is the source of truth (per AGENTS non-negotiables), so migrations must be prepared and coordinated but cannot be run locally; we must note remote execution steps in `verification.md`.

## Open Questions (and answers if resolved)

- Q: Where should the source-of-truth catalogue of occasion types live (per-restaurant vs global)?  
  A: Likely a global `occasion_types` (or similar) table that stores metadata (`key`, human label, availability rules, default durations) that restaurants reference via `booking_option`; keeps additions centralized and aligns with “/ops configurability”.
- Q: How should seasonal/temporal rules (e.g., “only December”, “specific dates”) be represented?  
  A: Need a schema capable of encoding rule types—suggest a JSONB column or child table capturing `availability_kind` (`anytime`, `time_window`, `month_only`, `date_range`, `specific_dates`) plus parameters so logic can evaluate dynamically.
- Q: Do durations differ per occasion and should they override the default 90/120-minute defaults?  
  A: Requirements mention drinks “available anytime” but not duration changes; confirm whether durations should be part of the configurable metadata to avoid future hardcoding.
- Q: Should customer-facing copy (labels/descriptions) come from the same data source to avoid updating React components each time?  
  A: Yes—need confirmation that ops-side metadata will include display strings accessible to the customer UI.

## Recommended Direction (with rationale)

- Introduce an `occasion_catalog` (name TBD) Supabase table with columns for immutable key, display label, customer/ops descriptions, default duration, ordering weight, and availability rule payload; add a migration to seed initial rows for lunch/dinner/drinks plus examples like christmas_party and curry_and_carols.
- Replace the current CHECK constraint on `restaurant_service_periods.booking_option` with a FK reference to the catalog table; ensure API validations consult the catalog rather than hard-coded enums.
- Add an `/api/ops/occasions` endpoint & corresponding client service (`src/services/ops/occasions`) that delivers the catalog to admin UI, including rule metadata so future options can be toggled on/off without code changes.
- Update owner UI (`ServicePeriodsSection`) to fetch occasion catalog entries and populate the select dynamically; include metadata (e.g., icons, availability hints) if available.
- Extend public schedule building (`server/restaurants/schedule.ts`) to load occasion definitions once (cacheable) and drive coverage, ordering, labels, and date constraints from that data; expose enriched occasion metadata in `RestaurantSchedule.availableBookingOptions`.
- Refactor shared constants (`@shared/config/booking.ts`, `lib/enums.ts`, reservation reducer/schema) to derive valid options from the runtime catalog (with sensible fallbacks if fetch fails) while preserving TypeScript safety via generated types or discriminated unions.
- Implement availability evaluators that inspect each occasion’s rule (always-available, time-window, month, specific date list) so that both ops and customer surfaces remain consistent and extensible.
