# Implementation Checklist

## Setup

- [x] Inspect existing booking status badge usage within `BookingsList.tsx`.

## Core

- [x] Gate the `Checked in` and `Checked out` badges behind a `effectiveStatus !== 'completed'` check.
- [x] Ensure table assignment and other chips remain unaffected by the conditional.
- [x] Mirror the lifecycle badge guard inside `BookingDetailsDialog` so the modal header matches the card.

## UI/UX

- [ ] Manually QA a completed booking card to confirm the layout feels less crowded.
- [ ] Manually QA the booking details modal to confirm no redundant chips appear when completed.

## Tests

- [x] Unit
- [ ] Integration
- [ ] E2E (critical flows)
- [ ] Axe/Accessibility checks

## Notes

- Assumptions: Integration/E2E/Axe coverage deferred; change scope is localized UI conditional.
- Deviations: Manual QA pending access to Chrome DevTools MCP.

## Batched Questions (if any)

-
