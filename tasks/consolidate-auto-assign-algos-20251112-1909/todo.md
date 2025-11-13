---
task: consolidate-auto-assign-algos
timestamp_utc: 2025-11-12T19:09:00Z
owner: github:@codex-ai
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Create task folder and scaffolding artifacts.
- [x] Capture the key behaviors/configuration of each auto-assign implementation.
- [x] Draft the consolidated `docs/auto-assign-algorithms.json` file.

## Core

- [x] Verify the JSON references match the current code (paths, env flags, helper names).
- [x] Update verification or readers with any gotchas discovered during write-up.

## UI/UX

- [ ] Not applicable (documentation change).

## Tests

- [ ] Not applicable (no runtime features).

## Notes

- Assumptions:
  - The auto-assign scripts listed in `scripts/` remain the canonical implementation points.
- Deviations:
  - None.

## Batched Questions

- None.
