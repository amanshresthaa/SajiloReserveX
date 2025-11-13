---
task: planner-config-tuning
timestamp_utc: 2025-11-12T17:38:00Z
owner: github:@codex-bot
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Planner Config Performance Tuning

## Objective

We will tune selector and auto-assign env defaults so booking auto-assignment finishes faster under load while keeping adjacency safeguards for larger parties.

## Success Criteria

- [ ] `.env.local` contains the fast-profile limits/flags described in the research summary.
- [ ] Combination planner stops after ≤200 evaluations or 500 ms and keeps ≤10 plans per slack bucket.
- [ ] Lookahead analysis stays disabled for local/staging to remove extra passes.
- [ ] Auto-assign job retries no more than twice with short delays and inline timeouts capped at 5 seconds.

## Architecture & Components

- `.env.local`: single source of truth for local/staging config overrides.
- `config/env.schema.ts`: validates new env values at runtime; no schema updates required.

## Data Flow & API Contracts

- Env loader reads `.env.local`; selector + allocator modules consume `env` object for planner limits and lookahead toggles.
- Auto-assign job (`server/jobs/auto-assign.ts`) pulls retry limits and delays from env overrides.

## UI/UX States

- N/A (config-only change); indirect impact is faster loading/resolution for booking flows.

## Edge Cases

- Parties needing >3 tables may fail; we already cap `FEATURE_ALLOCATOR_K_MAX=3` and will document trade-offs.
- With lookahead disabled, future conflicts may increase; operators must rely on manual judgement.

## Testing Strategy

- Sanity-check `pnpm run lint` or bootstrap? (Not necessary for env edit.)
- Manual config validation by running `pnpm ts-node scripts/agents-policy-trace.ts ...`? (N/A.)
- Self-review `.env.local` to ensure syntax is valid and values fall within schema bounds.

## Rollout

- Applies to local/staging; prod env should only adopt after monitoring results.
- No feature flags toggled at runtime besides env values already consumed.

## DB Change Plan (if applicable)

- Not applicable.
