# Research: Ops Table Capacity Calculation

## Existing Patterns & Reuse

- `src/components/features/tables/TableInventoryClient.tsx` renders the ops tables summary cards and already expects a `summary` object from the `/api/ops/tables` endpoint. Currently it only shows a single `totalCapacity` value (sum of seat counts) with no notion of per-service periods.
- `/api/ops/tables` delegates to `server/ops/tables.ts` where `computeSummary` simply sums table capacities and does not consider service windows or turn times. Extending this helper is the natural place to enrich summary data.
- Restaurant configuration surfaces a default reservation duration (`reservation_default_duration_minutes`) and interval in `restaurants` table, exposed via `OpsRestaurantService` (`src/services/ops/restaurants.ts`). This default duration is the closest existing concept to a global turnaround time.
- Service windows (lunch, dinner, etc.) are stored per restaurant in `restaurant_service_periods` via `server/restaurants/servicePeriods.ts`, with REST access at `/api/owner/restaurants/[id]/service-periods`. These periods include start/end times and booking option keys (e.g., `lunch`, `dinner`).
- A global `service_policy` table (exposed by `/api/config/service-policy`) holds lunch/dinner start & end plus `clean_buffer_minutes` (post-service cleaning buffer). This could complement service periods if a restaurant has not customized periods.
- The capacity engine (`server/capacity/*`) references service definitions and `turnBands`, but current implementation stubs `maxCovers` as `null`, so there is no ready-made per-period capacity calculator to reuse directly.

## External Resources

- Internal doc `server/capacity/README.md` describes capacity concepts (service periods, max covers, turnaround via turn bands) and may guide formula design.
- Supabase schema (`supabase/migrations/20251019102432_consolidated_schema.sql`) documents available fields such as `clean_buffer_minutes` and restaurant reservation defaults.

## Constraints & Risks

- Lunch/dinner windows may be customized per day; we need a deterministic way to choose which period definition to use for the summary (e.g., current weekday vs. generic). The ops tables page today is not date-specific, so we may need to aggregate using “all-days” periods or fallback to the policy defaults.
- `reservation_default_duration_minutes` represents a booking length, but actual turnaround might differ per party size (see turn bands). Relying solely on the default duration could under/over-estimate capacity.
- `clean_buffer_minutes` applies between seatings; ignoring it could overstate capacity, but double-counting alongside the default reservation buffer could understate it.
- Service periods may not exist (new restaurant) or could omit lunch/dinner completely; we need safe fallbacks.
- Any heavy computation must stay performant because `/api/ops/tables` is called frequently in the UI and should remain fast (<~100ms).

## Open Questions (and answers if resolved)

- Q: Should period capacity respect restaurant-specific service periods or the global service policy when custom periods are absent?
  A: TBD — need product direction.
- Q: Which field should represent turnaround time: `reservation_default_duration_minutes`, per-size turn bands, or another config?
  A: TBD — awaiting clarification from stakeholders.
- Q: Do we subtract `clean_buffer_minutes` once per seating or treat it as part of the turnaround?
  A: TBD.
- Q: Are we targeting “seatings per table” (i.e., how many parties can cycle) or “covers per service” (total seats served)? The requested “capacity count” wording suggests covers, but confirmation needed.

## Recommended Direction (with rationale)

- Extend the summary builder on the server to compute per-service capacity so the existing client can render additional cards with minimal refactor.
- Derive service windows by loading restaurant service periods (filtering for booking options `lunch`/`dinner`) and falling back to the global policy if none are defined, ensuring consistent data.
- Start with a straightforward formula: `floor(availableMinutes / (turnDuration + buffer)) * table.capacity`, where availableMinutes is the service window length. This leverages the established turnaround concept without prematurely modeling complex turn bands. Adjustments can follow once product clarifies the open questions.
