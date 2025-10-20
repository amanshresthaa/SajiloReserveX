# Implementation Plan: Dynamic Occasion Config

## Objective

We will replace hard-coded lunch/dinner/drinks handling with a Supabase-backed occasion catalogue so operations can configure new events (Christmas Party, Curry & Carols, etc.) through `/ops`, and both ops and customer experiences consume the same dynamic rules.

## Success Criteria

- [ ] Supabase migration introduces a `booking_occasions` catalogue (seeded with baseline + seasonal events) and removes the old CHECK constraint by replacing it with a FK from `restaurant_service_periods.booking_option`.
- [ ] `/api/owner/restaurants/:id/service-periods` enforces catalogue membership (accepting new keys, rejecting unknown ones) and ops UI shows the dynamic list drawn from the catalogue.
- [ ] Customer schedule endpoint filters/labels occasions via catalogue rules so plan-step UI only exposes options allowed for the selected date, with automated tests covering seasonal gating.

## Architecture & Components

- **Database migration (`supabase/migrations`)**: create `booking_occasions` table (key, labels, availability JSON, default duration, display order, timestamps) and seed data; drop the static `restaurant_service_periods_booking_option_check` constraint and add FK to the catalogue.
- **Catalogue service (`server/occasions/catalog.ts` new)**: load and cache catalogue rows; expose helpers to look up definitions and evaluate availability rules (`anytime`, `time_window`, `month_only`, `date_range`, `specific_dates`) in restaurant timezone.
- **Ops REST layer**: update `src/app/api/owner/restaurants/[id]/service-periods/route.ts` to rely on catalogue keys, extend response with occasion metadata, and add a new `/api/ops/occasions` endpoint for ops clients.
- **Ops client (`src/services/ops/...`, `hooks/ops`, `ServicePeriodsSection.tsx`)**: fetch the catalogue, render select options dynamically (with descriptions/hints), and persist catalogue-aware payloads.
- **Public schedule (`server/restaurants/schedule.ts`)**: replace static arrays with catalogue-driven ordering & labels; filter slots and `availableBookingOptions` using availability helpers before returning to clients.
- **Shared booking config (`lib/enums.ts`, `@reserve/shared/config/booking.ts`, reservation reducer/schema/components)**: refactor to consume catalogue metadata (type `OccasionKey = string`, runtime guards) while retaining sensible defaults if catalogue fetch fails.
- **Customer UI (wizard)**: update `usePlanStepForm`, `OccasionPicker`, tests, and analytics hooks to rely on dynamic metadata instead of hard-coded union constants.

## Data Flow & API Contracts

- `GET /api/ops/occasions` → `{ occasions: OccasionDefinition[] }` (key, label, order, availability, duration).
- `GET/PUT /api/owner/restaurants/:id/service-periods` → `{ restaurantId, periods, occasionCatalog }`; PUT validates keys against the catalogue.
- `GET /restaurants/:slug/schedule` → extends payload with `occasionCatalog` plus per-slot `occasionKey`/`occasionLabel`, filtering by availability rules for the requested date.
- New shared TypeScript type `OccasionDefinition` exported from `@shared/occasions` (or similar) for both server and client consumption.

## UI/UX States

- **Loading**: Ops service-period editor shows skeleton while periods and catalogue load; customer wizard unchanged but ensures new options appear once schedule resolves.
- **Empty**: If catalogue is empty or fetch fails, ops select displays helper text and disables selection; wizard shows disabled toggles with explanatory copy.
- **Error**: Existing toast/alert patterns reused; ensure catalogue fetch errors surface actionable messages in ops UI.
- **Success**: Occasions sorted by `display_order`, labels/descriptions sourced from catalogue, toggles disabled when rules block availability for the chosen date.

## Edge Cases

- Restaurants with service periods configured for an occasion but catalogue rules exclude the requested date (e.g., Christmas outside December) — ensure schedule suppresses that option rather than exposing an unusable toggle.
- Timezone-sensitive date calculations (month boundaries, specific dates) must use restaurant timezone to avoid off-by-one errors.
- Backward compatibility: existing bookings referencing historical keys (lunch/dinner/drinks) should continue to resolve even if catalogue temporarily missing (fallback definitions).
- Ops catalogue updates should invalidate relevant caches (React Query + server cache) so UI reflects new options immediately.

## Testing Strategy

- **Unit**: add tests for availability helper (covering each rule type); extend `server/restaurants/schedule` tests to assert December-only and specific-date logic; adjust reservation reducer/schema tests to accept dynamic keys.
- **Integration**: update `/api/owner/restaurants/[id]/service-periods/route.test.ts` to mock catalogue entries; add new tests for `/api/ops/occasions` and schedule filtering.
- **E2E/manual**: plan a Chrome DevTools QA scenario picking dates in/ out of December to verify Christmas Party toggling; document in `verification.md` if automated coverage deferred.
- **Accessibility**: confirm `ToggleGroupItem` remains focusable/announces disabled state with dynamic labels (axe check via existing test harness).

## Rollout

- Feature flag: none (baseline change).
- Exposure: full rollout once the remote catalogue is seeded; coordinate with ops to populate new occasions before deploying UI changes.
- Monitoring: watch booking funnel analytics for changes around occasion selection; add server logs when catalogue rules suppress a period to detect misconfiguration.
