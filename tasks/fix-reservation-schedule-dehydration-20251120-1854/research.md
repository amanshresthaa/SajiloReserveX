---
task: fix-reservation-schedule-dehydration
timestamp_utc: 2025-11-20T18:54:00Z
owner: github:@assistant
reviewers: [github:@assistant]
risk: medium
flags: []
related_tickets: []
---

# Research: Fix reservation schedule dehydration error

## Requirements

- Functional: Stop the repeated console error `A query that was dehydrated as pending ended up rejecting` for reservation schedules (e.g., `["reservations","schedule","white-horse-pub-waterbeach","2025-11-21"]`). Keep reservation scheduling usable without regressions.
- Non-functional (a11y, perf, security, privacy, i18n): Reduce noisy console output in dev, keep query cache persistence safe and predictable; no sensitive data in logs; keep client-side performance reasonable (no excessive re-fetch loops).

## Existing Patterns & Reuse

- Query persistence is centralized in `lib/query/persist.ts` via `configureQueryPersistence`, which uses `persistQueryClient` with a `shouldDehydrateQuery` guard and a `dropPendingQueries` sanitizer. Persistence is enabled in `src/app/providers.tsx` (global app client) and `components/reserve/booking-flow/index.tsx` (wizard embedding) with localStorage keys.
- Reservation schedule data is fetched through `reserve/features/reservations/wizard/services/schedule.ts` and consumed by hooks/components like `useTimeSlots` and `usePlanStepForm`, which rely on TanStack Query. `ScheduleAwareTimestampPicker` already marks its `fetchQuery` calls with `meta: { persist: false }`, but `useTimeSlots` and plan-step prefetches currently do not.
- Tests exist for persistence behaviour in `tests/server/query/persist.test.ts`.

## External Resources

- [TanStack Query SSR guide – avoid dehydrating pending queries](https://tanstack.com/query/latest/docs/framework/react/guides/ssr#avoid-dehydrating-pending-queries) — explains why persisting/hydrating in-flight queries causes the exact warning we see.

## Constraints & Risks

- Persistence is shared across the app; over-aggressive filtering could remove useful cached data. We need to skip only unsafe entries (e.g., in-flight, non-idle, or explicitly transient).
- Schedule queries are high-churn (prefetches per day/month). Persists of these queries can pile up and, if saved while pending, trigger the warning on next hydration.
- Changing persistence rules must keep existing tests green; risk of breaking cached experiences if we drop too much.

## Open Questions (owner, due)

- Q: Should any non-schedule queries remain persisted when in error state, or should persistence be restricted to settled successes only? (Owner: assistant, due before implementation)

## Recommended Direction (with rationale)

- Harden persistence sanitization to drop any non-idle or pending queries during restore and to refuse persisting them during dehydration; this directly targets the warning source and reduces noisy cache states.
- Mark reservation schedule queries (useTimeSlots + plan-step prefetch) as `meta.persist = false` so they are never written to the persisted cache; these are cheap to refetch and prone to being mid-flight when persistence runs.
- Extend persistence tests to cover the new filtering rules (non-idle/pending removal and meta-based skipping) to lock behaviour.
