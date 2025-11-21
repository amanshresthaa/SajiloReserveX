---
task: production-hardening-sprint-2
timestamp_utc: 2025-11-21T18:39:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: high
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [ ] Confirm list of secrets/providers needing rotation; coordinate downtime window.
- [ ] Update `.env.example` and docs with new markers/vars after rotation.

## Core

- [ ] Rotate Supabase keys/passwords, Resend API key, and any other referenced secrets; update hosting + CI + env guards.
- [ ] Scrub repository history for leaked secrets (filter-repo/BFG) and document force-pull instructions.
- [ ] Harden CI secret scanning/audit jobs using official actions and configs.
- [ ] Expand ESLint coverage, fix high-severity findings, and integrate with CI + lint-staged.
- [ ] Broaden Vitest coverage (env validator, logger, Supabase checks) and wire `pnpm test` to run suites.
- [ ] Introduce structured logger (`lib/logger.ts`) and replace prioritized `console.log` usages.
- [ ] Clean committed artifacts and harden `.gitignore`.
- [ ] Implement Supabase self-check logging guard + environment controls.
- [ ] Add migration drift detection script + CI job + docs.

## UI/UX

- [ ] N/A (backend/devops-focused sprint); ensure docs updated for env/test/CI flows.

## Tests

- [ ] Unit tests (logger, env validator, Supabase self-check).
- [ ] Integration (lint/test/build) run locally + CI.
- [ ] CI secret scan + audit failure path verified.
- [ ] Drift detection simulated failure path documented.

## Notes

- Assumptions:
  - Providers allow immediate secret rotation without downtime.
  - Git history rewrite is acceptable to the team (communication plan required).
- Deviations:
  - Any tasks descoped or postponed will be documented here before completion.

## Batched Questions

- Pending answers recorded in `research.md`.
