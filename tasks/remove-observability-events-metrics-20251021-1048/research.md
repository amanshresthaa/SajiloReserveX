# Research: Remove Observability Events Metrics Dependency

## Existing Patterns & Reuse

- `src/app/api/ops/metrics/selector/route.ts` fetches selector metrics from Supabase and emits diagnostics to the Ops UI dashboard via `getSelectorMetrics`.
- `src/components/features/dashboard/OpsDashboardClient.tsx` shows the “Assignment Insights” panel by calling `getSelectorMetrics`, gated behind the Ops metrics feature flag.
- `server/observability.ts` provides `recordObservabilityEvent`, which still attempts to insert rows into `observability_events`; numerous API routes invoke it for logging, though failures are caught and only logged to console.
- Supabase migrations do not create `observability_events`; the table appears unused/unsupported in current environments.

## External Resources

- Internal selector diagnostics UX—confirm no downstream consumer relies on the metrics endpoint once we disable it.

## Constraints & Risks

- Removing the Supabase query must not break Ops dashboards or other API consumers; the endpoint should gracefully degrade.
- Need to ensure feature flag `FEATURE_SELECTOR_SCORING` remains untouched.

## Open Questions (and answers if resolved)

- Q: Does any other part of the app read from `observability_events`?
  A: No read paths besides the metrics route; `recordObservabilityEvent` only writes and swallows errors.
- Q: What surfaces depend on selector metrics?
  A: Only the Ops dashboard “Assignment Insights” query, guarded by `isOpsMetricsEnabled`.

## Recommended Direction (with rationale)

- Remove `/api/ops/metrics/selector` and the associated service/client code so Ops no longer requests nonexistent telemetry.
- Replace the Assignment Insights panel with a simple notice (or remove entirely) while leaving the feature flag fallback to avoid UI regressions when reintroducing metrics.
- Leave `recordObservabilityEvent` in place (still useful if table is restored) but ensure no user-facing path depends on its insert succeeding.
- Update tests and docs to reflect the feature removal and adjust fetch mocks accordingly.
