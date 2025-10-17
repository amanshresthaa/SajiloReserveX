# Implementation Checklist

## Setup

- [x] Review current BookingStatusBadge implementation
- [x] Identify trigger for repeated updates (REGISTER reducer churn)

## Core

- [x] Update `applyRegister` to return previous state when snapshots introduce no changes
- [x] Confirm optimistic metadata remains intact after reducer change

## UI/UX

- [ ] Validate badge variants remain correct (no visual regression)
- [ ] Confirm dashboard renders without loops

## Tests

- [x] Update or add unit coverage if logic changes
- [x] Run regression tests relevant to booking dashboard

## Notes

- Assumptions:
- Deviations:

## Batched Questions (if any)

- ...
