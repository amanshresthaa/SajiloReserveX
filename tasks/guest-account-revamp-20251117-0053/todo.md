---
task: guest-account-revamp
timestamp_utc: 2025-11-17T00:54:03Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: high
flags: [feat.guest_account_revamp]
related_tickets: []
---

# Implementation Checklist

## Setup

- [ ] Confirm design tokens/components; inventory current guest-account UI for reuse.
- [ ] Add/ensure feature flag `feat.guest_account_revamp` (default off).

## Core

- [ ] IA/layout updates for guest account shell/navigation.
- [ ] Invite flow screens (success, expired/invalid, already used) with clear CTAs.
- [ ] Bookings list (upcoming/past), detail view, key actions w/ safe-guard flows.
- [ ] Profile/manage forms for details/preferences with validation and a11y.

## UI/UX

- [ ] Mobile-first responsive layouts; sticky primary actions where helpful.
- [ ] Loading, empty, and error states for each surface.
- [ ] A11y roles, labels, focus management, contrast, non-color cues.

## Tests

- [ ] Unit tests for UI logic/formatting/validation.
- [ ] Integration tests for invite, bookings, and profile flows (mocked APIs).
- [ ] Accessibility checks (axe/manual keyboard).

## Notes

- Assumptions: reuse existing services; no API changes unless discovered gaps.
- Deviations: to be logged during implementation.

## Batched Questions

- None pending; see `research.md` open questions.
