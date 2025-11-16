---
task: booking-flow-script
timestamp_utc: 2025-11-14T22:00:00Z
owner: github:@ai-agent
reviewers: []
risk: high
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Exported diagnostics flags (DEBUG_CAPACITY_PROFILING, FEATURE_ALLOCATOR_V2_ENABLED, selector timeout + fail-hard) for both the Next.js server and slot-fill CLI sessions.
- [x] Validated environment (`pnpm run validate:env`) ensuring Supabase + BASE_URL secrets exist.
- [x] `set -a && source .env.local` prior to each slot-fill batch so Supabase keys/BASE_URL were in scope.
- [x] Prepared DB between runs via `pnpm run db:reset` (base + White Horse seeds). No discrete `db:seed-*` scripts exist; reseeded via `db:reset`/`db:seed-only` when needed.
- [~] Baseline integrity: Historical `pnpm run db:stress-test` script is missing. Substituted manual Supabase overlap checks logged in `pre-slot-fill-integrity*.log` before each blast.

## Core

- [x] Ran slot-fill with concurrency=1 covering 17:30–18:30 (shortened window after repeated 4-hour runs timed out) using `--stress-max 4`, `--max-party-size 8`.
- [x] Ran slot-fill with concurrency=4 (same window + parameters) and collected logs/metrics.
- [x] Ran slot-fill with concurrency=8 (same window) after reseeding, captured logs, and noted allocator slowdowns.
- [x] When earlier runs failed (large parties / stress-max 10), resumed from next slot or lowered stress cap per instructions; logs retained for evidence.
- [x] Tailed logs + extracted JSON summaries to compare API submit vs inline poll vs seat waste; correlated inline delays with allocator telemetry.

## UI/UX (CLI Observability)

- [ ] Confirm inline/timeout states reported clearly in logs; highlight any seat waste anomalies.
- [ ] Note correlation between concurrency and seat waste / queue backlog.

## Tests

- [~] `pnpm run db:stress-test` post-run — unavailable, replaced with custom overlap/null-window checks (`post-slot-fill-integrity.log`).
- [x] Documented success/failure counts + averages per concurrency in `slot-fill-metrics.json`.

## Notes

- Assumptions:
  - Localhost base URL accepted due to DNS limits.
  - Remote Supabase credentials valid + authorized for destructive ops.
- Deviations:
  - Time window trimmed to 17:30–18:30 with `--stress-max 4` after repeated 4-hour/`stress-max 10` attempts timed out or hit allocator adjacency limits.
  - Historical `db:stress-test` script missing; relied on manual overlap checks pre/post runs.
  - Concurrency 8 remained stable with reduced stress cap; higher settings would need better Supabase pooling before retry.

## Batched Questions

- N/A (documented in research open questions).
