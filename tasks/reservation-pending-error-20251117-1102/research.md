---
task: reservation-pending-error
timestamp_utc: 2025-11-17T11:02:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Research: Reservation schedule hydration error

## Requirements

- Functional: identify and resolve the console error when viewing reservations/schedule for venues (e.g., `white-horse-pub-waterbeach`) on date selections such as 2025-11-18 where React Query hydration rejects the fetch.
- Non-functional (a11y, perf, security, privacy, i18n): maintain existing UX/performance; no regression to booking data integrity; keep error surfaces accessible and non-flaky across dates.

## Existing Patterns & Reuse

- Reservation schedules are fetched via React Query (`scheduleQueryKey`) in `reserve/features/reservations/wizard/services/useTimeSlots.ts` and supporting booking UI (e.g., `ScheduleAwareTimestampPicker`).
- API endpoint `src/app/api/restaurants/[slug]/schedule/route.ts` pulls data from `getRestaurantSchedule` (Supabase-backed) and returns JSON with cache headers; no custom error handling in the client hooks.
- Query persistence is enabled globally through `configureQueryPersistence` (`src/app/providers.tsx`, `components/reserve/booking-flow/index.tsx`). Persistence excludes pending queries at **dehydrate** time but currently hydrates whatever is stored, meaning previously persisted pending states could still be restored and trigger React Query’s “dehydrated as pending ended up rejecting” warning.

## External Resources

- None yet.

## Constraints & Risks

- Hydration errors point to persisted or server-dehydrated pending queries later rejecting; could stem from stale cached state rather than current network failure.
- Underlying API errors (e.g., Supabase connectivity) could still occur; need to ensure failures are surfaced without noisy hydration warnings.
- Potential date/timezone edge cases that could affect schedule queries across dates.

## Open Questions (owner, due)

- Are specific venues or all venues affected? (owner: me; due: during analysis)
- Is the server returning non-200 or error payloads for these dates? (owner: me; due: during analysis)

## Recommended Direction (with rationale)

- Harden query persistence to drop/ignore pending queries on **hydrate** (not just dehydrate) and clear any restored pending entries so legacy cached state cannot trigger the React Query warning.
- Keep existing fetchers/components; only adjust persistence/hydration safeguards so schedule queries either load fresh or fail with standard error boundaries instead of hydration rejections.
