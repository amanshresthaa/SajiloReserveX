---
task: ops-magic-link-dev
timestamp_utc: 2025-11-15T13:41:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Research: Ops magic-link failures in local dev

## Requirements

- Functional: ensure ops authentication can use Supabase magic links while running `next dev` locally.
- Non-functional: keep auth redirect host deterministic to avoid Supabase allowlist drift; provide clear guardrails so developers do not accidentally run on a non-allowed port.

## Existing Patterns & Reuse

- `scripts/validate-env.ts` already runs before dev/build; can piggyback on this hook.
- `run-dev.sh` exports `PORT=3000`, establishing the canonical dev port.

## External Resources

- Supabase auth docs on [Redirect URLs](https://supabase.com/docs/guides/auth/auth-email-otp#redirect-urls) — Supabase rejects magic-link requests if the callback URL origin is not in the allowlist. Explains the `AuthApiError` we observed when `next dev` hopped to port 3001.

## Constraints & Risks

- Supabase project only allows `http://localhost:3000`; any automatic port change will break login.
- Need to avoid flaky dev experience—surface a fast failure instead of silently switching ports.

## Open Questions (owner, due)

- None; root cause understood.

## Recommended Direction (with rationale)

- Introduce a lightweight port guard script that runs before `next dev`. If port 3000 (or configured `PORT`) is busy, exit with an actionable error so engineers free the port instead of running on 3001.
- Document the guard so developers know why the dev server refuses to start when the port is occupied.
