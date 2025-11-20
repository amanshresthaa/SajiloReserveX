---
task: plan-your-visit-perf
timestamp_utc: 2025-11-20T12:49:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Research: Plan step latency

## Requirements

- Functional: investigate “Plan your visit” step latency during booking flow and identify concrete code-level opportunities to speed up initial load/interactions without regressing availability accuracy.
- Non-functional: preserve accessibility and current UX, avoid increasing API load beyond necessary, keep behavior consistent for closed days and slot availability.

## Existing Patterns & Reuse

- Booking wizard uses `usePlanStepForm` with React Query to prefetch schedules and calendar masks.
- Calendar unavailability is derived from schedule prefetch + calendar mask. `useTimeSlots` already fetches schedule for the selected date.

## External Resources

- None yet; relying on repository code for analysis.

## Constraints & Risks

- Must keep Supabase untouched (remote-only rule) — no DB changes planned.
- Aggressive prefetching currently issues one schedule request per day in visible months; reducing this may slightly delay per-day availability hints.
- Need to maintain accurate closed-day flags from calendar mask.

## Open Questions (owner, due)

- Are there UX promises that every day in the visible month must show availability before interaction? (owner: github:@assistant, due: before implementation)

## Recommended Direction (with rationale)

- Trim schedule prefetch volume: cap the number of per-day schedule fetches per month and rely on the calendar mask for closed days. This should lower initial network burst and improve perceived load time for the Plan step while keeping close-day accuracy.
