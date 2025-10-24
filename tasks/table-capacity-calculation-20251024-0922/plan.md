# Implementation Plan: Ops Table Capacity Calculation

## Objective

We will expose per-service (lunch & dinner) capacity totals on the ops tables page by combining table seat counts, configured service windows, and the restaurant’s turnaround assumptions so that operations staff can reason about throughput for each period.

## Success Criteria

- [ ] Alignment on a concrete capacity formula (documented in code comments + task notes).
- [ ] `/api/ops/tables` returns `summary` augmented with lunch/dinner capacity metrics for the active restaurant.
- [ ] Ops Tables UI displays the new per-period metrics alongside existing summary cards.
- [ ] Server-side unit coverage validates the capacity math against representative scenarios (varying periods, buffers, table mixes).

## Architecture & Components

- `server/ops/tables.computeSummary`: extend to load service policy/period data and compute per-period capacities; return structured summary (e.g., `summary.serviceCapacities`).
- `src/services/ops/tables` DTO mapping: include new summary fields for the client.
- `TableInventoryClient`: render extra summary cards; ensure mobile layout remains responsive.
- (Optional helper) shared utility for converting `HH:MM` to minutes and performing `availableTurns` math; place under `server/capacity` or `server/ops` for reuse.
  State: no new client state; data fetched via existing React Query hook.

## Data Flow & API Contracts

- Endpoint: `GET /api/ops/tables?restaurantId=...`
  - Request unchanged.
  - Response `summary` gains shape:
    ```ts
    summary: {
      totalTables: number;
      totalCapacity: number;
      availableTables: number;
      zones: { id: string; name: string }[];
      services?: Array<{
        key: 'lunch' | 'dinner';
        label: string;
        capacity: number;
        tablesConsidered: number;
        seatsPerTurn: number;
        turnsPerTable: number;
        assumptions: { windowMinutes: number; turnMinutes: number; bufferMinutes: number };
      }>;
    }
    ```
  - Error responses unchanged.
- Data sources needed:
  - `restaurant_service_periods` filtered for `booking_option` in (`lunch`, `dinner`) — prefer all-days entries or aggregate multiple days conservatively.
  - Fallback to `service_policy` times if periods missing.
  - Restaurant profile for `reservation_default_duration_minutes` (turnaround proxy) and possibly `reservation_interval_minutes`.
  - `service_policy.clean_buffer_minutes` (between turns).

## UI/UX States

- Loading/empty/error fall back to existing skeletons & alerts.
- Success: show additional summary cards (or stacked list) with labels like “Lunch capacity” / “Dinner capacity” referencing seat counts per service; include tooltip or caption clarifying assumptions if space allows.
- Ensure responsive grid handles 4+ cards without layout breakage (maybe 2x2 on desktop, stacked on mobile).

## Edge Cases

- Missing service periods + missing policy → omit per-period metrics and flag via log to avoid misleading zeroes.
- Period window shorter than turn duration → capacity should gracefully return 0 (avoid divide-by-zero).
- Tables with zero/negative capacity should be ignored (defensive programming).
- Consider restaurants with multiple lunch windows (different days); initial strategy: use average or longest window unless product says otherwise.

## Testing Strategy

- Unit: add tests for the capacity helper covering normal, short window, missing data, and multiple tables.
- Integration: exercise `/api/ops/tables` handler via existing test harness if present; otherwise, targeted unit tests around summary builder.
- Manual: verify UI via DevTools MCP once implemented (per handbook).
- Accessibility: ensure new summary labels accessible to SR users.

## Rollout

- No feature flag unless requested; include note in PR description referencing task folder.
- Post-merge monitor for API regressions via logs/alerts (if available).
