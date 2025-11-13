---
task: feature-selector-env-limits
timestamp_utc: 2025-11-12T17:58:36Z
owner: github:@codex-ai
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Research: Feature Selector Env Limits

## Requirements

- Functional: ensure `FEATURE_SELECTOR_MAX_PLANS_PER_SLACK`, `FEATURE_SELECTOR_MAX_COMBINATION_EVALUATIONS`, and `FEATURE_SELECTOR_ENUMERATION_TIMEOUT_MS` values satisfy runtime validation so builds succeed.
- Non-functional: document alignment with policy, keep `.env.local` consistent with remote expectations, avoid introducing secrets or altering unrelated envs, and keep selector search bounds in a safe range so a single booking no longer stalls for 20–30 seconds.

## Existing Patterns & Reuse

- Use existing env validation schema defined in `scripts/validate-env.ts` and runtime server schema; no new code paths needed.
- `.env.local` already contains the necessary keys; only numerical values need to be capped.

## External Resources

- [Next.js Build Logs](internal) — show failure caused by oversized values; ensures we're targeting the right knobs.

## Constraints & Risks

- Incorrect edits to `.env.local` could impact developers relying on those values; we must stay within the documented upper bounds (500 / 5000 / 10000).
- Large selector limits combined with merges and no adjacency requirement blow up the search space, causing timeouts (observed `POST /api/bookings` ~30s and client 408 errors). We need conservative local defaults.
- Need to verify build succeeds after edits to avoid lingering runtime validation failures.

## Open Questions (owner, due)

- None at this time.

## Recommended Direction (with rationale)

- Update the three env entries in `.env.local` to stay within the validator caps and tighten them for dev (`200`, `2000`, `5000`) so the selector exits sooner while still exercising the feature. Require adjacency when merges are enabled to align with allocator safety logs and reduce permutations. This remains minimal, reversible, and keeps the rest of the environment intact.
