# Research: Capacity Admin Dashboard

## Existing Patterns & Reuse

- `src/components/features/capacity/CapacityConfigClient.tsx` already provides period-level capacity editing (max covers/parties, notes) and a utilization heatmap. Needs enhancements for per-day overrides, holiday scheduling, and richer admin controls rather than starting from scratch.
- `src/app/api/ops/capacity-rules/route.ts` supports upserting `restaurant_capacity_rules` with `effective_date` and `day_of_week` scopes; per-day/holiday rules can reuse this endpoint by surfacing the additional fields in the UI.
- `restaurant_capacity_rules` schema (see `supabase/migrations/20251006170446_remote_schema.sql`) includes `effective_date`, `day_of_week`, and `service_period_id`—ideal for per-day overrides and special events.
- `server/ops/capacity.ts` + `server/capacity/service.ts` expose `calculateCapacityUtilization` and `checkSlotAvailability`; the dashboard can call these for real-time slot utilization (e.g., show “18/20 slots filled for 7 PM”).
- `UtilizationHeatmap` component (`src/components/features/capacity/UtilizationHeatmap.tsx`) already renders a slot-level grid driven by `/api/availability`; can extend to display absolute counts (booked vs max) and highlight overrides.
- Table inventory management exists via `TableInventoryClient` and `table_inventory` table (position JSON). Floor plan visualization can leverage the `position` field to plot tables.
- Observability uses `recordObservabilityEvent` (`server/observability.ts`) and transaction service logs; same patterns can capture override actions or exports.

## External Resources

- WCAG requirements remain (AGENTS.md §6). Ensure any new visualizations (heatmap, floor plan) include accessible labels.
- Supabase RLS policies already allow authenticated staff to manage capacity rules; no extra auth integration needed beyond existing membership checks.

## Constraints & Risks

- No existing floor plan UI: need to design render logic from `table_inventory.position`. Ensure mobile support and non-blocking performance.
- Overrides require careful conflict handling (specific date vs recurring). Must present precedence rules clearly to admins.
- Exporting overbooking reports will demand historical data—confirm analytics availability (likely `calculateCapacityUtilization` plus bookings table). Need to avoid heavy synchronous queries in route handlers; may require streaming or async background job.
- Real-time utilization relies on repeated `/api/availability` calls; avoid excessive network usage by batching via existing `/api/ops/dashboard/capacity` where possible.

## Open Questions (and answers if resolved)

- Q: Where should exports download from?  
  A: Likely a new `/api/ops/capacity/overbooking-export` endpoint returning CSV, scoped to authenticated admin.
- Q: Do we already store per-slot counts?  
  A: Not precomputed; must aggregate bookings on the fly using existing capacity service or `booking_slots` materialized table once implemented.
- Q: How to visualize override precedence?  
  A: UI should list active rules sorted by specificity (effective date > day of week > default) and highlight when an override is in effect for the selected date.

## Recommended Direction (with rationale)

- Extend current capacity UI: add calendar/day picker, allow creating effective-date rules via modal using existing API, and surface summary chips indicating overrides.
- Build a slot utilization panel combining `calculateCapacityUtilization` (period totals) with enhanced `UtilizationHeatmap` showing counts (`bookedCovers/maxCovers`).
- Introduce a floor plan view using `table_inventory` data plotted onto an SVG/grid (position stored in JSON). Include zoom/pan for desktop, stacked list fallback for mobile.
- Implement capacity override actions: duplicate existing rule form but allow specifying date range / special events; store via `effective_date` and optional metadata column (may need migration).
- Provide CSV export route generating overbooking history by querying bookings where utilization > 100% or `isOverbooked` flag from `calculateCapacityUtilization`; gate behind admin role and async streaming.
