# Implementation Plan: Booking Dialog Table Availability

## Objective

We will enable staff to only see/select available tables for the booking period, reducing errors.

## Success Criteria

- [ ] Unavailable tables are hidden by default.
- [ ] Toggle allows showing all tables on demand.
- [ ] Accessibility preserved.

## Architecture & Components

- Update TableFloorPlan to accept `onlyAvailable` and filter items accordingly.
- Update BookingDetailsDialog Tables tab UI to include toggle and pass prop.

## Data Flow & API Contracts

Endpoint: N/A (client-side only)
Request: ManualAssignmentContext already loaded
Response: N/A
Errors: N/A

## UI/UX States

- Default: only available visible (plus assigned/owned).
- Toggle off: show all with blocked/amber styling.

## Edge Cases

- Assigned/owned tables always visible.

## Testing Strategy

- Manual QA on Ops dialog: verify hidden vs shown.

## Rollout

- Feature implicit; no flags.
