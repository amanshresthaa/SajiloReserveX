---
task: feature-selector-env-limits
timestamp_utc: 2025-11-12T17:58:36Z
owner: github:@codex-ai
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Verification Report

## Manual QA — Chrome DevTools (MCP)

- Not applicable: no UI or browser-facing changes were made. Environment variables only impact backend heuristics, so DevTools validation was not required per policy exception for non-UI work.

## Test Outcomes

- [x] `pnpm run build` — confirms both `scripts/validate-env.ts` and Next.js runtime env validation pass with the tightened selector limits and adjacency requirement.

## Notes

- Updated `.env.local` values: `FEATURE_SELECTOR_MAX_PLANS_PER_SLACK=200`, `FEATURE_SELECTOR_MAX_COMBINATION_EVALUATIONS=2000`, `FEATURE_SELECTOR_ENUMERATION_TIMEOUT_MS=5000`, and `FEATURE_ALLOCATOR_REQUIRE_ADJACENCY=true` (with merges still enabled) to keep the search space bounded.
- Build now finishes without runtime env schema errors or allocator safety warnings.

## Artifacts

- No new artifacts were necessary for this backend-only change.
