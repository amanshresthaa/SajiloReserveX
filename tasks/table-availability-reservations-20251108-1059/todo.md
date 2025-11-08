# Implementation Checklist

## Setup

- [x] Define timeline types & query keys (shared `types/ops`, `lib/query/keys.ts`).
- [x] Update `TableInventoryService` client + contexts to expose `timeline` method.

## Backend

- [x] Implement `getTableAvailabilityTimeline` helper (new `server/ops/table-timeline.ts`).
- [x] Create `GET /api/ops/tables/timeline` route with auth, validation, filters.
- [x] Add unit test for timeline helpers (`tests/server/table-timeline.test.ts`).

## Frontend

- [x] Build `useOpsTableTimeline` hook (React Query + realtime invalidation).
- [x] Add `/ops/capacity` page + `TableTimelineClient` container (filters, summary, timeline rendering).
- [x] Implement timeline components (filters, summary cards, grid, segments, tooltips, realtime badge, basic actions).

## Integration

- [ ] Wire actions from timeline to existing booking dialogs (view/edit/cancel) + table assignment flow.
- [ ] Add analytics/log statements if required (optional).

## Tests & QA

- [ ] Run unit + lint (`pnpm lint && pnpm test --filter timeline` TBD) and document results in `verification.md`.
- [ ] Manual Chrome DevTools pass (keyboard nav, responsive, realtime tick) and record in `verification.md`.

## Notes

- Assumptions: timeline read-only for now; actions route through existing dialogs.
- Deviations: analytics deferred unless time allows.

## Batched Questions (if any)

- None yet.
