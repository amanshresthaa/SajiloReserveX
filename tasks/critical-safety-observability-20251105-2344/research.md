# Research: Critical Safety & Observability Foundation

## Requirements

- Functional:
  - Story 1.1 (hold conflicts): ensure `holds.strictConflicts` is enabled everywhere, enforce database exclusion guarantees for holds, add integration coverage for concurrent requests, and ship with staged rollout + rollback plan so double-bookings drop to zero under 1000 concurrent synthetic requests.
  - Story 1.2 (monitoring): translate existing `recordObservabilityEvent` streams into metric shapes that surface assignment success, latency percentiles, retry/cutoff health, and error composition via Grafana/DataDog dashboards plus actionable alerts.
  - Story 1.3 (flag governance): produce an auditable registry of feature flags, safe default matrix across dev/staging/prod, guard against contradictory combos, require two-person approval for changes, and deliver a troubleshooting runbook.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Reliability: database constraints must fail safe with clear error surfaces (`server/capacity/tables.ts:3368` onwards) so callers recover without user-visible 500s.
  - Performance: observability queries/dashboards must run within existing Supabase latencies; reuse views like `public.capacity_observability_selector_metrics` (`supabase/migrations/20251029170500_capacity_observability_views.sql`) to avoid heavy ad-hoc scans.
  - Security/compliance: feature flag change workflow should log actors and avoid leaking secrets; observability payloads already sanitized via `sanitizeTelemetryContext` (`server/capacity/telemetry.ts:214`), so dashboards must respect that contract.
  - Privacy: ensure metrics aggregates exclude PII; confirm context fields omit guest details (verified via `server/capacity/telemetry.ts` inspection and tests in `tests/server/capacity/telemetry.sanitization.test.ts`).

## Existing Patterns & Reuse

- Hold enforcement already configures Postgres GUC `app.holds.strict_conflicts.enabled` through `configureHoldStrictConflictSession` (`server/capacity/holds.ts:130-165`) and relies on exclusion constraint `table_hold_windows_no_overlap` (`supabase/migrations/20251029183500_hold_windows_and_availability.sql`). We should extend callers rather than re-implement conflict logic.
- Application logic in `server/capacity/tables.ts:3360-3440` catches `HoldConflictError` and emits observability via `emitRpcConflict`. We can wrap stricter DB errors there to surface retries/alternates.
- Observability ingestion centralises through `recordObservabilityEvent` (`server/observability.ts`), and capacity telemetry emitters (`server/capacity/telemetry.ts`) already tag events we need (assignment, quote, manual workflows, strict conflicts). Supabase views (`capacity_observability_selector_metrics`, `capacity_observability_hold_metrics`, `capacity_observability_rpc_conflicts`) provide ready-made SQL sources for dashboards.
- Feature flag overrides use Supabase table access (`server/feature-flags-overrides.ts`, validated by `tests/server/featureFlags.overrides.test.ts`). The env schema (`config/env.schema.ts`) defines canonical names, and `server/feature-flags.ts` exposes typed getters we can decorate with validation warnings.
- Prior tasks (`tasks/enable-hold-conflict-enforcement-20251102-1058`, `tasks/fix-hold-toctou-20251104-1359`) document rollout patterns for hold stricter enforcement; we can reuse their Supabase RPC helpers and runbook formatting.

## External Resources

- Docs: `docs/table-assignment-business-rules.md` (strict conflict rationale and risk of application-only checks); `docs/ops/high-latency-context.md` (latency observability expectations); `docs/ops/manual-assignment-fails-confirm.md` (manual workflow telemetry).
- Supabase schema exports (`supabase/schema.sql`) confirm materialized views and `observability_events` retention—align dashboards with these definitions.
- Stress tooling: `run-allocation-stress-test.sh` + `stress-test-output-*.log` for simulating 1000+ concurrent requests—reusable for soak test.
- Observability research tasks (e.g., `tasks/booking-rejection-analysis-20251031-0849`) show how existing teams built metrics from `observability_events`.

## Constraints & Risks

- Global flag enablement must be coordinated: without staged rollout (10% → 50% → 100%) we could block genuine holds if latent data drift exists. Need kill switch + GUC toggle verification.
- Database constraint relies on trigger-maintained `table_hold_windows`; if triggers lag during heavy load, false positives could occur. Need monitoring on trigger lag and fallback path (two-step insert) to ensure coverage.
- Grafana/DataDog integration depends on secure credentials not stored in repo; we must document config steps and ship dashboard JSON/templates without secrets.
- Feature flag registry risks staleness; automation (script pulling from Supabase + env defaults) required to keep matrix accurate. Without gating, contradictory combos (e.g., `allocator.requireAdjacency=false` + `allocator.mergesEnabled=true`) could slip through.
- Alert noise: thresholds must avoid flapping. Need hysteresis/backoff config, plus simulation using historical data (maybe seed/test queries) before production go-live.

## Open Questions (owner, due)

- Q: Where is the authoritative list of per-environment flag overrides stored (Supabase table vs. LaunchDarkly)? (Owner: Tech Lead, due 2025-11-06)
  A: Pending confirmation—evidence suggests Supabase `feature_flag_overrides` table; need credential to inspect.
- Q: Which observability backend (Grafana vs. DataDog) is prioritized for sprint deliverable? (Owner: Platform lead, due 2025-11-06)
  A: Need decision to format dashboard export (Grafana JSON vs. DataDog monitor JSON).
- Q: Is synthetic load runner available for staging (existing stress test vs. new k6 scenario)? (Owner: Backend lead, due 2025-11-07)
  A: Awaiting environment access confirmation.

## Recommended Direction (with rationale)

- Adopt a two-phase rollout for strict conflicts: (1) audit env defaults, ensure Supabase RPC verifies GUC, and add guardrails in `server/capacity/tables.ts` to treat Postgres `23P01` as conflict, logging metrics; (2) drive feature flag rollout via configuration matrix + scripts to push overrides, paired with load tests recorded in `verification.md`.
- Leverage existing Supabase views for Dashboard metrics. Create a `scripts/observability/export-capacity-metrics.ts` (or extend existing tooling) that maps `observability_events` to Prometheus-style series / Grafana JSON, and document alert configs referencing thresholds. This avoids duplicating pipelines and keeps retention within 90-day guarantee.
- Build centralized `docs/feature-flags/registry.md` powered by generated table (derive from `config/env.schema.ts` + Supabase overrides). Implement runtime validation in `server/feature-flags.ts` (log warnings via `console.warn` and optionally `recordObservabilityEvent`) when unsafe combinations detected. Establish `scripts/feature-flags/audit.ts` to dump per-env state and require two approvers via PR checklist update.
- Document rollout & rollback (including Supabase `set_hold_conflict_enforcement(false)` command) in `verification.md`, ensuring soak test evidence plus alert screenshots are captured for review.
