# Implementation Plan: Manual Assignment Context Bug

## Objective

We will enable staff manual assignment context to load correctly so that operators can resolve bookings without backend errors.

## Success Criteria

- [ ] Manual context API returns 200 with expected payload when booking has matching service window and holds data.
- [ ] Capacity manual assignment UI loads without console errors.

## Architecture & Components

- `server/capacity/tables.ts`:
  - add PostgREST error classifier similar to `isMissingCapacityRpcError`.
  - wrap holds query in helper that respects `isHoldsEnabled()` and falls back when the table is absent.
- `src/app/api/staff/manual/context/route.ts` should continue delegating to the server module; no direct changes unless wiring adjustments needed.
  State: module-scope supabase clients | Routing/URL state: n/a

## Data Flow & API Contracts

Endpoint: GET /api/staff/manual/context?bookingId=<id>
Request: { bookingId }
Response: { bookingWindow, holds, tables, metadata }
Errors: { code, message }

## UI/UX States

- Loading: existing skeleton
- Empty: display when booking not found
- Error: toast/dialog from API failure
- Success: context drawer shows assignment data

## Edge Cases

- Booking without matching service window (already handled via warning).
- Holds feature disabled via env flag.
- Missing Supabase schema cache for `table_holds` (treat as “holds unavailable” without 500).
- Genuine PostgREST errors (should still bubble to maintain observability).

## Testing Strategy

- Unit: extend `tests/server/capacity/manualAssignmentContext.test.ts` with scenarios for missing holds table + feature flag disabled.
- Integration: rely on existing context tests; ensure new helper has coverage.
- E2E: manual via DevTools on manual assignment flow once backend responds 200.
- Accessibility: confirm no new regressions (reuse existing patterns).

## Rollout

- Feature flag: n/a
- Exposure: full once verified locally.
- Monitoring: API logs, manual QA checklist.
