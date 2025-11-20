---
task: remove-table-status-field
timestamp_utc: 2025-11-20T12:40:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Update table service payload types to make status optional/defaulted.

## Core

- [x] Remove status fields/state from table form.
- [x] Remove status column/badges from table list.
- [x] Ensure create/update mutations no longer send status.

## UI/UX

- [x] Confirm column counts/skeleton/empty states align post-removal.

## Tests

- [ ] Manual UI sanity once available (DevTools MCP) or note if not run.

## Notes

- Assumptions: status visibility/control is not needed on settings page; backend auto-refresh continues to set status.
- Deviations: None yet.

## Batched Questions

- None.
