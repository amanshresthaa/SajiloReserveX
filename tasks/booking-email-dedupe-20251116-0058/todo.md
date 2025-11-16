---
task: booking-email-dedupe
timestamp_utc: 2025-11-16T00:58:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [ ] Confirm current inline auto-assign email touchpoints.
- [ ] Align queue/suppress env assumptions for dev tests.

## Core

- [ ] Remove inline confirmation send that competes with side-effects.
- [ ] Ensure side-effects path handles confirmed vs pending without duplicates.
- [ ] Keep background auto-assign confirmation delivering exactly once.

## UI/UX

- Not applicable.

## Tests

- [ ] Update/extend tests for booking creation email dispatch.
- [ ] Cover pending vs confirmed cases to assert single send.

## Notes

- Assumptions: background auto-assign remains the source for pending→confirmed emails post-creation.
- Deviations: None yet.

## Batched Questions

- None.
