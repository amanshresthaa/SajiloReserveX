# Research: Design Flaws (Modularity, Cache, Async I/O)

## Requirements

- Functional:
  - Preserve existing behavior and public APIs.
  - Avoid blocking the event loop for demand profile fallback config.
  - Improve cache consistency across instances without forcing async callsites.
  - Start isolating time-window utilities out of monolithic `tables.ts`.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Event loop friendliness (no `readFileSync` in hot paths).
  - Distributed cache invalidation with optional Redis/Upstash.
  - Minimal change risk; maintain tests and typecheck.

## Existing Patterns & Reuse

- `server/capacity/demand-profiles.ts` already exposes async `resolveDemandMultiplier`, so making fallback load async is feasible.
- `server/capacity/cache.ts` exposes synchronous cache getters/setters; swap-in of fully async backend would break call sites.
- `server/capacity/tables.ts` defines `windowsOverlap` and helpers locally; can be extracted into a small module and re-exported.

## External Resources

- Upstash Redis client (`@upstash/redis`) is already a dependency; supports REST, serverless-friendly.
- Node `fs/promises` for async file I/O.

## Constraints & Risks

- Changing cache API to async would ripple across many files → avoid.
- Starting a background poller for distributed invalidation must be safe and low overhead.
- DST/time utilities extraction must avoid circular deps; only extract self-contained helpers.

## Open Questions (owner, due)

- Do we want strong consistency cache semantics cross-instance? (Owner: Eng; Due: post-merge)
- Should fallback config be hot-reloadable? (Currently memoized once.)

## Recommended Direction (with rationale)

- Replace sync `readFileSync` with async `fs.promises.readFile`; memoize prepared profiles and expose async path only internally.
- Add optional Upstash-backed distributed invalidation: keep local Maps; on set/invalidate bump a Redis version key; background poller invalidates local entries when remote versions change. Preserves sync API while improving cross-instance consistency.
- Extract `windowsOverlap` + helpers into `server/capacity/time-windows.ts`; re-export from `tables.ts` to keep API.
