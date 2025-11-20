---
task: plan-your-visit-perf
timestamp_utc: 2025-11-20T12:49:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Plan step latency

## Objective

Reduce “Plan your visit” step load time by cutting unnecessary schedule prefetches while keeping closed-day accuracy and current UX/a11y.

## Success Criteria

- [ ] Initial Plan step triggers significantly fewer schedule requests (target: ≤10 per month prefetch vs ~30+ today).
- [ ] No regression in closed-day markings and slot selection for the current date.
- [ ] All automated checks we run stay green.

## Architecture & Components

- `reserve/features/reservations/wizard/hooks/usePlanStepForm.ts`: adjust `buildMonthDateKeys`/prefetch strategy to cap per-month schedule fetches.
- `PlanStepForm` UI stays unchanged; relies on updated hook state.

## Data Flow & API Contracts

- Schedule requests `/restaurants/{slug}/schedule?date=YYYY-MM-DD` remain; we will reduce the count by limiting which dates are prefetched.

## UI/UX States

- Calendar still shows closed days from calendar masks.
- Time grid continues to hydrate on selected date. Unknown days may show “loading/unknown” copy until clicked.

## Edge Cases

- Min selectable date mid-month should still be honored when capping prefetch.
- Restaurants with sparse openings must not mislabel closed/open days.

## Testing Strategy

- Unit-ish: rely on existing hook tests (if any) and run targeted lint/test suite we can afford.
- Manual: smoke Plan step to ensure calendar renders, closed dates respect mask, selecting dates loads slots.

## Rollout

- No flag; change is localized and backward compatible.
- Monitor for unexpected gaps in unavailable-day markings.

## DB Change Plan (if applicable)

- Not applicable; no DB changes.
