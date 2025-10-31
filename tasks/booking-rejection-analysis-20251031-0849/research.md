# Research: Booking Rejection Analysis

## Requirements

- Functional:
  - Produce an Ops-facing rejection analysis dashboard that groups unassigned bookings into **Hard Rejections** (operational blockers such as overrun windows or assignment conflicts) and **Strategic Rejections** (selector declined to seat because the scoring logic rejected all candidates). Acceptance criteria demand an additional drill-down so strategic rejections surface the dominant penalty driver (slack/demand, scarcity, or future-conflict penalties).
  - Allow operators to adjust strategic weighting parameters (scarcity, demand/slack multiplier, future-conflict penalty) through configuration that does **not** require redeploys, and ensure the effect appears immediately in selector telemetry/logs.
  - Support richer demand profiles (e.g., `FRIDAY_LUNCH`, `FRIDAY_DINNER`) with rule-specific multipliers and pick the most specific rule that matches a booking’s timestamp.
  - Enable simulations or live A/B tests between weight configurations (e.g., Strategy A “Aggressive” vs Strategy B “Balanced”) and track KPIs such as occupancy, RevPASH, and large-party turn-away rate.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Dashboard must honour accessibility standards in **AGENTS.md** (keyboard navigation, focus management, SR-friendly tables/charts).
  - Queries over observability data must remain performant for multi-day ranges; index strategy may need updates for `restaurant_id` filters.
  - Telemetry already redacts PII; new analytics must preserve the sanitisation guarantees in `server/capacity/telemetry.ts`.
  - Respect existing privacy rules when exposing decision logs and ensure feature toggles can be rolled back quickly.

## Existing Patterns & Reuse

- Selector telemetry already captures per-booking decisions (including `skipReason`, `plannerConfig`, and per-candidate `scoreBreakdown`) before inserting into `observability_events` via `emitSelectorDecision` (`server/capacity/telemetry.ts:362-399`).
- Skip reasons map to current rejection modes inside `autoAssignTablesForDate` (`server/capacity/tables.ts:3106-3352`): service overruns, capacity shortfalls, conflict overlaps, and generic “No suitable tables available …”. Tests assert these strings (`tests/server/capacity/autoAssignTables.test.ts:674-708`).
- Strategic configuration helpers centralise env parsing for scarcity weight and demand profile path (`server/capacity/strategic-config.ts:17-72`, `lib/env.ts:187-206`); lookahead penalty weights are exposed through feature flags (`server/feature-flags.ts:40-74`).
- Demand multipliers resolve through `resolveDemandMultiplier`, combining Supabase rows and the fallback JSON file (`server/capacity/demand-profiles.ts:124-293`, `config/demand-profiles.json`).
- Ops dashboard shell/components exist under `src/components/features/dashboard/` and `src/app/(ops)/ops/(app)/bookings`, providing scaffolding for new analytics views.
- Decision snapshots can already be captured for offline comparison when `captureDecisions` is true; results include `decisions` payload and persist to disk for audits (`server/capacity/tables.ts:3064-3513`).
- Observability data resides in Supabase table `public.observability_events` with views for coarse metrics (`supabase/migrations/20251026104600_add_observability_events.sql`, `supabase/migrations/20251029170500_capacity_observability_views.sql`). Scripts exist to export baselines (`scripts/observability/export-capacity-baselines.ts`).
- Yield-management guidance enumerates weight semantics and safe ranges (`documentation/YIELD_MANAGEMENT_CONFIG.md`).

## External Resources

- [`documentation/YIELD_MANAGEMENT_CONFIG.md`](documentation/YIELD_MANAGEMENT_CONFIG.md) – authoritative definitions for weights, multipliers, and lookahead behaviour that should inform UI copy and guardrails.
- Supabase migration `20251030142300_add_yield_management_tables.sql` – documents current `demand_profiles` schema (day-of-week + service window) and RLS constraints for any schema changes.
- Existing task artifacts (e.g., `tasks/strategic-scoring-activation-20251031-0019`) provide historical context on rolling out scarcity/demand features and can inform regression test selection.

## Constraints & Risks

