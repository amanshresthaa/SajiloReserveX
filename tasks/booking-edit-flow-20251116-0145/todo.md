---
task: booking-edit-flow
timestamp_utc: 2025-11-16T01:45:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [ ] Confirm current edit flow paths and feature flags.
- [ ] Decide inline auto-assign timeout and flag behavior.

## Core

- [ ] Add inline auto-assign attempt to edit handler with bounded timeout.
- [ ] Ensure only side-effects send emails; inline just records results.
- [ ] Keep background job scheduling for pending outcomes.

## UI/UX

- Not applicable (API).

## Tests

- [ ] Add/adjust tests for edit flow inline success/pending and email dedupe.
- [ ] Validate suppress-flag behavior.

## Notes

- Assumptions: same templates used; variant for modifications stays.
- Deviations: None yet.

## Batched Questions

- [ ] Should inline after edit use the modified confirmation template or standard?
