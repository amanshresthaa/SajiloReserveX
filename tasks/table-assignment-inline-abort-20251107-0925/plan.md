# Implementation Plan: Table Assignment Inline Abort

## Objective

Ensure inline auto-assignment during booking creation can finish instead of being cut off by an unrealistically low timeout.

## Success Criteria

- [ ] Inline timeout is configurable and defaults to a value (> 4 s) that matches current Supabase latency.
- [ ] API logs include per-phase (quote + confirm) timings and attempt IDs for observability.
- [ ] Lint passes; no regressions in booking POST flow.

## Architecture & Components

- `src/app/api/bookings/route.ts`: replace hard-coded `inlineTimeoutMs = 4000` with a helper that reads `env.featureFlags` / config.
- `env` config: add optional `bookingInlineAutoAssignTimeoutMs` (fallback 12000 ms) so ops can dial without redeploy.
- `recordObservabilityEvent` invocation + console logs: capture quote + confirm durations, attempt IDs, alternates, and failure reasons to pinpoint bottlenecks.

## Data Flow & API Contracts

- No externally visible API changes; response payload still identical. Only internal timing + logging adjustments.

## UI/UX States

- Unchanged; inline success still flips status to confirmed before response when it finishes in time.

## Edge Cases

- Invalid/negative timeout values in env should fall back to sane defaults.
- Ensure background auto-assign still runs even if inline finishes earlier.

## Testing Strategy

- Lint (`pnpm lint`).
- Smoke run `pnpm test --filter "booking"` unnecessary? focus on lint per instructions; rely on TypeScript to catch config typos.

## Rollout

- Feature flag/backstop: expose config via `env.featureFlags.inlineAutoAssignTimeoutMs` so Production can tune quickly w/o code change.
- Monitoring: rely on new observability event field and `[bookings][POST][inline-auto-assign] durationMs` log.
