---
task: remove-coordinator
timestamp_utc: 2025-11-20T20:10:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Remove Coordinator, Keep Legacy Flow

## Objective

Ensure the application uses only the legacy flow by removing the coordinator flow and any toggles or references that could re-enable it.

## Success Criteria

- [x] Coordinator imports/branches removed from inline API and auto-assign job; legacy planner always runs.
- [x] Feature flags/env/docs referencing the coordinator are removed or updated to reflect deprecation.
- [ ] Targeted tests/build for touched areas pass.

## Architecture & Components

- `server/jobs/auto-assign.ts`: Remove `AssignmentCoordinator` branch/runtime guard; keep legacy planner loop and observability.
- `src/app/api/bookings/route.ts`: Remove inline coordinator helper/branch; rely on legacy inline planner quoting/confirm flow.
- Coordinator modules: remove `server/assignments/*` (coordinator, state machine, runtime guard) and associated re-exports/tests.
- Config/flags: drop `assignmentPipeline` feature flag helpers and env wiring in `server/feature-flags.ts`, `lib/env.ts`, `config/env.schema.ts`, `.env.example`.
- Docs: replace/retire `docs/assignment-pipeline-rollout.md` to state coordinator removal/legacy default.

## Data Flow & API Contracts

- Inline booking creation keeps existing legacy planner quote/confirm sequence; no coordinator-specific telemetry or responses remain.
- Background auto-assign job always uses legacy planner attempts; summaries stay under `auto_assign.*` events.

## UI/UX States

- Not a UI change; ensure API responses mirror legacy behavior (success/error).

## Edge Cases

- Env deployments with coordinator flags set should continue to parse (schema passthrough) but flags have no effect; note in docs.
- Dashboards expecting `assignment.coordinator.*` telemetry will go quiet; communicate replacement expectations.

## Testing Strategy

- Unit/Integration: run targeted suites covering bookings/auto-assign (e.g., `pnpm test tests/server/booking` or equivalent) after removal; ensure build succeeds.
- Manual sanity: quick legacy booking path smoke if feasible.

## Rollout

- No feature flag; coordinator removed entirely. Update operator docs to signal legacy-only path going forward.

## DB Change Plan (if applicable)

- N/A (no DB migrations expected for this change).
