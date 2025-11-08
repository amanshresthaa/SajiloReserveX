# Implementation Checklist

## Setup

- [x] Identify all labels/headings on `/ops/restaurant-settings` needing clarifying help text.
- [x] Draft tooltip copy per field/section and review for accuracy/length.

## Core

- [x] Update `RestaurantDetailsForm` to render tooltips for slug, timezone, reservation interval/duration/buffer, and booking policy labels.
- [x] Introduce helper component/pattern to keep tooltip markup consistent and accessible.
- [x] Add tooltips to `OperatingHoursSection` weekly schedule + overrides headings/fields.
- [x] Add tooltips to `ServicePeriodsSection` (section header + meal editors) explaining relationship to kitchen/drinks hours.

## UI/UX

- [x] Verify tooltip triggers remain keyboard-focusable, even for disabled statuses.
- [x] Confirm layout spacing is consistent after inserting icons.

## Tests

- [x] Run relevant lint/tests if impacted files trigger type errors (e.g., `pnpm lint:types` / targeted tests if needed). _(pnpm lint)_
- [ ] Manual QA via Chrome DevTools MCP on `/ops/restaurant-settings` with desktop + mobile widths. _(Blocked: signin requires credentials we don't have.)_

## Notes

- Assumptions: Tooltip coverage limited to ambiguous controls; rest already self-explanatory with inline helper copy.
- Deviations: None yet.

## Batched Questions (if any)

- None.
