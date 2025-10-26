# Implementation Checklist

## Setup

- [x] Create task docs and confirm picker bug scope isolated to `ScheduleAwareTimestampPicker`.

## Core

- [x] Add slug/date guard around schedule reset effect to prevent unnecessary cache flush on time selection.
- [x] Ensure guard still allows resets when slug or base date changes.
- [x] Verify `availableSlots`/`visibleSlots` remain populated after selecting a new time. *(Covered by new unit test)*

## UI/UX

- [ ] Chrome DevTools MCP: confirm time grid persists after selecting multiple times (requires auth).
- [ ] Validate closed-date messaging still appears when schedule genuinely empty.

## Tests

- [x] Run `npm run typecheck` and relevant tests (e.g., picker unit tests) after changes.

## Notes

- Assumptions:
- Selected slot remains in `visibleSlots`; guard suffices to keep data cached.
- Deviations: Manual QA blocked until edit modal accessible with credentials.

## Batched Questions (if any)

- TBD
