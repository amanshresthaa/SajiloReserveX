---
task: planner-config-tuning
timestamp_utc: 2025-11-12T17:38:00Z
owner: github:@codex-bot
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Research: Planner Config Performance Tuning

## Requirements

- Functional:
  - Lower allocator + selector latency for bookings by constraining combination search and retries.
  - Keep automatic table assignment enabled but ensure slow paths short-circuit instead of retrying indefinitely.
- Non-functional (a11y, perf, security, privacy, i18n):
  - No code changes; rely on env/config toggles per `config/env.schema.ts` for traceability.
  - Preserve adjacency safety and avoid exposing secrets in version control.

## Existing Patterns & Reuse

- `config/env.schema.ts` already validates all selector + allocator knobs (`FEATURE_SELECTOR_*`, `FEATURE_ALLOCATOR_*`, etc.).
- `.env.local` drives local/staging defaults and already defines combination planner flags plus auto-assign toggles.
- Server-side selectors (`server/capacity/selector.ts`, `server/capacity/table-assignment/quote.ts`) consume the `env` helper so updating `.env.local` is sufficient.

## External Resources

- Internal guidance (provided summary) outlining "fast profile" recommendations for combination planner, lookahead, and auto-assign job behavior.

## Constraints & Risks

- Tight limits can reduce successful assignments for very large parties or degrade fairness over time.
- Need to keep adjacency enforcement for operations; only relax evaluation limits and min party sizes.
- Secrets already in `.env.local`; avoid modifying unrelated keys.

## Open Questions (owner, due)

- Q: Do we eventually want separate staging vs. prod configs for these fast-profile values? (owner: ops, due: later)

## Recommended Direction (with rationale)

- Adopt the recommended "fast profile" for local/staging by updating `.env.local`:
  - Bound DFS search (`FEATURE_SELECTOR_MAX_PLANS_PER_SLACK=10`, `FEATURE_SELECTOR_MAX_COMBINATION_EVALUATIONS=200`, `FEATURE_SELECTOR_ENUMERATION_TIMEOUT_MS=500`).
  - Disable lookahead (`FEATURE_SELECTOR_LOOKAHEAD=false`) to avoid extra passes.
  - Require adjacency only for parties ≥6 via `FEATURE_ALLOCATOR_ADJACENCY_MIN_PARTY_SIZE=6` while keeping adjacency enforcement on.
  - Tame auto-assign retries and inline waits (`FEATURE_AUTO_ASSIGN_MAX_RETRIES=2`, `FEATURE_AUTO_ASSIGN_RETRY_DELAYS_MS="2000,5000"`, `FEATURE_INLINE_AUTO_ASSIGN_TIMEOUT_MS=5000`).
- Keep documentation/comments near the env vars to explain trade-offs for future tuning.
