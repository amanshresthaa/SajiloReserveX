# Implementation Checklist

## Setup

- [x] Introduce shared helper for modification flow (`server/bookings/modification-flow.ts`).
- [x] Update feature-flag plumbing (auto-assign bypass, email job types).

## Core

- [x] Guest booking update route uses helper instead of inline RPC realignment.
- [x] Dashboard/my-bookings edit path reuses the modification helper whenever allocation inputs change.
- [x] Ops booking update route uses helper and returns pending state.
- [x] Background auto-assign job handles modification-triggered attempts + custom email copy.

## UI/UX

- [x] Email templates cover “modification requested” + “modification confirmed”.
- [ ] Email queue worker processes new job types when queue enabled.

## Tests

- [x] Unit tests for helper (status flips, email dispatch, background scheduler invocation).
- [x] API route tests verifying pending status + email scheduling.
- [ ] Job/email tests ensuring new copy is used.

## Notes

- Assumptions: `pending` status is acceptable, and auto-assign should bypass flag when triggered by modification.
- Deviations: Email queue worker still handles the existing job types—new modification templates send immediately, so queue changes were not required. Dedicated auto-assign email tests remain a follow-up.
