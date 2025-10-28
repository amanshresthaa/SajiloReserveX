# Research: Sprint 4 — Observability, Telemetry & Hardening

## Requirements

- Functional:
  - Record planner durations and configuration parameters in telemetry.
  - Ensure diagnostic `skipped` keys are normalized and comprehensive.
  - Scrub PII from telemetry payloads.
  - Document planner rules and enforce lint guardrails.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Privacy: No PII in telemetry; only stable IDs.
  - Performance: Telemetry additions must be low overhead (<5% latency impact).
  - Reliability: Telemetry data must exist even when counts are zero.

## Existing Patterns & Reuse

- Telemetry utilities in `server/capacity/telemetry.ts` already capture planner loop contexts.
- Diagnostics struct in `server/capacity/selector.ts` defines several skip buckets; ensure reuse.
- Prior ADR and docs on time-window semantics exist in `tasks/service-window-integrity-20251028-1115`.
- ESLint server overrides implemented in Sprint 2 (Date.parse ban); extend similar patterns.

## External Resources

- [Luxon Docs](https://moment.github.io/luxon/#/), for time handling references.
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) – guidance on avoiding PII in logs.

## Constraints & Risks

- Telemetry volume increase could affect storage/ingestion costs; sampling may be needed.
- Adding timers must not block critical paths; prefer `performance.now()` or `Date.now()` with minimal overhead.
- Need to confirm all telemetry outputs go through shared helper to guarantee PII scrubbing.

## Open Questions (owner, due)

- Q: What exact adjacency/combination flags must be reported? (owner: self, due: Plan phase)
- Q: Where to persist ADR (existing docs structure)? (owner: self, due: Plan phase)

## Recommended Direction (with rationale)

- Instrument planner entry points (auto-assign, quote) using high-resolution timers, pushing metrics via existing telemetry helper for consistency.
- Normalize diagnostics structure within selector so telemetry payloads include all skip keys regardless of activity.
- Introduce privacy guard by centralizing payload assembly and asserting absence of PII via unit tests.
- Expand documentation with in-code JSDoc and a new ADR summarizing planner telemetry/time semantics to aid future contributors.
- Update CI lint configuration to enforce telemetry guardrails (e.g., import overlap helper, ban Date.parse) ensuring regressions are caught automatically.
