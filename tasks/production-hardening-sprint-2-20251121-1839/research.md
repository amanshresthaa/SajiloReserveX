---
task: production-hardening-sprint-2
timestamp_utc: 2025-11-21T18:39:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: high
flags: []
related_tickets: []
---

# Research: Production Hardening Sprint 2

## Requirements

- Functional:
  - Rotate and propagate all leaked/at-risk secrets across providers (Supabase, Resend, any referenced third parties) and ensure repo + CI use the rotated values only.
  - Harden CI secret scanning/audit jobs so they run reliably on the default runners and fail on real issues.
  - Expand lint/test coverage (eslint + vitest) to core directories, preventing regressions.
  - Replace ad-hoc `console.log` usage in hot paths with structured logging.
  - Remove accidental artifacts (`node_modules`, `.next`, reports, archives) from git and tighten ignore rules.
  - Stabilize Supabase self-check logging and broaden automated tests.
  - Add migration drift detection to CI.
- Non-functional:
  - Maintain accessibility/perf guardrails from prior sprint.
  - Ensure safety scripts (env/db/test endpoints) continue to work after changes.
  - Avoid downtime when rotating secrets (staging-first, documented rollback).

## Existing Patterns & Reuse

- Task folder `tasks/production-hardening-20251121-1324/` documents the prior sprint; reuse the same env guard tooling (`lib/env`, `scripts/validate-env.ts`), DB guard (`scripts/db/safe-run.ts`), and CI workflow skeleton.
- CI already runs lint/typecheck/targeted tests/build plus `secret:scan`/`pnpm audit`; reuse workflow structure and simply extend jobs for drift detection and improved install steps.
- Vitest bootstrap lives at `tests/vitest.setup.ts`; extend this for new tests.
- Repo uses pnpm and Next.js; existing lint config/scripts can be extended rather than replaced.
- Logging centralization does not yet exist; we can add `lib/logger.ts` and gradually adopt (no conflicting system currently).

## External Resources

- [Supabase secret rotation docs](https://supabase.com/docs/guides/platform/rotate-passwords) — outlines key rotation steps and connection string updates.
- [Resend API key rotation](https://resend.com/docs/dashboard/api-keys) — necessary for email provider secret refresh.
- [Gitleaks Action](https://github.com/gitleaks/gitleaks-action) — reliable installation path for CI secret scanning.
- [TruffleHog GitHub Action](https://github.com/trufflesecurity/trufflehog) — alternative scanning option if dual scanning desired.

## Constraints & Risks

- History rewrite (filter-repo/BFG) is destructive; must coordinate with team to force-pull after removing historical secrets.
- Secret rotation spans multiple providers; the order must avoid downtime and ensure env propagation before invalidating old keys.
- CI runners have restricted permissions (no sudo); scanning installation must use official actions or precompiled binaries.
- Structured logging must avoid logging PII and should maintain performance characteristics (avoid JSON.stringify on large payloads).
- Migration drift detection requires Supabase CLI or pg_dump; may need network access or containerized DB for schema diff.
- Removing committed artifacts must avoid deleting intentional binary assets; need to confirm with maintainers.

## Open Questions (owner, due)

- Q: Are there additional third-party secrets beyond Supabase/Resend that need rotation? (owner: @maintainers, due: ASAP)
  A: Pending.
- Q: Do we have an existing canonical schema file for drift comparison or should we generate one (e.g., `schema.sql`)? (owner: @maintainers, due: before implementing PH2-07)
  A: Pending.
- Q: Preferred structured logging sink (console JSON vs. external service)? (owner: @maintainers, due: before PH2-04)
  A: Pending.

## Recommended Direction (with rationale)

- Sequence tasks by risk: (1) secret rotation/history cleanup, (2) CI hardening, (3) repo hygiene + lint/test/logging improvements, (4) Supabase drift/perf stretch.
- Use existing guard scripts and documentation to minimize new surface area.
- Adopt official GitHub Actions for gitleaks/trufflehog to avoid runner-specific installs.
- Introduce `lib/logger.ts` using a lightweight structured logger (e.g., pino or homegrown) to replace `console.log` in staged modules.
- For drift detection, rely on Supabase CLI schema dump diffed against a checked-in canonical file; run in CI with read-only credentials.
