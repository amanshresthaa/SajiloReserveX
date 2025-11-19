---
task: ops-capacity-rework
timestamp_utc: 2025-11-17T23:49:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Ops Capacity Rework

## Objective

Improve the `/ops/capacity` experience so ops users see accurate service-level capacity with clear reservation/hold context, faster loads, and accessible interactions.

## Success Criteria

- [ ] Timeline reflects correct service windows per restaurant schedule/occasion catalog (no fallback).
- [ ] Reservations and holds are visible and distinguishable with accessible labels.
- [ ] Filters/actions deliver correct data (service/date/zone/search and new filters TBD).
- [ ] Page loads/refreshes faster than current baseline; no major regressions in Core Web Vitals.

## Architecture & Components

- `server/ops/table-timeline`: ensure accurate slots, busy windows, holds/reservations labeling; cache invalidation.
- `server/occasions/catalog`: permission hardening and error handling.
- `useOpsTableTimeline` + `TableTimelineClient`: UI/UX, filters, a11y, performance optimizations.

## Data Flow & API Contracts

- Endpoint: GET `/api/ops/tables/timeline?restaurantId&date&zoneId&service`
  - Response: `TableTimelineResponse` (slots, services, summary, tables with segments).
  - Errors: 400 invalid query, 401 unauthenticated, 403 forbidden, 500 timeline build failure.

## UI/UX States

- Loading, empty/closed venue, error, populated timeline, no-restaurant-selected.
- Clear differentiation of reserved vs hold vs out-of-service; focusable/filterable controls with keyboard support.

## Edge Cases

- Venue closed or no service periods for selected date.
- Permission failure on `booking_occasions` (should surface actionable message or fallback indicator).
- Realtime disabled → polling; offline/slow network; large table counts.

## Testing Strategy

- Unit: timeline builders, schedule/occasion handling, hook behavior.
- Integration/API: `/api/ops/tables/timeline` happy/error paths.
- UI: component tests for filters/state rendering, accessibility checks.
- Manual QA via Chrome DevTools MCP (mobile/tablet/desktop, keyboard navigation, perf).

## Rollout

- Feature flag (proposed): `feat.ops.capacity_v2` (default off) — confirm need.
- Can ship behind flag, then ramp; add kill-switch to revert to current behavior.

## DB Change Plan (if applicable)

- None planned; permissions change for `booking_occasions` may be required (grant SELECT to service role).
