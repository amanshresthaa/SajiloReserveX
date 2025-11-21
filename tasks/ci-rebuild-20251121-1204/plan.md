---
task: ci-rebuild
timestamp_utc: 2025-11-21T12:05:03Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: high
flags: []
related_tickets: []
---

# Implementation Plan: CI rebuild

## Objective

Rebuild the repository CI from scratch with clear, maintainable workflows that gate PRs on linting, type safety, tests, builds, secret scanning, and lightweight E2E smoke coverage.

## Success Criteria

- [ ] Old workflows are removed; new workflows are added and wired to `push`/`pull_request` on main branches.
- [ ] Core CI runs `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm reserve:build` using cached installs (note: `pnpm test:ops` excluded for now due to failing baseline; follow-up needed).
- [ ] Playwright smoke suite runs against a started production build with placeholder env vars set.
- [ ] Secret scanning runs (gitleaks + trufflehog) with a summarized report.
- [ ] AGENTS policy check is enforced in CI (if script present).

## Architecture & Components

- Workflow: `.github/workflows/ci.yml` — main pipeline with jobs:
  - `setup` composite pattern per job: checkout → pnpm setup → Node 20.11 → install deps (frozen lock) with pnpm cache.
  - `lint_typecheck`: runs `pnpm lint` then `pnpm typecheck`.
  - `unit_tests`: runs `pnpm test` and `pnpm test:ops` (serial within job to reuse install).
  - `build`: runs `pnpm build` and `pnpm reserve:build`; uses placeholder Supabase env vars to satisfy validation.
- Workflow: `.github/workflows/e2e-smoke.yml` — builds app (reuse install) → start Next server → run `pnpm test:e2e:smoke` with `BASE_URL` and Playwright browsers installed; ensures teardown.
- Workflow: `.github/workflows/secret-scanning.yml` — runs gitleaks + trufflehog, summarizes outcomes.
- Workflow: `.github/workflows/agents-guard.yml` — runs `node scripts/check-agents-compliance.cjs` to enforce policy.
- Shared choices:
  - Concurrency group `${{ github.workflow }}-${{ github.ref }}` with `cancel-in-progress: true` for PRs to reduce queue time.
  - Cache restores via `actions/setup-node@v4` `cache: pnpm`.
  - Default env: `NEXT_TELEMETRY_DISABLED=1`, `PLAYWRIGHT_BROWSERS_PATH=0`, Supabase placeholders for build/e2e jobs.

## Data Flow & API Contracts

- CI-only; no external API calls expected besides npm registry and Playwright downloads. All Supabase env values use safe placeholders to avoid remote access.

## UI/UX States

- N/A (CI infrastructure).

## Edge Cases

- Build fails if required env vars missing — provide non-secret placeholders at workflow env.
- Playwright server teardown must run on failure; guard with `if: always()` kill step.
- Ensure workflows target only main branch for push triggers to avoid unnecessary runs.

## Testing Strategy

- Local spot checks: run `pnpm lint`, `pnpm typecheck`, `pnpm test` to confirm baseline before push (time permitting).
- Post-change: rely on GitHub Actions runs for full matrix (unit, build, e2e smoke, secret scan, agents guard).

## Rollout

- Replace existing workflows in a single PR.
- No feature flags. Monitor first few runs to confirm durations and flakes; adjust retries/timeouts if needed.

## DB Change Plan (if applicable)

- N/A — no DB schema changes.
