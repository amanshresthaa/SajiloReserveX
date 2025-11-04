# Implementation Checklist

## LRU Utility

- [x] Add generic `LruCache<T>` with TTL, max size, scavenger

## cache.ts

- [x] Replace Maps with `LruCache`
- [x] Add env knobs for sizes and scavenger interval
- [x] Ensure poller iterates keys and invalidates correctly

## demand-profiles.ts

- [x] Replace Map with `LruCache`
- [x] Adjust get/set to store plain results (no manual TTL)
- [x] Keep clear APIs

## Verification

- [x] Typecheck green
- [ ] Optional: micro-test that LRU evicts oldest when exceeding max
