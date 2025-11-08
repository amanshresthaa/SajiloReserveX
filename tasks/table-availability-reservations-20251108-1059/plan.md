# Implementation Plan: Time-based Table Availability & Reservation Management

## Objective

Enable ops teams to see every table’s lunch/dinner availability on a live timeline that reflects booking + hold assignments, exposes key booking metadata, and links back into existing booking management flows.

## Success Criteria

- [ ] `GET /api/ops/tables/timeline` returns aggregated segments for a restaurant/date within <500 ms for 60 tables (verified locally against seed data).
- [ ] `/ops/capacity` renders lunch & dinner timelines with zone/service filters and stays in sync with bookings after realtime or 10 s polling updates.
- [ ] Keyboard + screen-reader users can navigate the timeline rows and activate “View booking” actions (axe smoke test + manual tabbing).

## Architecture & Components

- **Server (`server/ops/tables/timeline.ts`)**
  - `getTableAvailabilityTimeline({ restaurantId, date, zoneId?, service? })`
    - Loads restaurant schedule & timezone via `getRestaurantSchedule`.
    - Loads table inventory + zones using `listTablesWithSummary` (reuse summary for KPI cards).
    - Queries bookings + holds for the day (extend `loadContextBookings` or add dedicated query) and builds busy windows via `buildBusyMaps`.
    - Produces compact `segments` per table: `[ { startISO, endISO, state: 'available' | 'reserved' | 'hold', booking?: {...} } ]`.
    - Computes table-level stats (occupancy %, next change) and service-level totals.
- **API layer**
  - `src/app/api/ops/tables/timeline/route.ts` validates query params, enforces auth/membership, and returns `{ date, timezone, window, services, summary, tables: TableTimelineRow[] }`.
- **Client data**
  - Extend `TableInventoryService` with `timeline(restaurantId, params)` + matching types.
  - New hook `useOpsTableTimeline(params)` inside `src/hooks/ops` using React Query + realtime invalidation similar to `useBookingRealtime`.
- **UI**
  - New page `src/app/(ops)/ops/(app)/capacity/page.tsx` (auth guard mirror of tables page) rendering `TableTimelineClient`.
  - Components under `src/components/features/tables/timeline/`:
    - `TableTimelineFilters` (service chips, zone select, search, date picker reusing `HeatmapCalendar`).
    - `ServiceCapacitySummary` card using existing summary data.
    - `TableTimelineGrid` (left table list + scrollable segment tracks). Each segment renders tooltip + actions linking to `BookingDetailsDialog` via existing booking context.
    - Loading/empty/error skeleton states aligned with dashboard patterns.

## Data Flow & API Contracts

Endpoint: `GET /api/ops/tables/timeline`
Request query: `restaurantId (uuid)`, `date (YYYY-MM-DD, optional)`, `zoneId (uuid|all)`, `service (lunch|dinner|all)`.
Response:

```jsonc
{
  "date": "2025-11-08",
  "timezone": "Europe/London",
  "window": { "start": "2025-11-08T10:00:00+00:00", "end": "2025-11-08T23:00:00+00:00" },
  "slots": [{ "start": "ISO", "end": "ISO", "service": "lunch", "label": "12:00" }],
  "services": [{ "key": "lunch", "label": "Lunch", "coverage": { "start": "ISO", "end": "ISO" } }],
  "summary": { ...existing TableInventorySummary, occupancyByService: {...} },
  "tables": [
    {
      "table": { "id", "tableNumber", "capacity", "zoneId", "zoneName", "status", "active" },
      "stats": { "occupancyPct": 0.62, "bookedSegments": 3, "nextStateAt": "ISO" },
      "segments": [
        { "start": "ISO", "end": "ISO", "state": "available" },
        { "start": "ISO", "end": "ISO", "state": "reserved", "booking": { "id", "customerName", "partySize", "status" } },
        { "start": "ISO", "end": "ISO", "state": "hold", "hold": { "id", "bookingId" } }
      ]
    }
  ]
}
```

Client derives CSS widths from slot duration and paints states accordingly.

## UI/UX States

- **Loading**: shimmer skeleton with summary cards + placeholder rows (matches `DashboardSkeleton`).
- **Empty**: if no tables/slots, show illustration with CTA linking to `/ops/tables` to configure inventory.
- **Error**: `Alert` with retry button (reuse `BookingsTable` pattern).
- **Timeline interactions**:
  - Hover: show tooltip with booking info + actions.
  - Focus: keyboard arrow keys move between segments, hitting `Enter` opens `BookingDetailsDialog`.
  - Realtime indicator: small badge showing “Updated hh:mm:ss” similar to `useBookingRealtime` output.

## Edge Cases

- Restaurant closed (no schedule slots): API returns `tables: []` + `isClosed: true`; UI shows “Closed for selected date”.
- Tables without assignments but marked `out_of_service`: segments remain `blocked` for entire window.
- Bookings lacking `start_at` (legacy data): fall back to `start_time` via policy window (same as manual assignment codepath).
- Overlapping holds vs bookings: busy map already merges them; ensure segments prefer booking state over hold to avoid flicker.

## Testing Strategy

- **Unit**: add tests for `getTableAvailabilityTimeline` (mock tables/bookings to ensure segments merge correctly + filters). Use Vitest under `server/ops/__tests__`.
- **Integration**: exercise API route via `supertest`-style Next route test verifying auth, invalid params, and payload shape.
- **Frontend**: add React Testing Library test for `TableTimelineGrid` to ensure segments render colors + accessible labels; snapshot filter bar states.
- **Manual / a11y**: update `verification.md` with Chrome DevTools steps—keyboard navigation across segments, responsive scroll.

## Rollout

- Ship behind implicit route discoverability: page linked from Ops nav (“Capacity”).
- No feature flag required; data read-only. Monitor Supabase logs for new endpoint.
- Post-deploy, verify `/ops/capacity` for staging restaurants; add telemetry event (`table_timeline_viewed`) for product tracking if time permits (optional follow-up).
