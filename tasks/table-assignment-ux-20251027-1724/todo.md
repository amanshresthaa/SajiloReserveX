# Implementation Checklist

## Setup

- [x] Map current manual assignment props/state in `BookingDetailsDialog` to confirm data contract.
- [x] Decide component breakdown & filenames for summary/validation/action panels.

## Core

- [x] Implement summary card component and integrate with manual assignment state.
- [x] Implement validation panel component with severity styling + hints.
- [x] Refactor manual assignment section in `BookingDetailsDialog` to use new components and restructure layout.
- [x] Enhance unpositioned tables list (grouping/labels) and ensure selection toggles remain wired through `TableFloorPlan`.

## UI/UX

- [x] Add hold countdown indicator and expired-hold recovery messaging.
- [x] Review mobile/desktop breakpoints and adjust spacing for accessibility.
- [x] Verify keyboard focus & aria labelling for new components/buttons.

## Tests

- [ ] Add/adjust unit coverage if utility functions introduced.
- [x] Run `pnpm lint` or targeted checks if files touched require it.
- [x] Perform manual QA in Chrome DevTools MCP (mobile/tablet/desktop) with keyboard walkthrough and Axe scan.

## Notes

- Assumptions:
  - Additional unit coverage not added because new components remain presentational and reuse existing helpers; vitest coverage on TableFloorPlan grouping exercised instead.
- Deviations:
  - Manual QA ran against a sandbox page (`/dev/manual-assignment-demo`) because the Ops dashboard requires authenticated access.

## Batched Questions (if any)

-
