---
task: remove-coordinator
timestamp_utc: 2025-11-20T20:10:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Research: Remove Coordinator, Keep Legacy Flow

## Requirements

- Functional:
  - Remove the AssignmentCoordinator flow and rely solely on the legacy planner paths for inline auto-assign and background job assignment.
  - Strip coordinator-specific feature flags/env config, tests, and rollout docs so legacy is the only supported path.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Preserve existing booking performance/observability; keep legacy telemetry unaffected; avoid breaking env validation.

## Existing Patterns & Reuse

- Legacy planner paths already exist in `server/jobs/auto-assign.ts` (retry loop + planner telemetry) and API inline flow (`quoteTablesForBooking` + confirm); these are now the sole path after coordinator removal.
- Coordinator-specific feature flags (`assignmentPipeline`), runtime guard, and the `AssignmentCoordinator` module under `server/assignments/` (with its telemetry test) have been removed in this task.
- Documentation updated: `docs/assignment-pipeline-rollout.md` now notes the retirement; other references repoint to legacy planner docs under `server/capacity/`.

## External Resources

- Internal note: `docs/assignment-pipeline-rollout.md` now documents the retirement of the coordinator pipeline.

## Constraints & Risks

- Coordinator removal must excise imports/usages in API and job code to avoid runtime errors; ensure legacy paths still compile and retain expected telemetry.
- Env/config clean-up needs to stay compatible with existing `.env` contents (schema is passthrough but examples should not advertise removed flags).
- Tests referencing coordinator need updates/removal to keep CI green.
- Docs and any operator playbooks need updating to avoid drift.

## Open Questions (owner, due)

- Any dashboards or alerts still expecting `assignment.coordinator.*` telemetry to repoint? (owner: self, before verification)

## Recommended Direction (with rationale)

- Remove coordinator imports/branches in background job and inline API so legacy planner is always used. ✅
- Delete coordinator module exports/tests and related feature-flag/env wiring to prevent accidental reuse. ✅
- Update env examples + docs to indicate the coordinator is retired and legacy planner is the default; follow up on observability/dashboard updates if needed.
