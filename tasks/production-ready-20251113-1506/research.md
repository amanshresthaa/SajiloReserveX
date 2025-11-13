---
task: production-ready
timestamp_utc: 2025-11-13T15:06:00Z
owner: github:@codex-ai
reviewers: [github:@amankumarshrestha]
risk: medium
flags: []
related_tickets: []
---

# Research: Production Readiness & Env Snapshot

## Requirements

- Functional: ensure the repo builds cleanly for production and document the exact commands + outputs so we can gate release with confidence.
- Functional: guarantee local env knowledge is preserved by syncing `.env.local` keys into a committed example without exposing secrets.
- Non-functional: keep security posture (no secrets in git), align with SDLC artifacts, and avoid mutating runtime behaviour just for documentation.

## Existing Patterns & Reuse

- `scripts/validate-env.ts` already checks presence of ~110 env vars before every build/dev run.
- `.env.example` and `.env.local.example` exist but lag actual `.env.local` keys and currently mix placeholder + real values.
- No automation exists to regenerate the example file when `.env.local` changes.

## External Resources

- [Next.js production build (`pnpm run build`)](https://nextjs.org/docs/pages/building-your-application/deploying) — ensures app compiles with Turbopack + TypeScript.
- Internal `.env` policy in `/AGENTS.md` — forbids storing secrets yet mandates env documentation.

## Constraints & Risks

- `.env.local` contains real Supabase / Resend secrets; copying raw values into git would violate policy and leak credentials.
- Missing env keys in example files can block new contributors and complicate future production deployments.
- Build/verifications must not mutate data in Supabase prod; use existing stubs only.

## Open Questions (owner, due)

- Q: Is there appetite for committing encrypted env backups? A: Not requested; stick to plain-text placeholders + documentation to stay compliant.

## Recommended Direction (with rationale)

1. Automate generation of `.env.local.example` from `.env.local` by copying keys and stripping values. This keeps the example in sync without leaking secrets and satisfies "keep a copy" intent.
2. Document production readiness by re-running `pnpm run build` and capturing the log in `tasks/.../artifacts/build.log`. Optionally include lint/test status if time permits.
3. Note commands + outcomes in `verification.md` so release managers see evidence without re-running everything.
