# Implementation Checklist

## Setup

- [x] Audit current `ServicePeriodsSection` UX/data flow.
- [x] Identify required occasion keys from catalog.

## Core

- [x] Create helper to map API payload -> day-based structure with lunch/dinner/drinks fields.
- [x] Update `ServicePeriodsSection` UI to table layout referencing operating hours + new helper state.
- [x] Implement validation enforcing lunch/dinner within operating hours.
- [x] Ensure drinks automatically mirror open→close times and are read-only.
- [x] Provide optional advanced editor or messaging for extra occasions (if needed).
- [x] Convert edited structure back to API payload (preserving IDs).

## Tests

- [x] Add unit tests for mapping helpers.
- [ ] Update/extend component tests if practical; at minimum, cover helper logic to ensure time bounds.

## Notes

- Assumptions:
  - Focused on lunch/dinner/drinks; other occasions rare and handled via advanced view.
- Deviations:
  - TBD

## Batched Questions (if any)

- None yet.
