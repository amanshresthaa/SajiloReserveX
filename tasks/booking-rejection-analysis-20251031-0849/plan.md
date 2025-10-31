# Implementation Plan: Booking Rejection Analysis

## Objective

Deliver an Ops-facing rejection analysis experience that (1) classifies unassigned bookings into hard vs. strategic causes with actionable penalty insights, (2) enables rapid tuning of scarcity/demand/future-conflict weights with immediate telemetry feedback, (3) supports granular demand profiles (e.g., Friday lunch vs dinner), and (4) unlocks simulation/A-B workflows to compare alternative tuning strategies against occupancy and revenue KPIs.

## Success Criteria

- [ ] Rejection dashboard (Ops) shows daily counts & percentages for **Hard Rejection** vs **Strategic Rejection** with a drill-down that identifies the dominant strategic penalty (slack/demand, scarcity, or future conflict) per booking.
- [ ] Strategic weights can be updated without redeploy (via Supabase-backed config) and planner telemetry (`plannerConfig.weights`, `scoreBreakdown`) reflects the new values within one auto-assignment cycle (<60 s) after cache invalidation.
- [ ] Demand profile resolver picks the most specific rule when both day-of-week and time window apply (validated by automated test covering Friday lunch/dinner scenario) and exposes rule metadata in telemetry.
- [ ] Simulation pipeline compares Strategy A vs Strategy B over the same decision snapshots and surfaces KPIs (occupancy %, large-party turn-away rate, RevPASH proxy) in an exportable report for Ops/Product review.

## Architecture & Components

- **Supabase data layer**
  - Add materialized view `capacity_selector_rejections_v1` grouping `observability_events` (`source='capacity.selector'`, `event_type='capacity.selector.skipped'`) into hard vs strategic categories using normalized `skip_reason` patterns. Include planner metadata (weights, lookahead) and candidate summaries when present.
  - Create table `strategic_configs` (restaurant_id nullable for global defaults) holding weights `{scarcity_weight, demand_multiplier_override, future_conflict_penalty}` plus metadata (`updated_by`, `updated_at`). Provide unique constraint `(restaurant_id)`.
  - Extend `demand_profiles` with `start_minute`, `end_minute`, and `priority` columns (or new table if altering existing is risky) so multiple rules per day/service window can coexist; adjust RLS to permit Ops managers.
  - Optional: table `strategic_simulation_runs` storing strategy metadata, KPIs, and snapshot references for A/B results.

- **Server (Next.js / Node)**
  - New module `server/ops/rejections.ts` querying the Supabase view and shaping response for the dashboard (supports pagination + filters by restaurant/date range). Cache results for short intervals (e.g., 30 s) via in-memory memoization keyed by params.
  - Enhance `server/capacity/tables.ts` to capture the top-scoring rejected candidate (including scoreBreakdown) before returning when `plans.plans.length === 0`; include this in `emitSelectorDecision` payload so strategic penalties can be derived. Guard to avoid large payloads by limiting to top N (e.g., 3) candidates.
  - Extend `server/capacity/telemetry.ts` to mark a skip as `classification: 'hard' | 'strategic'` and record `dominantPenalty` value (derived server-side) to reduce downstream processing, while preserving backward compatibility for existing consumers.
  - Update `server/capacity/strategic-config.ts` to read overrides from `strategic_configs` (falling back to env + default), with memoized fetch and invalidation via `clearStrategicCaches()`.
  - Revise `resolveDemandMultiplier` to consider time-of-day specificity: convert booking start to service timezone, compute minutes since midnight, and select the rule with matching day+service window, prioritizing restaurant overrides then highest `priority`/longest specificity (start/end). Include rule metadata in telemetry (`plannerConfig.demandRule`).
  - Introduce `server/ops/strategies.ts` helper to run re-scoring simulations: ingest captured decision snapshots, re-run scoring with alt weights/demand multipliers (without committing assignments), and compute KPI deltas.

- **API Routes**
  - `GET /api/ops/dashboard/rejections`: query params `{ restaurantId, from, to, granularity? }`; returns aggregated metrics, trend series, and top penalty contributions for strategic category.
  - `POST /api/ops/settings/strategic-config`: authenticated Ops manager updates weights; triggers cache clear and writes audit log.
  - `POST /api/ops/strategies/simulate`: body includes `{ restaurantId, snapshotRange, strategyA, strategyB }`; returns summary KPIs, optional job id for long-running simulations. For heavy workloads, delegate to background job queue (follow-up task if needed).

- **Frontend (Ops)**
  - New route section `src/app/(ops)/ops/(app)/dashboard/rejections` accessible from dashboard nav.
  - Component set `src/components/features/dashboard/rejections/`: `RejectionOverviewCard`, `RejectionTrendChart`, `StrategicPenaltyBreakdown`, `RejectionTable`.
  - Hook `useOpsRejectionInsights` using React Query against the new API; share restaurant + date filters with existing dashboard context.
  - Settings surface (modal or dedicated page) for strategic weights/demand rules leveraging Shadcn form components with validation and optimistic feedback (tie into `strategic_configs`).
  - Simulation UI (phase 1 minimal): trigger simulations, display KPI comparison (table + badges) and link to exported CSV.

