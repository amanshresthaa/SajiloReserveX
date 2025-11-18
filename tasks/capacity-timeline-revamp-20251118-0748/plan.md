---
task: capacity-timeline-revamp
timestamp_utc: 2025-11-18T07:48:48Z
owner: github:@amankumarshrestha
reviewers: [github:@reviewer]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Revamp capacity timeline

## Objective

Rebuild the /ops/capacity timeline UI for staff to view/manage table slots with clearer layout, filters, and segment interactions while retaining existing functionality.

## Success Criteria

- [ ] Timeline renders fetched capacity data with correct statuses and current time indicator.
- [ ] Filters (search, date, service, zone, status) work and update results without errors.
- [ ] Segment interactions (click for details/dialog; actions per status) remain functional.
- [ ] Page remains accessible (keyboard focusable controls/segments, descriptive labels) and performant for many tables.

## Architecture & Components

- Page: `src/app/(ops)/ops/(app)/capacity/page.tsx` (server/client mix as existing) – reuse data-fetching logic, update client-side rendering.
- Components to adjust/create:
  - Timeline container with header/filter bar.
  - Table row component showing table meta (zone/capacity).
  - Segment component displaying status states with tooltips/dialog trigger.
  - Dialog for segment details/actions (reuse existing dialog component).
- State: filters/search/service/zone/status selection; selected segment for dialog; current time indicator.

## Data Flow & API Contracts

- Use existing capacity fetching hooks/services already in page; no contract changes.
- Props/state derived from fetched data (tables, segments, statuses) mapped to revamped UI components.
- Actions (e.g., create booking, release hold) remain wired to existing handlers or stubs; do not change backend endpoints.

## UI/UX States

- Loading/empty/error states consistent with ops app patterns.
- Timeline shows background grid, hour markers, and current time line when within window.
- Segments show different styles per status; available slot affordance for creating booking; hover/tooltip info.

## Edge Cases

- No tables returned or filters exclude all → show empty state message.
- Current time outside window → hide current time indicator.
- Overlapping/short segments → ensure minimum width/visibility without overflow.

## Testing Strategy

- Manual UI exercise in browser (DevTools MCP) for filters and segment interactions.
- Quick sanity check via existing test commands if applicable (`pnpm test` targeted?); prioritize manual due to UI change.

## Rollout

- No feature flag indicated; ship as default replacement.
- Monitor for UI regressions; rollback via revert if issues found.
