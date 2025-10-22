# Research: Rate Limiter Warning in Dev Server

## Existing Patterns & Reuse

- `server/security/rate-limit.ts` provides shared rate limiting for public APIs, preferring Upstash Redis but falling back to an in-memory store when credentials are absent. In dev mode it logs warnings the user is seeing.
- Multiple API handlers (`src/app/api/bookings/route.ts`, `src/app/api/availability/route.ts`, `src/app/api/ops/bookings/route.ts`, etc.) call `consumeRateLimit` to throttle requests.
- Environment configuration (`lib/env.ts`) exposes `env.cache.upstash.{restUrl,restToken}`; when undefined they trigger the fallback warning.

## External Resources

- `docs/deployment/rate-limiter.md` documents why Upstash-backed rate limiting exists and the intended fallback behaviour.

## Constraints & Risks

- Removing rate limiting entirely could expose the public booking endpoints to brute-force or accidental flood traffic; would be safer to scope the change to local/development only.
- Several server tests mock the rate limiter. Removing or stubbing needs to preserve test behaviour.
- The dev warning is emitted intentionally to remind developers to provide credentials; eliminating it might hide configuration issues in staging.

## Open Questions (and answers if resolved)

- Q: Does product require rate limiting in production?  
  A: Docs emphasise Upstash for multi-instance safety, so production expects it. We should avoid removing for non-dev environments unless explicitly requested.

## Recommended Direction (with rationale)

- Keep rate limiting for production/test but disable both the limiter logic and warnings when running in local development (`NODE_ENV === 'development'`). Provide an opt-in override (e.g., `ENABLE_RATE_LIMIT_IN_DEV=true`) so engineers can still exercise the limiter locally if needed. This satisfies the user request (“remove them”) for dev sessions without compromising prod safeguards.
