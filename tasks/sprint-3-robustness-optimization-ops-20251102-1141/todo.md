# Implementation Checklist

## Setup

- [ ] DB migration: `capacity_outbox` with indexes and dedupe key
- [ ] Env + feature flags for holds rate limits and min TTL

## Core

- [ ] Outbox producer in `synchronizeAssignments` and hold confirm path
- [ ] Worker: process, retry with backoff, mark done/dead
- [ ] Cache: inventory + adjacency with TTL and invalidation functions
- [ ] Hold rate limit + min TTL checks in `createTableHold`

## UI/UX

- [ ] Confirm existing Realtime subscriptions cover context invalidation (docs)

## Tests

- [ ] Unit: cache + backoff
- [ ] Integration: outbox enqueue and process (mocked)
- [ ] Security: cross-tenant negative (mocked)

## Notes

- Assumptions:
  - Realtime already wired for ops context refetch.
  - Outbox handlers primarily dispatch telemetry and observability events.
- Deviations:
  - Direct telemetry calls in hot paths replaced by outbox enqueue to increase resilience.

## Batched Questions (if any)

- None
