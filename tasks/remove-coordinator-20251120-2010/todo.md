---
task: remove-coordinator
timestamp_utc: 2025-11-20T20:10:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Identify all coordinator-related flags/config/routes/components.
- [x] Confirm legacy flow entry points and dependencies.

## Core

- [x] Remove coordinator code paths and configs; ensure legacy is default.
- [x] Clean up any coordinator-specific assets/tests.
- [x] Update any imports/usages referencing coordinator artifacts.

## UI/UX

- [x] Verify legacy UI states remain functional and accessible (no UI changes made).

## Tests

- [x] Update or remove tests tied to coordinator flow.
- [ ] Run relevant test suites after changes.

## Notes

- Assumptions: Coordinator flow is fully replaceable by legacy without new dependencies.
- Deviations: Tests currently failing in broader server suite (e.g., `windowsOverlap` not exported, restaurant schedule mocks expecting no Supabase calls); unrelated to coordinator removal.

## Batched Questions

- Pending discoveries during inventory.
