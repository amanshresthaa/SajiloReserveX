---
task: fix-reservation-schedule-dehydration
timestamp_utc: 2025-11-20T18:54:00Z
owner: github:@assistant
reviewers: [github:@assistant]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Fix reservation schedule dehydration error

## Objective

We will enable users to load reservation schedules without hydration errors so that the schedule data always resolves or shows a clear error.

## Success Criteria

- [ ] Hydration/dehydration warnings no longer appear in console for reservation schedule queries.
- [ ] Error states display user-friendly messaging when schedule fetch fails.

## Architecture & Components

- Harden query persistence in `lib/query/persist.ts` so persisted caches exclude any non-idle/pending queries and respect `meta.persist === false` both when dehydrating and when restoring.
- Mark reservation schedule queries as non-persisted where they are defined (`useTimeSlots`, plan-step prefetch helpers) to keep transient schedule data out of storage; reuse existing pattern already used in `ScheduleAwareTimestampPicker`.
- Extend persistence unit tests in `tests/server/query/persist.test.ts` to cover the new filtering rules.

## Data Flow & API Contracts

- Endpoint: existing GET `/restaurants/[slug]/schedule` (unchanged).
- Request: `{ date?: string }` via query string.
- Response: `ReservationSchedule` object (unchanged).
- Errors: handled as fetch rejections; persistence should not cache in-flight queries.

## UI/UX States

- Loading / Empty / Error / Success

## Edge Cases

- Persisted caches containing older pending schedule queries should be sanitized on restore.
- Prefetch loops (month/day prefetch) should not reintroduce persisted pending entries.

## Testing Strategy

- Unit: update/extend `tests/server/query/persist.test.ts` for new persistence rules.
- Integration/E2E: not needed for this scope; verify locally that console warning disappears when persisting cache.
- Accessibility: N/A (no UI changes).

## Rollout

- Feature flag: N/A
- Exposure: 10% → 50% → 100%
- Monitoring: console/log monitoring
- Kill-switch: revert change

## DB Change Plan (if applicable)

- N/A
