---
task: calendar-mask-refactor
timestamp_utc: 2025-11-21T21:06:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Research: Calendar mask prefetch removal

## Requirements

- Functional: Calendar view should use calendar masks to mark closed days; no per-day schedule prefetch. Schedules fetched only when a date is selected. Open/closed distinction only; fully booked days handled after selecting date.
- Non-functional (a11y, perf, security, privacy, i18n): Keep calendar interaction responsive and keyboard-accessible; avoid unnecessary network traffic; preserve existing error handling without exposing secrets.

## Existing Patterns & Reuse

- `useUnavailableDateTracking` (reserve/features/reservations/wizard/hooks/usePlanStepForm.ts) currently prefetches every date’s schedule for visible months (prev/current/next) using abort controllers and pending refs; also prefetches calendar masks.
- `useTimeSlots` already fetches schedule per selected date via React Query keyed by restaurantSlug + date.
- `Calendar24Field` accepts `loadingDates` and `isDateUnavailable` to disable days; currently disables `closed` and `no-slots` days.
- `PlanStepForm` messaging includes an “scroll to load month” path tied to schedule prefetching.

## External Resources

- Story instructions (user prompt) define target behaviour: masks only for calendar decoration; schedule fetch per selected date.

## Constraints & Risks

- Removing schedule prefetch means no early knowledge of fully booked days; must ensure UI copy remains accurate.
- Need to avoid regressions in availability disabling (only closed days should be blocked).
- Risk of stale state on restaurant slug change; ensure cleanup leaves mask state consistent.

## Open Questions (owner, due)

- Q: Do we need to preserve `loadingDates` indicators now that schedule prefetch is removed? (owner: assistant, due: implementation review)  
  A: Kept state for compatibility; no per-date prefetch uses it now.
- Q: Should “unknown” states still disable dates or be selectable? (owner: assistant, due: implementation review)  
  A: Only `closed` disables dates; unknown remains selectable to allow retry.

## Recommended Direction (with rationale)

- Strip schedule prefetch logic from `useUnavailableDateTracking`; keep mask prefetch for prev/current/next months based on min date.
- Simplify cleanup to mask state only; remove abort/pending schedule machinery.
- Keep `applyCalendarMask` as sole calendar decorator (closed vs other).
- Update UI to disable only closed (optionally unknown) dates and adjust messaging to avoid prefetch hints.
