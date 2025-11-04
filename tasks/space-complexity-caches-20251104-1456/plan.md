# Implementation Plan: Cache Space Bounding

## Objective

Add bounded LRU caches with TTL and proactive scavenging to prevent unbounded memory growth while preserving existing cache APIs and behavior.

## Success Criteria

- [ ] `cache.ts` uses LRU with max size and scavenger; APIs unchanged.
- [ ] `demand-profiles.ts` uses LRU with max size and scavenger; APIs unchanged.
- [ ] Typecheck passes; behavior verified with simple runs.

## Architecture & Components

- New `server/capacity/lru-cache.ts`: generic LRU with TTL and scavenger.
- `server/capacity/cache.ts`: swap Maps for `LruCache`, add env knobs.
- `server/capacity/demand-profiles.ts`: swap Map for `LruCache`, adjust get/set code.

## Testing Strategy

- Unit-lite: sanity via typecheck and spot checks; add diagnostics via env scanning later if needed.
- Manual: simulate many unique keys and observe LRU eviction (optional follow-up test).

## Rollout

- Safe defaults; env overrides documented in research.
- Revert path: switch back to Map (not expected to be needed).
