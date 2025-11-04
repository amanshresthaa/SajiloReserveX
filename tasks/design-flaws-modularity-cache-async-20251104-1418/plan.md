# Implementation Plan: Design Flaws (Modularity, Cache, Async I/O)

## Objective

We will reduce tech debt and improve runtime behavior by making fallback config I/O non-blocking, adding distributed cache invalidation using Upstash Redis (optional), and extracting time-window utilities from the monolithic tables module without breaking public APIs.

## Success Criteria

- [ ] No sync filesystem reads remain in demand profile fallback path.
- [ ] Local caches stay consistent across instances within ~10s when Redis is configured.
- [ ] `windowsOverlap` logic unchanged, re-exported from `tables.ts`.
- [ ] Typecheck and existing tests pass.

## Architecture & Components

- `server/capacity/demand-profiles.ts`
  - Replace `readFileSync` with async loader; memoize prepared profiles via a Promise guard.
- `server/capacity/cache.ts`
  - Keep sync Map API; on set/invalidate, bump a Redis version key.
  - Background poller (if Redis configured) invalidates local keys when version changes.
- `server/capacity/time-windows.ts`
  - New module hosts `IntervalLike`, normalization helpers, and `windowsOverlap`.
  - `server/capacity/tables.ts` re-exports `windowsOverlap`.

## UI/UX States

N/A (server-side behavior only).

## Edge Cases

- Redis disabled: cache functions operate exactly as before.
- Multiple instances: eventual consistency via poller.
- DST/timezone: no behavior change; logic copied intact.

## Testing Strategy

- Rely on existing windowsOverlap unit/property/DST tests.
- Run ops tests; ensure no regressions (ack pre-existing unrelated failures noted).

## Rollout

- No flags required. If Redis is configured via `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, distributed invalidation activates automatically.
