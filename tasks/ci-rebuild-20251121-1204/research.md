---
task: ci-rebuild
timestamp_utc: 2025-11-21T12:05:03Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: high
flags: []
related_tickets: []
---

# Research: CI rebuild

## Requirements

- Functional:
  - Remove existing CI workflows and replace with a fresh pipeline that covers linting, type checks, tests, builds, and basic security/secret scanning.
  - Keep compatibility with pnpm and Node.js 20.11.x as defined in package engines.
  - Preserve Playwright/mobile smoke coverage if feasible without heavy flakiness.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Jobs should cache pnpm dependencies to keep runtimes reasonable.
  - Secret scanning must remain (secrets prohibition in AGENTS.md).
  - Avoid touching remote Supabase databases; no migrations in CI.

## Existing Patterns & Reuse

- Current workflows: `.github/workflows/ci.yml` (lint → typecheck → vitest → Next build → reserve build → Playwright mobile smoke) and `secret-scanning.yml` (gitleaks + trufflehog).
- Project uses pnpm (lockfile present) and requires Node.js `20.11.1+` per `package.json`.
- Scripts available: `pnpm lint`, `pnpm typecheck`, `pnpm test` (reserve vitest suite), `pnpm test:ops` (server vitest), `pnpm build`, `pnpm reserve:build`, Playwright suites (`test:e2e`, `test:e2e:smoke`, `test:component`).
- Engine constraints, patched dependencies via pnpm, and Playwright-managed browsers.

## External Resources

- GitHub Actions standard caching for pnpm (`actions/setup-node` cache=pnpm).
- Playwright GitHub Action for dependencies if needed.

## Constraints & Risks

- Broad pipeline may be slow; need to sequence/cross jobs to keep PR latency manageable.
- E2E tests can be flaky; may need smoke-only surface with retry to maintain signal.
- Must keep secret scanning to satisfy security baseline; ensure summaries remain.
- Do not commit any secrets; ensure workflows avoid leaking env values.

## Open Questions (owner, due)

- Should E2E run on every PR or only smoke subset? (owner: eng lead, due: before merge)
- Are infra deploy checks needed (e.g., docker build)? (owner: eng lead, due: before merge)

## Recommended Direction (with rationale)

- Replace existing workflows with a clearer split: (1) `ci` for quality gates (lint, typecheck, vitest, Next + reserve builds); (2) `e2e-smoke` for Playwright smoke on built app; (3) `secret-scanning` to keep gitleaks/trufflehog with summaries; (4) `agent-guard` to enforce AGENTS policy script if present.
- Use a reusable `setup` job with pnpm + Node 20 cache; share via `actions/cache` for `~/.cache/pnpm` if needed.
- Keep Playwright browsers install scoped to e2e job to reduce runtime for other jobs.
- Add minimal concurrency controls (cancel in-progress for PRs) to reduce queue times.
