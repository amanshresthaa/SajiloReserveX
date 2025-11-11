# Implementation Plan: Enforce Distributed Rate Limiting

## Objective

Abort any production process that lacks Upstash credentials and expose meaningful errors when the Redis-backed limiter cannot initialize, eliminating the insecure in-memory fallback.

## Success Criteria

- [ ] `server/security/rate-limit.ts` refuses to serve in production without Upstash config (throws a descriptive error).
- [ ] Memory fallback remains available only for non-production environments with explicit bypass.
- [ ] Callers of `consumeRateLimit` receive actionable errors when limiter is misconfigured.
- [ ] `pnpm lint` continues to pass.

## Architecture

- Introduce a dedicated `RateLimitConfigurationError` to signal misconfiguration.
- Modify `getRedisClient()` to throw when creds missing in production; for dev/test it still logs warning and uses memory store if allowed.
- Update `memoryStoreRateLimit` and `consumeRateLimit` to assert they are not used in production.

## Testing Strategy

- Static assurance via lint + typecheck (lint is repo requirement).
- Manual reasoning: simulate scenarios by toggling `process.env.NODE_ENV` or env flags (documented for reviewers).

## Rollout

- No feature flags; code will fail fast if production config incomplete.
- Deployment teams must set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` before rollout.
