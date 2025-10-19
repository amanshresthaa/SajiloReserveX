# Security & Infrastructure Notes

## Rate Limiter (`server/security/rate-limit.ts`)

### Purpose

Provide reusable rate-limiting primitive backed by Upstash Redis with safe in-memory fallback for local/dev environments.

### Dependencies

- `@upstash/redis` client.
- Environment loader `env.cache.upstash`.

### API

- `consumeRateLimit({ identifier, limit, windowMs }): Promise<RateLimitResult>`
- Internal helpers: `getRedisClient`, `useMemoryStore`.

### Implementation Details

1. **Client Resolution**: Lazily instantiates Redis client using Upstash credentials; warns once per process if missing.
2. **Redis Path**:
   - Uses fixed window keyed by `rl:${identifier}:${windowStart}`.
   - `INCR`s counter and sets TTL on first hit via `PEXPIRE`.
   - Calculates remaining tokens and returns `source: "redis"`.
3. **Fallback Path**:
   - Per-process `Map<string, MemoryBucket>` storing count/resetAt.
   - Logs warning that multi-instance safety requires Redis.
4. **Error Handling**:
   - Catches Redis pipeline errors and falls back to memory.
   - Logs failures to aid debugging.

### Edge Cases

- Production without Upstash logs only once (to avoid noise).
- In-memory fallback does not evict identifiers; long-running processes may accumulate entries.

### Performance Notes

- Redis TTL ensures rolling clean-up.
- Memory fallback safe for local testing; not suitable for multi-instance scaling without eviction.

### Testing Coverage

- No direct unit tests; exercised via API booking routes.
- Recommendation: add unit tests mocking Redis failures and verifying fallback semantics.

### Improvement Ideas

1. Add LRU eviction or periodic sweep to memory store.
2. Support sliding window or token bucket variations.
3. Surface structured logs/emitter for observability integration.

### Code Reference

```ts
const redisKey = `rl:${params.identifier}:${windowStart}`;
const countResult = await redis.incr(redisKey);
if (count === 1) {
  await redis.pexpire(redisKey, params.windowMs);
}
return {
  ok: count <= params.limit,
  limit: params.limit,
  remaining: Math.max(0, params.limit - count),
  resetAt,
  source: 'redis',
};
```
