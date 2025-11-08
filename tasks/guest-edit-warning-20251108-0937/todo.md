# Implementation Checklist

## Setup

- [x] Confirm EditBookingDialog is the shared component for guest edits.

## Core

- [x] Insert warning `Alert` with provided copy near top of dialog.
- [x] Ensure wording highlights loss of table and pending state risk.

## UI/UX

- [x] Verify stacking with existing alerts and responsiveness.
- [x] Accessibility: check alert roles/text.

## Tests

- [ ] Manual QA via browser/devtools (later recorded in verification.md).

## Notes

- Assumptions: All guest edits pass through this dialog on reservation detail page.
- Deviations: None yet.