- **Alternative considerations (evaluated & deferred)**
  - Direct client-side Supabase queries vs server API: rejected to keep secrets/tuning restricted server-side.
  - Writing new events during auto-assignment vs deriving from telemetry: prefer derivation to avoid double writes, but if payload size proves problematic we may fall back to log summarization job (note risk in Edge Cases).

## Data Flow & API Contracts

- **GET `/api/ops/dashboard/rejections`**
  - Query: `restaurantId` (required, UUID), `from`/`to` ISO dates (default today), `bucket=hour|day`.
  - Response:
    ```json
    {
      "restaurantId": "uuid",
      "range": { "from": "2025-10-30", "to": "2025-10-31" },
      "summary": {
        "total": 42,
        "hard": {
          "count": 18,
          "percent": 42.9,
          "topReasons": [{ "label": "service_overrun", "count": 7 }]
        },
        "strategic": {
          "count": 24,
          "percent": 57.1,
          "topPenalties": [{ "penalty": "slack", "count": 11 }]
        }
      },
      "series": [{ "bucket": "2025-10-31T18:00:00Z", "hard": 5, "strategic": 7 }],
      "strategicSamples": [
        {
          "bookingId": "uuid",
          "skipReason": "No suitable tables available (capacity)",
          "dominantPenalty": "scarcity",
          "scoreBreakdown": { "slack": 120, "scarcity": 240, "futureConflict": 0 },
          "plannerConfig": {
            "weights": { "scarcity": 22 },
            "demandRuleLabel": "friday_dinner_peak"
          }
        }
      ]
    }
    ```
  - Errors: `400` invalid params, `403` lack membership, `500` backend failure.

- **POST `/api/ops/settings/strategic-config`**
  - Body: `{ "restaurantId": "uuid" | null, "weights": { "scarcity": number, "demandMultiplier": number }, "futureConflictPenalty": number }`.
  - Returns updated config, new telemetry effective timestamp. Side-effect: call `clearStrategicCaches()` and log audit event.

- **POST `/api/ops/strategies/simulate`**
  - Body: `{ "restaurantId": "uuid", "from": "2025-10-25", "to": "2025-10-31", "strategyA": { ...weights }, "strategyB": { ...weights }, "metrics": ["occupancy","turnAwayLargeParty","revpash"] }`.
  - Response: either immediate `{ "status": "completed", "results": {...} }` or `{ "status": "pending", "jobId": "..." }` with polling endpoint (future extension).

## UI/UX States

- **Loading**: skeleton cards + chart shimmer; maintain layout to avoid CLS.
- **Empty**: explanatory state when selected range has zero skipped events (show checklist reminding to enable selector telemetry and set date range).
- **Error**: inline alert with retry + link to troubleshooting doc; redact backend messages to avoid leaking internals.
- **Success**: summary cards (total/hard/strategic), stacked bar chart over chosen interval, table of strategic samples with accessible toggle to reveal score breakdown JSON, and settings/simulation panels.
- **Settings modal states**: idle (show current weights w/ last updated info), editing (validate ranges per `documentation/YIELD_MANAGEMENT_CONFIG.md`), saving (loading spinner), success/error banners.

## Edge Cases

- Historical telemetry may lack `dominantPenalty` (pre-deployment). UI should fall back to “unknown” and link to note.
- No captured candidates for strategic skip (current behaviour) — once instrumentation lands, guard UI to handle null breakdown gracefully until data backfills.
- Demand profile overrides missing `start/end`: treat as whole service window; ensure resolver log includes fallback path.
- Supabase view rebuild latency: materialized view refresh might lag; provide manual refresh button and note last refreshed timestamp.
- Large date ranges: enforce max span (e.g., 14 days) and prompt user to export via simulation pipeline for longer analyses.
- Config update races: if two admins edit simultaneously, rely on row `updated_at` + conditional update to avoid stomps.

## Testing Strategy

- **Unit**: classification helpers (hard vs strategic), dominant penalty derivation, demand rule selection ordering, strategic config loader (with env + DB overrides), simulation KPI calculators.
- **Integration**: auto-assign flow test verifying `emitSelectorDecision` now emits rejected candidate breakdown; API contract tests for `/api/ops/dashboard/rejections`; migration tests ensuring `demand_profiles` schema upgrades maintain RLS.
- **E2E**: Playwright scenario for Ops user viewing rejection dashboard, adjusting weights, observing telemetry change (mock or intercept API). Simulation happy-path run verifying KPI comparisons render.
- **Accessibility**: axe/lighthouse checks on new dashboard views; verify table summaries have aria-labels/tooltips for SR users.

## Rollout

- Feature flag: `FEATURE_OPS_REJECTION_ANALYTICS` gating new dashboard + API responses.
- Exposure: internal QA (flagged to staff only) → pilot restaurants (10%) → full rollout once KPIs validated.
- Monitoring: Supabase query latencies for new view, API error rates, selector skip trends, config update audit logs.
- Kill-switch: disable feature flag to hide UI/API; revert to default strategic weight env values via `strategic_configs` rollback script.
