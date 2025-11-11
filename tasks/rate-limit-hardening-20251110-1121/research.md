# Research: Rate Limiter Hardening

## Requirements

- Functional:
  - Ensure Upstash-backed rate limiting is mandatory in production to prevent brute-force or abuse scenarios.
  - Preserve developer ergonomics locally (memory store + bypass when desired).
- Non-functional:
  - Fail fast when credentials are missing instead of silently downgrading security.
  - Provide actionable error messaging for operators.

## Existing Patterns & Reuse

- Rate limiting is centralized in `server/security/rate-limit.ts`; all API routes reuse `consumeRateLimit`.
- Current behavior logs warnings but falls back to in-memory or bypassed enforcement even in production, leaving multi-instance deployments unprotected.

## Constraints & Risks

- Middleware and API handlers rely on `consumeRateLimit` resolving (non-throwing). Introducing hard failures must include clear messaging.
- Need to avoid blocking non-production environments without Upstash credentials while still warning.

## Open Questions

- None; implementation straightforward once we gate on `env.node.env`.

## Recommended Direction

1. Track environment (`isProduction`) and new flag `requireRedisRateLimit`.
2. Whenever Redis credentials are missing in production, throw an error (fail-fast) instead of silently using memory store.
3. Guard `memoryStoreRateLimit` usage so it is never called in production unless an explicit override env (e.g., `ENABLE_RATE_LIMIT_IN_DEV=true`) is set.
4. Surface a custom error type so callers can distinguish configuration issues from quota exhaustion.