- **Strategic rejection signal gap:** “Strategic” is not currently distinguished in code—`skipReason` only reports capacity/conflict/overrun strings, and a “No suitable tables available …” skip contains **zero** candidate data because the planner returned no plans (`server/capacity/tables.ts:3286-3298`). We must capture near-miss diagnostics (e.g., top rejected candidate scores) before emitting telemetry to satisfy the penalty attribution requirement.
- **Weight adjustability limits:** Scarcity weight can be tuned via env (`FEATURE_SELECTOR_SCARCITY_WEIGHT`), and lookahead penalty weight via `FEATURE_SELECTOR_LOOKAHEAD_PENALTY_WEIGHT`, but slack/demand multipliers still require editing Supabase rows or the fallback JSON (no UI or env override). Config changes require cache invalidation via `clearStrategicCaches()` to take effect across processes (`server/capacity/strategic-maintenance.ts:5-12`).
- **Demand profile specificity:** Resolver only matches on day-of-week + service window (`server/capacity/demand-profiles.ts:200-231`); `start/end` fields in the fallback config are ignored. Supabase schema lacks time-of-day columns, so finer granularity will need schema + resolver changes and migration choreography.
- **Observability performance:** `observability_events` lacks an index on `restaurant_id`; large tenants could suffer slow dashboards unless we add indexing or materialised views. Need to validate query plans after new analytics.
- **Telemetry storage location:** `captureDecisions` currently writes JSON files to disk (`AUTO_ASSIGN_LOG_DIR`), which is unsuitable for long-term analysis in serverless deployments. Decide whether to rely on Supabase storage or new tables when enabling simulations.
- **Metrics coverage:** Legacy `capacity_metrics_hourly` table was dropped (`supabase/migrations/20251020232438_remove_capacity_schema.sql`), so KPIs like occupancy must be recomputed from bookings/allocations or new materialisations.
- **Data volume & retention:** Observability events can grow quickly; dashboard queries should paginate/time-box and possibly summarise server-side to avoid client strain.

## Open Questions (owner, due)

- Q: Where should runtime weight adjustments live (env overrides, Supabase settings table, or a dedicated admin UI)? Who owns approvals for live tuning? — _Owner: Product/Platform_, Due: before design freeze.
- Q: How do we define “strategic rejection” formally—threshold on score, absence of conflict-free plans, or explicit flag? Need alignment so analytics match operator expectations. — _Owner: Product + Engineering_, Due: prior to implementation.
- Q: What is the desired historical window and refresh cadence for the rejection dashboard? (Impacts indexing and caching strategy.) — _Owner: Data/Analytics_, Due: before schema work.
- Q: For A/B testing, do we run simultaneous strategies per-booking (randomised) or per-restaurant cohorts? Clarify to design experiment assignment & storage. — _Owner: Growth/Analytics_, Due: before build.

## Recommended Direction (with rationale)

- Extend selector telemetry to always emit the **best rejected candidate** (even when no plan is chosen) so we can compute penalty attribution; classify rejections upstream based on `skipReason` patterns and new strategic flags, then materialise a `capacity_selector_rejections_v1` view keyed by restaurant/time for the dashboard.
- Centralise strategic weight configuration in Supabase (e.g., `strategic_configs` table) with env fallbacks, wiring `strategic-config` helpers to reload and exposing values through `plannerConfig` for immediate log visibility. Hook up a secure Ops settings surface to edit weights with validation grounded in the ranges documented in `documentation/YIELD_MANAGEMENT_CONFIG.md`.
- Upgrade demand profile schema to include daypart start/end (and priority) columns, update `resolveDemandMultiplier` to pick the most specific rule (restaurant override > matching time window > default), and maintain cache invalidation hooks for safe tuning.
- Build simulation/A-B tooling around the existing `captureDecisions` pipeline: store captured decisions and re-score them under alternative configs within Supabase (or a durable store), computing KPIs (occupancy, large-party rejection, RevPASH) via SQL materialisations so Strategy A vs B comparisons power both dashboards and experimentation.
- Implement indexing/materialised views on `observability_events` (e.g., `(restaurant_id, created_at DESC)`) to keep dashboard queries performant, and document retention/archival expectations so analytics remain sustainable.
