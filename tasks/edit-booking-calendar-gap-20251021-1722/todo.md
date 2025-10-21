# Implementation Checklist

## Setup

- [x] Capture current behaviour in dashboard edit dialog and `/reserve`
- [x] Document restaurant duration configuration lookup

## Core

- [x] Normalize day-level comparisons in `TimestampPicker` and `Calendar24Field`
- [x] Remove editable end-time field from `EditBookingDialog`
- [x] Derive end timestamp using configured duration (client + API guard)

## UI/UX

- [x] Surface read-only end-time summary in edit dialog
- [ ] Validate `/reserve` calendar shows continuous dates on min boundary

## Tests

- [x] Update/extend unit tests for `EditBookingDialog`
- [x] Add regression coverage for calendar disable logic

## Notes

- Assumptions:
- Deviations:

## Batched Questions (if any)

- ...
