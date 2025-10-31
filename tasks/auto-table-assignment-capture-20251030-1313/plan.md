# Implementation Plan: Auto Table Assignment Capture

## Objective

Provide an opt-in mechanism to capture the detailed decision trail produced during automatic table assignment so that ops and product teams can evaluate allocator logic without scraping logs.

## Success Criteria

- [ ] Ops API accepts an optional `captureDecisions` flag and returns per-booking decision snapshots when requested.
- [ ] Captured payloads reuse existing sanitized telemetry (no new PII exposure) and do not change default response structure.
- [ ] Unit tests cover capture-enabled behaviour (assigned and skipped bookings) and legacy flow remains green.

## Architecture & Components

- `server/capacity/telemetry.ts`: expose a helper that produces the sanitized telemetry payload (`SelectorDecisionCapture`) for reuse.
- `server/capacity/tables.ts`: augment `autoAssignTablesForDate` (and wrapper) to accept `captureDecisions` + collect snapshots before emitting telemetry.
- `src/app/api/ops/dashboard/assign-tables/route.ts`: extend request schema to honour the capture flag and surface the additional data.
- `src/services/ops/bookings.ts` (+ hooks types): plumb the optional flag through the client service and response typing.
- Tests (`tests/server/capacity/autoAssignTables.test.ts`): add assertions for the capture result.

## Data Flow & API Contracts

Endpoint: `POST /api/ops/dashboard/assign-tables`
Request:

```json
{
  "restaurantId": "uuid",
  "date": "YYYY-MM-DD" | null,
  "captureDecisions": true?    // optional
}
```

Response (when capture disabled): unchanged (`assigned`, `skipped`, `serviceFallbacks`).
Response (when capture enabled): adds `decisions: SelectorDecisionCapture[]` with sanitized telemetry objects (timestamp, bookingId, selected candidate, skipReason, timing, diagnostics).

Errors: unchanged (auth, validation, 500).

## UI/UX States

- Ops dashboard button continues to show toast summary; no UI change required unless we later expose capture controls.
- Capture consumers (dev tools/manual curl) receive structured JSON for analysis.

## Edge Cases

- Capture mode should still return empty array when no bookings evaluated.
- Ensure failures continue to emit telemetry even if capture is requested (capture should not swallow exceptions).
- If observability insert fails, capture should still return the local payload (avoid coupling to DB write).

## Testing Strategy

- Unit: extend `tests/server/capacity/autoAssignTables.test.ts` to exercise capture flag and inspect sanitized payload structure.
- Integration: rely on existing API tests; manual QA via curl (document in verification).
- E2E/A11y: not applicable (no UI changes).

## Rollout

- Feature flag: none; behaviour gated by request flag.
- Exposure: release immediately; consumers have to opt in.
- Monitoring: existing observability events continue; add note to watch API latency.
- Kill-switch: revert flag path or ignore `captureDecisions` at API layer if needed.
