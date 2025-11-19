---
task: capacity-timeline-revamp
timestamp_utc: 2025-11-18T07:48:48Z
owner: github:@amankumarshrestha
reviewers: [github:@reviewer]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Review existing capacity page implementation and data hooks.
- [x] Identify reusable UI pieces and status options.

## Core

- [x] Rebuild timeline layout with header/hour markers/background grid.
- [x] Implement table rows and segment rendering with revamped styles.
- [x] Wire filters (search/date/service/zone/status) to timeline data.
- [x] Handle empty/edge states.

## UI/UX

- [x] Ensure segments and controls are keyboard accessible/focus-visible.
- [x] Add tooltips/labels and current time indicator.
- [x] Update dialog content/actions for segment selection.

## Tests

- [ ] Manual UI sanity check (DevTools MCP) across filters/segments.
- [ ] Note any automated tests run or not run.

## Notes

- Assumptions: Data contracts remain unchanged.
- Deviations: None yet.

## Batched Questions

- None currently.
