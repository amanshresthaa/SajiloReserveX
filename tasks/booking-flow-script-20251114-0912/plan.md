---
task: booking-flow-script
timestamp_utc: 2025-11-14T21:55:00Z
owner: github:@ai-agent
reviewers: []
risk: high
flags: []
related_tickets: []
---

# Implementation Plan: White Horse Parallel Slot Fill Stress Test

## Objective

We will drive the booking flow for White Horse Pub (Waterbeach) across a dense set of time slots while varying concurrency to surface the slowest hop (API, allocator inline poll, or Supabase DB) so that we can document bottlenecks and remediation ideas.

## Success Criteria

- [ ] Database prepared with deterministic stress data; `pnpm run db:stress-test` passes before and after the blast.
- [ ] Slot-fill script executed for at least three concurrency levels (1, 4, 8) covering four hours of slots with stress-max ≥10.
- [ ] Metrics table produced (avg submitDurationMs, inlineDurationMs, seat waste, failure reasons) per concurrency level with log references.
- [ ] Bottleneck narrative identifies slowest stage with log excerpts + timing proof.
- [ ] `verification.md` updated with evidence, artifacts list, and recommendations.

## Architecture & Components

- `scripts/run-slot-fill.ts`: orchestrates sequential or concurrent slot executions using `scripts/run-booking-flow.ts` under the hood. Concurrency parameter controls worker count.
- Booking Flow script touches:
  - API `POST /api/bookings` (Next.js server) — handles HTTP entry, synchronous validation, `submitDurationMs`.
  - Inline allocator (server job) — polled for up to 25s; populates `inlineDurationMs` and `inlineAttempts` metrics, plus `backgroundInvoked` flag.
  - Supabase (Postgres) — stores bookings, assignments, job telemetry; DB pressure becomes evident via timeouts or queue backlog.
- Logging/artifacts: `tasks/booking-flow-script-20251114-0912/artifacts/slot-fill-*.log` (slot-level) plus aggregated metrics summary (to be generated in-plan).

## Data Flow & API Contracts

- CLI -> `booking:flow` -> POST `/api/bookings` with party/time parameters.
- Server inline job tries `autoAssignAndConfirmIfPossible` (Supabase operations, telemetry) while instrumentation logs to server STDOUT if `DEBUG_CAPACITY_PROFILING=true`.
- When inline fails or times out, background queue job picks up; script polls job API and fetches Supabase booking state.
- Failures manifested as `Booking request timed out` (client) or `inline poll exceeded` (server). Capturing `failureReason` from script logs indicates which component stalled.

## UI/UX States

- CLI output states: `confirmed`, `inline timeout (background invoked)`, `failed_background_timeout`, `api_timeout` etc. Need to track each run's summary block.
- Key metrics per iteration: `submitDurationMs`, `inlineDurationMs`, `postJobDurationMs`, `seatWaste`, `tableNumbers`, etc. We'll parse the structured summary block (JSON-like) after each run.

## Edge Cases

- Slot exhaustion: if tables fill up early, we may see deterministic failures; mitigate by expanding time range and verifying DB seeds between concurrency runs.
- Supabase throttling: concurrency 8 may exceed connection limit; monitor logs for `Connection terminated` or `Too many clients` and react by lowering `stress-max` or staggering runs.
- DNS/resolution issues for prod base URL: plan assumes localhost fallback; document limitation and its impact on findings.

## Testing Strategy

- `pnpm run db:stress-test` pre/post to validate DB constraints.
- Script-level validation: ensure each concurrency run exits 0; handle partial failures by resuming from next slot (adjust start time or reduce `stress-max`).
- Cross-check metrics by parsing logs via `rg`/`jq` and manual sampling to avoid misinterpretation.
- Optional: run single-slot sequential test to sanity-check instrumentation before large blasts.

## Rollout

- Feature flag toggles: export `DEBUG_CAPACITY_PROFILING=true`, `FEATURE_ALLOCATOR_V2_ENABLED=true`. Optional toggles: `FEATURE_SELECTOR_ENUMERATION_TIMEOUT_MS=500`, `FEATURE_ALLOCATOR_SERVICE_FAIL_HARD=true` to stress failure scenarios.
- Concurrency exposures: run sequential (1) for baseline, moderate (4) for target scenario, and higher (8) to test saturation.
- Monitoring: tail server logs (if accessible) and script logs simultaneously; align timestamps to identify slowest stage.
- Kill-switch: stop script via Ctrl+C if Supabase errors spike or `db:stress-test` indicates violations.

## DB Change Plan (if applicable)

- Target env: remote Supabase referenced by `.env.local`.
- Steps: `pnpm run db:reset` → `pnpm run db:seed-intelligent` → `pnpm run db:seed-today` → `pnpm run db:stress-test` (evidence stored in artifacts as console output snapshot).
- No schema migrations expected; operations are data-only resets.
- Rollback: re-run `pnpm run db:reset` to restore baseline if scripts partially fail.
