# Research: Sprint 1 Service Window Integrity

## Requirements

- Functional:
  - A1 Guard fallback overrun: ensure `computeBookingWindowWithFallback` raises `ServiceOverrunError` when computed block end exceeds `serviceEnd` for fallback service.
  - A2 Normalize overlap checks: move all overlap logic to a Luxon-powered helper using half-open intervals `[start,end)`, eliminate duplicate numeric helper, and update consumers/tests.
  - B1 Hold-booking linkage: when confirming holds, load `booking_id`; if it mismatches incoming booking, emit telemetry conflict and throw `AssignTablesRpcError(HOLD_BOOKING_MISMATCH)`.
  - B2 Telemetry zone normalization: `emitHoldConfirmed` should use hold zone only; if absent, send empty string plus `metadata.unknownZone`.
  - C1 Timezone consistency: `findSuitableTables` must resolve restaurant timezone like other selectors before calling `getVenuePolicy`.
  - D1 Conservative availability: `isTableAvailableV2` should throw (preferred) on Supabase errors instead of returning true.
  - Testing: add/extend Vitest coverage for each change, including property-based test for overlap semantics and failure paths (A1–D1). Run auto-assign E2Es per acceptance (likely out of scope locally but note).
- Non-functional (a11y, perf, security, privacy, i18n):
  - Time-handling correctness across timezones/dst.
  - Telemetry accuracy (no leaking table IDs into zone metrics).
  - Error surfacing/observability (new errors may raise alert volume).
  - Test reliability (property tests must be deterministic and performant).

## Existing Patterns & Reuse

- `computeBookingWindow` already guards service overruns; fallback variant replicates logic minus guard.
- `windowsOverlap` (numeric) and `windowsOverlapMs` (ISO strings) share half-open logic; both consumers expect `[start,end)`. Tests in `tests/server/capacity/computeBookingWindow.test.ts` and `tests/unit/table-window-overlap.test.ts` cover current behaviour.
- `confirmHoldAssignment` and `assignTableToBooking` share timezone resolution: booking row → restaurant timezone (via booking relation or `loadRestaurantTimezone`) → `getVenuePolicy({ timezone })`.
- Telemetry helpers (`emitRpcConflict`, `emitHoldConfirmed`) centralize event emission.
- Error types `AssignTablesRpcError`, `ServiceOverrunError`, `ManualSelectionInputError` already defined/used.

## External Resources

- [Luxon `DateTime.fromISO`](https://moment.github.io/luxon/#/parsing?id=datetimefromiso) — ensures timezone-aware parsing with `setZone`.
- [fast-check property testing docs](https://dubzzz.github.io/fast-check.github.com/) — guidance on deterministic property tests.
- [Supabase client error handling](https://supabase.com/docs/reference/javascript/select) — confirm how errors bubble for `.select`.

## Constraints & Risks

- Tightening fallback guard (A1) may surface new runtime errors; need telemetry note and ensure callers can handle `ServiceOverrunError`.
- Centralizing overlap logic risks regressions if numeric consumers expect ms; must update tests and double-check interplay with `filterAvailableTables` and `isTableAvailableV2`.
- Introducing `fast-check` increases devDeps; ensure tsconfig/test config supports ESM import and jest/vitest compatibility.
- Throwing on DB error (D1) changes behaviour; verify upstream handlers either catch or propagate acceptably.
- Telemetry changes (B2) must preserve payload schema; confirm observability pipeline tolerates `metadata.unknownZone`.

## Open Questions (owner, due)

- Q: Do any callers rely on silent success when `isTableAvailableV2` fails to query Supabase?  
  A: Assumed acceptable to throw per task brief; document in plan and ensure tests cover typical caller expectations.
- Q: Should fallback guard log additional context before throwing?  
  A: Not mandated; leverage existing `ServiceOverrunError` which is caught upstream for messaging.

## Recommended Direction (with rationale)

- Mirror the primary window guard logic inside fallback path to maintain consistent invariants; rely on `serviceEnd` to compute boundary and throw existing error.
- Consolidate overlap helper to accept interval inputs convertible to Luxon `DateTime`, parse strings with `setZone: true`, and compare half-open intervals; update all call sites to use this single helper.
- Extend hold query to include `booking_id`; before orchestrator commit, bail out with telemetry + RPC error if mismatch to prevent cross-booking assignments.
- When emitting hold confirmation telemetry, respect provided zone, and flag missing zone via metadata instead of substituting table IDs.
- In `findSuitableTables`, fetch timezone identical to `confirmHoldAssignment`/`assignTableToBooking` to guarantee consistent policy selection across flows.
- Update `isTableAvailableV2` to throw `AssignTablesRpcError` (or domain-specific error) on DB issues, enabling callers to react or fallback safely.
- Augment Vitest suites (server/capacity) with new tests, adding property-based coverage using `fast-check` to validate `[start,end)` semantics and ensure deterministic seeding; stub Supabase clients to simulate errors and mismatches.
