---
task: walk-in-booking
timestamp_utc: 2025-11-19T22:43:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Confirm ops routing path for new walk-in page and align with auth redirect logic.
- [x] Create/validate ops-specific wizard wrapper (ops mode, active restaurant prefill).

## Core

- [x] New ops route renders wizard with active restaurant context and return path to bookings.
- [x] CTA/button on ops bookings page links to new walk-in flow.

## UI/UX

- [ ] Loading/empty/error states handled for restaurant context fetch.
- [ ] Wizard in ops mode preserves keyboard navigation, focus, and labels.
- [ ] Return navigation to bookings works after confirmation/close.

## Tests

- [ ] Manual QA via Chrome DevTools (console/network clean; device sizes).
- [ ] Smoke booking creation end-to-end (wizard submit, booking visible in list).
- [ ] Optional: add lightweight component test if time allows.
- [x] Address React hooks ordering in ops wizard client; build now passes.

## Notes

- Assumptions: ops users should use full wizard (no custom short form); no additional fields required beyond existing wizard.
- Deviations: None yet.

## Batched Questions

- Preferred return destination after confirmation (bookings list vs dashboard)?
- Should CTA be gated behind a feature flag?
