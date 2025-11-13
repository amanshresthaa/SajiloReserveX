---
task: auto-assign-optimization
timestamp_utc: 2025-11-12T20:08:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: high
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Confirm `recordPlannerQuoteTelemetry` covers inline, job, and stress scripts; extend helper to accept optional internal stats payload.
- [x] Add/verify feature flags (`feat.auto_assign.retry_policy_v2`, `PLANNER_CACHE_ENABLED`, `DEBUG_CAPACITY_PROFILING`).
- [x] Ensure task artifacts (research/plan/todo/verification) stay updated per `/AGENTS.md`.

## Core Instrumentation & Data Sharing (Epics A & B1)

- [x] Inline flow: wrap planner call / confirm with telemetry + inline result persistence, including timeout events with attempt metadata.
- [x] Job flow: ensure `auto_assign.summary` always emitted; include inline context when present.
- [x] Stress scripts: add telemetry wrappers + safe-mode defaults; persist aggregated stats for baseline doc.
- [x] Extend inline persistence to mark email-sent flag and reason so job can skip duplicate email.

## Retry / Backoff Policy (Epic B2)

- [x] Introduce deterministic vs transient reason mapping; reduce maxAttempts when inline hard failure reason cached.
- [x] Combine retry logic with service cutoff and dynamic delays; ensure attempts ≤3 by default for hard fails.
- [x] Emit observability events for cutoff, exhausted, already confirmed, and reason-coded stop conditions.

## Planner Profiling & Optimization (Epics C1–C3)

- [x] Add DEBUG-only counters for combination counts, DB query totals, pruning reasons; emit via telemetry when enabled.
- [x] Implement global/zone capacity pre-checks delivering explicit `reason` codes (e.g., `INSUFFICIENT_GLOBAL_CAPACITY`).
- [x] Introduce per-process planner result cache with TTL; reuse failures/success hints across inline/job/scripts.

## Inline Timeout & Duplication Controls (Epics D1–D2)

- [x] Propagate AbortSignal through planner + Supabase calls; enforce predictable timeout errors.
- [x] Persist inline timeout metadata so background job can adjust strategy (e.g., relax adjacency, reduce attempts).
- [x] Guard duplicate confirmation emails by checking inline result metadata before sending job emails.

## Ops Scripts Safety (Epic E)

- [x] Update `runUltraFastAssignment` defaults (concurrency caps, opt-in flags) with warnings when overriding.
- [x] Ensure scripts leverage same caching/pruning modules as production flows.

## Tests & Verification

- [ ] Unit tests for telemetry helper, retry rule classifier, cache helper, inline timeout handling.
- [ ] Integration tests (or high-confidence manual QA) for inline POST + auto-assign job interplay.
- [ ] Stress run & baseline report (tasks/<slug>/artifacts) capturing before/after metrics per Epic A3.

## Notes

- Assumptions:
  - Existing `auto_assign_last_result` column is sufficient for inline persistence (no migration needed).
  - Observability pipeline can handle additional event volume.
- Deviations:
  - None yet.

## Batched Questions

- [ ] Confirm canonical `quote.reason` taxonomy with capacity SME before finalizing retry rules.
- [ ] Align with ops on safe inline timeout thresholds vs user experience.
