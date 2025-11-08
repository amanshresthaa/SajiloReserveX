# Research: Time-based Table Availability & Reservation Management

## Requirements

- **Functional**
  - Surface every table’s status on a time axis so ops teams can view lunch vs dinner workloads, identify gaps, and manage bookings without switching contexts.
  - Track booking lifecycle events (pending/pending allocation/confirmed/checked in/completed/cancelled) and table assignments in near real-time so the timeline stays accurate as hosts update reservations.
  - Provide actionable booking details per block (guest name, party size, status, zone) with the ability to jump into existing booking management dialogs for edit/cancel/check-in flows.
  - Support filtering by service (lunch/dinner), zone, and search in order to focus on specific rooms or dayparts.
  - Keep lunch/dinner service capacity summaries aligned with existing `TableInventorySummary.serviceCapacities` data (`server/ops/tables.ts:27-200`).
- **Non-functional / cross-cutting**
  - Follow ops dashboard patterns (`src/components/features/dashboard/OpsDashboardClient.tsx`) for responsive layout, theming, and keyboard support.
  - Accessibility: timeline must be keyboard navigable, expose ARIA labels for table/booking summaries, and respect prefers-reduced-motion.
  - Real-time expectations mirror `useBookingRealtime` (`src/hooks/ops/useBookingRealtime.ts`): degrade to polling when realtime flag disabled.
  - Performance: rendering should handle ~75 tables × 50 slots without noticeable jank (<16ms per frame) and limit payloads via slot aggregation.

## Existing Patterns & Reuse

- **Data sources**
  - `getRestaurantSchedule` already computes per-day slots, window boundaries, and booking options (lunch/dinner) (`server/restaurants/schedule.ts`). We can reuse this rather than reinventing scheduling math.
  - Table summaries & service capacity math live in `server/ops/tables.ts`, including service windows and the `listTablesWithSummary` helper we can extend to add timeline payloads.
  - Manual assignment context builds busy windows from bookings + holds via `buildBusyMaps` (`server/capacity/table-assignment/manual.ts:370-456`). We can reuse the same Supabase queries/utilities to avoid duplicating availability logic.
- **Frontend shell**
  - Ops dashboard already wraps content in `BookingOfflineBanner`, `useOpsSession`, and `BookingOfflineQueueProvider`. New UI should mount either as a new `/ops/capacity` route or as a dashboard module to stay consistent.
  - React Query patterns for ops live under `src/hooks/ops` (e.g., `useOpsBookingsList`, `useOpsTableAssignmentActions`). We should expose a `useOpsTableTimeline` hook with cache key `queryKeys.opsTables.timeline` (to be added) and reuse the contexts (`OpsServicesProvider`) for dependency injection.
  - Visual primitives: timeline track can reuse shadcn components (Badge, ScrollArea, Separator) and virtualization helpers used elsewhere (BookingsList uses simple map—should be fine given scale).

## External Resources

- [@reserve/shared/time](https://www.npmjs.com/package/@reserve/shared) (already in repo) provides `normalizeTime`/`slotsForRange` used by schedule calculations and will keep timeline slot math consistent.
- [Luxon](https://moment.github.io/luxon/#/) is already used server-side (`server/capacity/table-assignment/supabase.ts`) for timezone-safe math; we can reuse it to convert schedule slots into ISO strings for the API.

## Constraints & Risks

- **Realtime fan-out**: Subscribing each table row to Supabase channels would be expensive; better to reuse the existing bookings realtime channel (allocations + booking_table_assignments) and simply refetch timeline data when notifications arrive. Need to ensure debouncing to avoid thrash.
- **Payload size**: Sending every 15-min slot for dozens of tables can blow past 1–2 MB responses. We should compress slots into `segments` (only when state changes) and derive fine-grained rendering on the client.
- **Timezones**: Restaurants run across timezones; mis-handling `schedule.timezone` would misalign lunch/dinner boundaries. We must always serialize ISO timestamps with timezone offsets (Luxon `toISO()`), not UTC-only strings.
- **Authoritative source of truth**: Booking availability currently relies on manual assignment busy maps. Duplicating that logic risks drift; leverage `buildBusyMaps` + `loadContextBookings` (ensuring we include customer metadata) to stay in sync.
- **Feature flagging**: Realtime channel usage depends on `NEXT_PUBLIC_FEATURE_REALTIME_FLOORPLAN`; timeline should obey the same flag to avoid double subscriptions.

## Open Questions (owner, due)

- **Do we need write actions from the timeline?** (Product) Should users be able to drag/drop or quick-unassign tables directly from the timeline, or is it a read-only surface that links into existing dialogs?
- **Scope of historical services?** (Product) Requirement mentions lunch & dinner; do we also need brunch, late night, or custom booking options from `restaurant_service_periods`? Need confirmation before hard-coding service filters.
- **Mobile experience expectations?** (Design) Timeline could overflow small screens; confirm whether we target horizontal scroll, condensed cards, or hide the module on <768px.

## Recommended Direction (with rationale)

1. **Backend aggregation layer**
   - Add `getTableAvailabilityTimeline` under `server/ops/tables` that composes:
     1. `getRestaurantSchedule` for slot/window metadata & service labels.
     2. `loadTablesWithSummary` for table rows/zones.
     3. `loadContextBookings` + `buildBusyMaps` (w/ holds) to capture busy windows; extend query to also select `customer_name`, `party_size`, `status` so timeline entries have labels.
     4. Serialize each table into `segments` array (state, start, end, booking/hold meta) plus summary metrics (next change, occupancy %) to keep payload compact.
   - Expose it via `GET /api/ops/tables/timeline?restaurantId=...&date=...` alongside filters for `zoneId`, `service`, and optionally `status`.
2. **Client data hook + context wiring**
   - Extend `TableInventoryService` to include `timeline(restaurantId, params)` so ops UI can consistently obtain timeline + summary in React Query.
   - Create `useOpsTableTimeline` hook that:
     - Derives params from `useOpsSession` (restaurant, selected date/service/zone).
     - Polls every 10s and, when realtime flag is on, subscribes to the same channels as `useBookingRealtime` to trigger `queryClient.invalidateQueries` on relevant events.
     - Returns derived helpers (e.g., grouping by zone/service) for UI consumption.
3. **Timeline UI**
   - Add a new page at `/ops/capacity` (since folder already exists) with authenticated server component similar to `tables/page.tsx`.
   - Build a `TableAvailabilityTimeline` component under `src/components/features/tables/timeline/` that renders:
     - Header with filters (service chips, zone select, search) reusing `StatusFilterGroup`/`Select` components.
     - Sticky summary cards for lunch & dinner capacity vs booked covers (reuse `TableInventorySummary.serviceCapacities`).
     - Scrollable timeline grid: left column lists tables grouped by zone; right area draws horizontal segments using CSS grid/flex (each `segment.state` maps to color). Provide accessible labels & tooltips referencing booking details.
     - Integrate action buttons (View booking / Assign table) that open existing dialogs to avoid duplicating logic.
   - Ensure responsive behavior (horizontal scroll on small screens, virtualization or sticky headers on desktop) and document manual QA steps for `verification.md`.
