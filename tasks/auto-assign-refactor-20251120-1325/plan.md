---
task: auto-assign-refactor
timestamp_utc: 2025-11-20T13:25:53Z
owner: github:@amankumarshrestha
reviewers: [github:@amankumarshrestha]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Auto-assign algorithm simplification

## Objective

Streamline the auto-assign algorithm to keep correctness while reducing complexity and improving performance and maintainability.

## Success Criteria

- [ ] Logic paths simplified without changing functional outcomes for supported scenarios.
- [ ] Reduced cyclomatic complexity / branching in core algorithm module.
- [ ] Measurable performance improvement (lower CPU time or fewer DB/IO calls) or at least no regression.
- [ ] Tests covering core behaviors continue to pass; add/adjust tests if gaps are uncovered.

## Architecture & Components

- Keep `autoAssignAndConfirmIfPossible` as public API but break internals into:
  - `loadBookingWithFallback` to fetch booking and handle schema errors.
  - `buildRunContext` to derive max attempts, planner strategy tweaks, skip/hard-stop flags, inline summary context, and planner cache settings from feature flags + inline last result.
  - `maybeHandleWithCoordinator` for assignment pipeline v3 pathway.
  - `runLegacyAttempts` for the legacy planner loop, telemetry, caching, and email sending.
  - `emitSummary` wrapper to centralize observability event emission.
  - `sendConfirmationEmail` helper to handle inline-email skip logic and variants.

## Data Flow & API Contracts

- Inputs: bookingId (string), optional { bypassFeatureFlag, reason, emailVariant }.
- Outputs: void (best-effort). Must retain logging, observability, and idempotent confirmation via `atomicConfirmAndTransition`.
- Side effects: planner quote calls (`quoteTablesForBooking`), optional coordinator (`AssignmentCoordinator.processBooking`), booking status updates, confirmation emails, observability events, planner cache interactions.

## UI/UX States

- N/A (backend service).

## Edge Cases

- Booking already confirmed/cancelled/no_show/completed — short-circuit with optional email send.
- Inline result marked hard failure or timeout — adjust attempts/strategy and cache usage without breaking retries.
- Planner cache hard failures — honor hard-stop without retries.
- Race where booking confirmed during wait — detect and exit gracefully.
- Schema incompatibility for coordinator/pipeline — fall back safely.

## Testing Strategy

- Targeted unit/integration tests around auto-assign job and inline paths.
- Smoke existing test suites that cover booking creation/auto-assign flows.

## Rollout

- Feature flag: reuse existing flags; avoid introducing new ones unless necessary.
- Exposure: full once tests pass.
- Monitoring: rely on existing structured logging/telemetry.
- Kill-switch: fallback to legacy/previous path if available; otherwise revert changes.

## DB Change Plan (if applicable)

- N/A (no schema changes planned).
