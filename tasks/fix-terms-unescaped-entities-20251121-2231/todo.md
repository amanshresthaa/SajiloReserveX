---
task: fix-terms-unescaped-entities
timestamp_utc: 2025-11-21T22:31:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Confirm failing lint output and offending file.

## Core

- [x] Update `src/app/(marketing)/terms/page.tsx` to escape problematic quotes without altering copy.

## UI/UX

- [ ] Verify rendered text retains intended wording and structure.
- [ ] Ensure accessibility (headings/text semantics) remains unchanged.

## Tests

- [x] Run lint (`pnpm lint` or equivalent pre-commit command) to confirm rule passes.

## Notes

- Assumptions: No other files need changes; content change is purely escaping.
- Deviations: None anticipated.

## Batched Questions

- None.
