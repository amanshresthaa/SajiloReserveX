# Implementation Plan: Sprint 4 — Observability, Telemetry & Hardening

## Objective

Provide richer, privacy-safe telemetry for planner execution while documenting guardrails and enforcing lint-time protections.

## Success Criteria

- [ ] Telemetry events from auto-assign/quote include latency metrics and planner configuration parameters.
- [ ] Diagnostics payloads expose all skip reasons with zero-value defaults.
- [ ] Unit tests confirm telemetry payloads omit PII.
- [ ] ADR + docstrings describe planner window/adjacency rules.
- [ ] CI fails if `Date.parse` or alternate overlap helpers are reintroduced.

## Architecture & Components

- `server/capacity/telemetry.ts`: extend planner telemetry functions with timing metrics and configuration fields.
- `server/capacity/selector.ts`: normalize diagnostics skip buckets and counts.
- `server/capacity/auto-assign.ts` & related call sites: wrap loops with timing capture.
- `tests/server/capacity/*`: add coverage for telemetry payloads, skip normalization, PII guard.
- Documentation: new ADR in `docs/adr/` (create folder if absent).
- CI config: extend ESLint or custom lint rule, plus scripts for overlap helper import enforcement.

## Data Flow & API Contracts

- Telemetry events should include keys `{duration_ms, kMax, maxOverage, evaluationLimit, bucketLimit, adjacencyRequired, combinationLimit}` within existing telemetry envelope.
- Diagnostics structure returns `{skipped: {capacity: number, overage: number, adjacency: number, kmax: number, zone: number, limit: number, bucket: number}, enumerated: number, accepted: number}`.
- Telemetry assembly will assert sanitized payload before emit.

## UI/UX States

- N/A (no UI changes anticipated). Document manual validation for telemetry via dashboard queries.

## Edge Cases

- Planner invoked with missing feature flags; ensure defaults recorded correctly.
- Telemetry failure should not crash planner; maintain best-effort logging.
- Timer capture must handle early returns/errors; use `try/finally`.

## Testing Strategy

- Unit: telemetry timing injection, diagnostics normalization, PII scrub test.
- Integration: auto-assign quoting path verifying telemetry payload content (mock emitter).
- Property: optional check that diagnostics keys always present (object key set equality test).
- Manual: inspect telemetry payload in dev/staging logs; verify dashboard updates.

## Rollout

- Feature flags: ensure new telemetry fields optional for consumers; coordinate with observability team.
- Monitoring: dashboard review for latency distributions.
- Kill-switch: fallback to prior telemetry structure by toggling emitter flag if new format causes issues (document in ADR).
