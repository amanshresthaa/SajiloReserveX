---
task: production-hardening-sprint-2
timestamp_utc: 2025-11-21T18:39:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: high
flags: []
related_tickets: []
---

# Implementation Plan: Production Hardening Sprint 2

## Objective

We will eliminate remaining post-incident risk by rotating all secrets, tightening CI security gates, expanding lint/tests, introducing structured logging, cleaning artifacts, stabilizing Supabase integration, and adding migration drift detection so the repo is safe even if cloned, and CI reliably blocks regressions.

## Success Criteria

- [ ] All provider secrets rotated, propagated, and validated; no real secrets remain in git history.
- [ ] CI secret scanning/audit jobs run reliably via official actions and fail on seeded leaks.
- [ ] `pnpm lint` and `pnpm test` cover core directories and pass locally/CI.
- [ ] Structured logger replaces `console.log` in targeted hot paths with PII-safe metadata.
- [ ] Git history free of artifacts; `.gitignore` prevents future additions; clean clone builds without dirty tree.
- [ ] Supabase self-check logs downgraded to non-error severity and broader test coverage added.
- [ ] New drift detection job runs in CI and fails when schema + migrations diverge.

## Architecture & Components

- `tasks/production-hardening-sprint-2-20251121-1839/` — task artifacts and evidence.
- `lib/env` + `scripts/validate-env.ts` — reused for config verification post-rotation.
- `lib/logger.ts` (new) — structured logging wrapper with level-based filtering, redaction helpers.
- `.github/workflows/ci.yml` — extend with official secret scan/audit installers and `db-drift-check` job.
- `scripts/security/secret-scan.sh` or inline steps — ensures stable scanning.
- `.gitignore` — ensure coverage for artifacts.
- `scripts/check-migration-drift.ts` (new) — uses Supabase CLI or `pnpm supabase db dump` to compare canonical schema.
- Tests under `tests/**` — add suites covering env validation, logger behavior, Supabase self-check gating.

## Data Flow & API Contracts

- Secret rotation: environment variables propagate from providers → hosting env → CI secrets → `.env.*.example`. `scripts/validate-env.ts` ensures APP_ENV/NODE_ENV alignment and rejects prod creds locally.
- Logger: modules import `logger` and call `logger.info('event', {meta})`. Logger serializes to console JSON respecting `LOG_LEVEL`. Optional `PII_KEYS` set to redact.
- Drift check: script dumps schema after migrations, compares text diff to `supabase/schema.snapshot.sql`. On mismatch, exit 1.

## UI/UX States

- N/A (this sprint is backend/devops oriented); any CLI prompts (e.g., `scripts/db/safe-run.ts`) remain unchanged aside from ensuring documentation references new variables.

## Edge Cases

- Secret rotation might accidentally break local dev if `.env.local` not updated; mitigated by updated `.env.example` and docs.
- CI secret scan may flag intentional test strings; provide allowlist config.
- Structured logger must not throw when metadata includes circular refs; enforce shallow cloning or `JSON.stringify` with replacer.
- Drift detection requires Supabase CLI credentials with read-only rights; ensure secrets available in CI but not logged.

## Testing Strategy

- Unit tests:
  - `scripts/validate-env.ts` (various APP_ENV/NODE_ENV combos, prod credential detection).
  - `lib/logger.ts` (level filtering, redaction, metadata handling).
  - Supabase self-check module (ensures warnings not thrown in test envs; guard respects env flag).
- Integration/smoke:
  - Run `pnpm lint`, `pnpm test`, `pnpm build`.
  - Manual verification of `scripts/db/*` guard still functioning.
- CI verification:
  - Seed fake secret string in branch to confirm secret scan fails.
  - Trigger drift check failure by modifying canonical schema before finalizing to ensure job works.

## Rollout

- Feature flags:
  - `LOG_LEVEL` (default `info`), `ENABLE_SUPABASE_SELF_CHECK` (only prod/staging).
- Exposure:
  1. Rotate secrets in staging, verify, then propagate to prod.
  2. Update CI secrets and merge when green.
- Monitoring:
  - Observe CI pipeline for new job durations/failures.
  - Cloud logs for structured logger output sanity.
- Kill-switch:
  - Revert logger import changes if issues arise (isolated modules).
  - Disable drift job temporarily by removing workflow step (documented) if blocking release; re-enable asap.

## DB Change Plan (if applicable)

- No schema changes planned; only drift detection. If Supabase CLI requires DB access, ensure read-only service role credentials stored securely. Capture drift outputs under `tasks/.../artifacts/db-drift.txt`.
