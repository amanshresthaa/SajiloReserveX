---
task: booking-edit-cancel-fix
timestamp_utc: 2025-11-19T20:23:16Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Review booking edit dialog and availability loader to understand current failure.
- [x] Confirm API routes and payloads for edit and cancel flows.

## Core

- [x] Fix availability fetch parameters or error handling so edit dialog loads timeslots.
- [ ] Fix edit submission to send correct payload and handle success/error states.
- [x] Fix cancel action to call correct endpoint with required identifiers and display result (added guarded messaging for pending-locked cancellations and defensive optimistic updates).

## UI/UX

- [ ] Ensure error messages are clear and retry paths exist.
- [ ] Preserve keyboard/focus behavior in dialog and buttons.

## Tests

- [ ] Run relevant linters/tests if available; perform manual QA in dev with Chrome DevTools MCP.

## Notes

- Assumptions: existing API endpoints are functional with correct params; issue is client-side misuse.
- Deviations: Proxy rewrite for schedule endpoints corrected; UI QA blocked until authenticated session available.
