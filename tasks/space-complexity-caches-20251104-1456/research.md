# Research: Space Complexity — Cache Bounding (LRU + Scavenger)

## Requirements

- Bound memory usage for in-process caches in `server/capacity/cache.ts` and `server/capacity/demand-profiles.ts`.
- Maintain existing public API and behavior (TTL semantics, distributed invalidation), but add a maximum size and proactive cleanup.

## Existing Patterns & Reuse

- `cache.ts` uses in-memory Maps with TTL checked on get, plus optional Upstash Redis-based version invalidation.
- `demand-profiles.ts` caches demand multiplier decisions with TTL in a Map.

## Constraints & Risks

- Must not introduce blocking operations; cleanup should be background and light.
- Keep deterministic behavior; do not change selection outcomes due to cache policy.
- Cross-process invalidation remains eventual (poller), not strong consistency.

## Options Considered

- LRU with TTL per entry and a max-capacity — chosen for simplicity and predictable memory bound.
- Periodic scavenger to remove expired entries even if never read — added to avoid stale accumulation.
- External cache (Redis) for values — out of scope; we already use Redis for versions only.

## Decision

- Implement a small `LruCache<T>` utility with TTL, max size, promotion on get, FIFO eviction for least-recently-used.
- Add background scavenger (`startScavenger`) called by modules with sensible defaults and env overrides.

## Env knobs

- `CAPACITY_CACHE_MAX_INV` (default 512)
- `CAPACITY_CACHE_MAX_ADJ` (default 512)
- `CAPACITY_CACHE_SCAVENGE_MS` (default 60000)
- `DEMAND_CACHE_MAX_ENTRIES` (default 8192)
- `DEMAND_CACHE_SCAVENGE_MS` (default 60000)
