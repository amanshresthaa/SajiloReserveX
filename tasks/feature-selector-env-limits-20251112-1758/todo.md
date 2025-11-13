---
task: feature-selector-env-limits
timestamp_utc: 2025-11-12T17:58:36Z
owner: github:@codex-ai
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Locate existing feature selector env entries in `.env.local`.

## Core

- [x] Update `FEATURE_SELECTOR_MAX_PLANS_PER_SLACK` to 200 for faster local searches.
- [x] Ensure `FEATURE_SELECTOR_MAX_COMBINATION_EVALUATIONS` is 2000 so enumeration stops sooner.
- [x] Ensure `FEATURE_SELECTOR_ENUMERATION_TIMEOUT_MS` is 5000 so planner respects client timeouts.
- [x] Require adjacency when merges are enabled by setting `FEATURE_ALLOCATOR_REQUIRE_ADJACENCY=true`.

## Verification

- [x] Run `pnpm run build` to confirm env validation passes during both prebuild and runtime phases.

## Notes

- Assumptions: The documented caps are authoritative; exceeding them is unnecessary for local validation.
- Deviations: None presently.
