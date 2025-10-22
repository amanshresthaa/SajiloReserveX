# Implementation Plan: Rate Limiter Warning in Dev Server

## Objective

Allow local development to run without rate limiter noise or throttling while keeping protections in place for test/production.

## Success Criteria

- [ ] Development builds skip rate limiting entirely and no longer emit `[rate-limit]` warnings when Upstash credentials are unset.
- [ ] Test/production behaviour of `consumeRateLimit` remains unchanged (unit tests still pass).

## Architecture & Components

- `server/security/rate-limit.ts`: introduce a `shouldBypassRateLimit` guard (enabled when `env.node.env === 'development'` unless explicitly overridden) that returns a no-op result and suppresses warnings.
- Reuse `env.node.env` and a simple boolean parser for opt-in override (`ENABLE_RATE_LIMIT_IN_DEV=true` keeps current behaviour when desired).
- Update `docs/deployment/rate-limiter.md` to explain the new development bypass and override flag.

## Data Flow & API Contracts

- APIs continue calling `consumeRateLimit`; when bypassed it resolves to `{ ok: true, source: 'none' }`, so no route changes needed.

## UI/UX States

- No UI impact; warnings disappear from the dev console.

## Edge Cases

- Ensure the bypass still increments `resetAt` sensibly for callers relying on header values.
- Confirm memory-store fallback warnings continue running for non-dev environments.

## Testing Strategy

- Unit: leverage existing `tests/server/security/rate-limit.test.ts`; run to confirm no regressions.
- Manual: start dev server to verify warnings gone (documented in verification checklist).

## Rollout

- Feature flag: `ENABLE_RATE_LIMIT_IN_DEV` (defaults off).
- Monitoring: none required beyond standard API observability.
