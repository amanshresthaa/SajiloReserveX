# Implementation Plan: Capacity Admin Dashboard

## Objective

We will empower restaurant administrators to configure and monitor capacity with fine-grained controls—per-day overrides, live slot utilization, floor plan visualization, and overbooking exports—so they can keep service running smoothly without engineering support.

## Success Criteria

- [ ] Admins can create, edit, and delete capacity rules scoped by date, day, and service period.
- [ ] Live utilization view shows booked vs max slots per period and per time slot (e.g., "18/20 slots filled at 19:00").
- [ ] Overrides for special dates are surfaced in the UI and respected by availability checks.
- [ ] Floor plan view renders current table layout from `table_inventory.position`, supports basic interactions, and is accessible on mobile/desktop.
- [ ] Admins can export a CSV of overbooking incidents for a selected date range.

## Architecture & Components

- `src/app/(ops)/ops/(app)/capacity/page.tsx`: enhance to host full admin console tabs (Rules, Overrides, Live Utilization, Floor Plan, Reports).
- `src/components/features/capacity/CapacityConfigClient.tsx`: evolve into multi-panel client with TanStack Query orchestrating rules, overrides, live feed, and exports.
  - Subcomponents (new):
    - `CapacityRuleEditor` – CRUD per-period rules (reuse existing form, add date scope selector).
    - `CapacityOverridesPanel` – calendar/date list, special event tagging, rule precedence UI.
    - `SlotUtilizationPanel` – combines `calculateCapacityUtilization` + enhanced `UtilizationHeatmap` (display counts + percent, tooltips).
    - `FloorPlanView` – new SVG/grid renderer using `table_inventory` data, expand/collapse on mobile.
    - `OverbookingReportsPanel` – date range picker + CSV export trigger.
- API layer additions:
  - Extend existing `/api/ops/capacity-rules` to accept `effectiveDate` and optional `label` metadata.
  - New `/api/ops/capacity-overrides` route for listing rules ordered by specificity.
  - New `/api/ops/capacity/overbooking-export` (GET) streaming CSV.
  - Floor plan data served via existing `/api/ops/tables` (ensure positions returned) or new view for grouped layout.
- Services:
  - Extend `CapacityService` to include `listOverrides`, `saveOverride`, `deleteOverride` (wrapping same table with metadata).
  - Add `OverbookingReportService` for export HTTP calls.
  - Expand `TableInventoryService` to expose positions and occupancy states for visualization.
- Database:
  - Migration to add `label` (text) and `override_type` (enum) columns to `restaurant_capacity_rules` for naming special events.
  - Migration to ensure `table_inventory.position` has defaults (nullable JSON) if required.

## Data Flow & API Contracts

- **Capacity Rules CRUD**
  - `POST /api/ops/capacity-rules`
    - Request: `{ restaurantId, servicePeriodId?, dayOfWeek?, effectiveDate?, maxCovers?, maxParties?, notes?, label?, overrideType? }`
    - Response: `{ rule, updated }`
  - `DELETE /api/ops/capacity-rules/:id`
    - Response: `{ success: true }`
- **Overrides listing**
  - `GET /api/ops/capacity-overrides?restaurantId=uuid&from=YYYY-MM-DD&to=YYYY-MM-DD`
    - Response: `{ overrides: Array<{ id, effectiveDate, label, scope, rulesSummary }> }`
- **Live utilization**
  - Reuse `GET /api/ops/dashboard/capacity?restaurantId&date` (period aggregates).
  - For slot detail, batch-call `/api/availability` or build new `GET /api/ops/capacity/slots?restaurantId&date&partySize` returning every slot with `bookedCovers/maxCovers`.
- **Floor plan**
  - `GET /api/ops/tables?restaurantId&includePosition=true`
    - Response extended with `position` (default to `{ x:0, y:0, rotation:0 }`).
  - Optional `PATCH /api/ops/tables/:id/position` to persist drag/drop updates (future enhancement, not in scope unless time permits).
- **Reports export**
  - `GET /api/ops/capacity/overbooking-export?restaurantId&from&to` (must validate admin role)
    - Response: CSV stream with headers `date,time,servicePeriod,bookedCovers,maxCovers,overbookedBy,bookingIds`.

## UI/UX States

- **Rules Tab**: Loading skeleton → list of service periods with tags showing current limits and overrides. Empty state prompts admin to configure.
- **Override Modal**: Inputs for date picker (single/day range), optional service period filter, override label, max covers/parties; show precedence warning if conflicts.
- **Live Utilization**: Display summary chips (per period), heatmap with numeric counts, tooltip with booked/available breakdown; fallback empty state when no data.
- **Floor Plan**: Zoomable container with tables as labeled nodes; toggles for sections, color-coded status (available, occupied, OOS). Provide keyboard navigation and fallback list view for reduced-motion users.
- **Reports**: Date range picker (default last 30 days), export button with progress indicator, success toast linking to downloaded CSV.

## Edge Cases

- Overlapping overrides (same date + different scopes) – display precedence and block creation if identical scope already exists.
- Restaurants without service periods – show prompt linking to Restaurant Settings before enabling capacity edits.
- Large number of tables – ensure floor plan handles >100 nodes smoothly (virtualize or cluster).
- Timezones – all dates displayed in restaurant’s timezone (pull from membership info).
- CSV exports for large ranges – stream results, cap range to 90 days and warn otherwise.

## Testing Strategy

- **Unit**: validate new services/utilities (override formatting, export generation, floor plan layout helpers).
- **Integration**: API route tests for overrides CRUD and exports (mock Supabase). Extend Playwright E2E for admin navigating new tabs, editing overrides, viewing heatmap.
- **Accessibility**: axe checks on new UI states; ensure keyboard interactions for tabs, dialogs, floor plan list fallback.
- **Performance**: Confirm heatmap + floor plan render under 200ms at 60fps on mid-tier devices; throttle network via DevTools MCP during verification.

## Rollout

- Feature flag `ENABLE_CAPACITY_ADMIN_DASHBOARD` (server + client) to allow gradual rollout per restaurant.
- Deploy migrations to staging → validate with sample data → enable flag for beta admins → gather feedback → roll out to all.
- Document new capabilities in ops handbook and update training materials.
