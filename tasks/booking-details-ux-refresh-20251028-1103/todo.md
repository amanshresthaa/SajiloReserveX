# Implementation Checklist

## Setup

- [x] Import Shadcn `tabs` primitive (add component via MCP if missing).
- [x] Identify BookingDetailsDialog touch points (hotkeys, manual assignment state).

## Core

- [x] Introduce tab state + layout skeleton in `BookingDetailsDialog`.
- [x] Move overview content into default tab with refreshed cards.
- [x] Move manual assignment + assigned tables into “Tables” tab.
- [x] Remove duplicate status sidebar; surface quick actions in overview.

## UI/UX

- [ ] Verify responsive behavior at 375px/768px/1280px.
- [ ] Confirm keyboard shortcuts + tab focus order.

## Tests

- [ ] Unit
- [ ] Integration
- [ ] E2E (critical flows)
- [ ] Axe/Accessibility checks

## Notes

- Assumptions:
  - Manual assignment hooks tolerate conditional rendering.
- Deviations:
  - Manual QA blocked behind sign-in; need credentials to validate booking dialog end-to-end.

## Batched Questions (if any)

- ...
