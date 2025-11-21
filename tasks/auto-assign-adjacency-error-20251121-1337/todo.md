---
task: auto-assign-adjacency-error
timestamp_utc: 2025-11-21T13:37:47Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [ ] Verify relevant AGENTS.md scope (root only).
- [ ] Identify adjacency/auto-assign modules and existing tests.

## Core

- [ ] Reproduce or trace the non-adjacent error path for the reported booking/table IDs.
- [ ] Implement fix (logic or data correction) to accept valid adjacent sets.
- [ ] Ensure background job shares the same corrected validation.

## UI/UX

- [ ] Confirm no UI regressions; update messaging only if needed.

## Tests

- [ ] Add/adjust unit or integration test covering the fixed adjacency case.
- [ ] Run targeted test suite or relevant checks.

## Notes

- Assumptions: Table adjacency config exists in repo/config; no DB schema changes needed.
- Deviations: None yet.

## Batched Questions

- Do we need a feature flag or config guard for this fix?
