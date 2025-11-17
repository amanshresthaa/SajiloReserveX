---
task: customer-nav-consistency
timestamp_utc: 2025-11-17T00:14:00Z
owner: github:@assistant
reviewers: []
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Confirm desired nav links and footer simplicity (done via user notes).
- [x] Review existing CustomerNavbar/Footer structure and state handling.

## Core

- [x] Update CustomerNavbar links (logo, Browse, My bookings, Profile, Sign in/Sign out) with responsive hamburger/sheet.
- [x] Ensure auth-aware states and focus-visible styles are consistent.
- [x] Adjust mobile/desktop spacing and typography for nav/footer.
- [x] Simplify Footer variant for customer flows (copyright-only).
- [x] Wire layouts to use simplified footer where appropriate.
- [x] Remove deprecated marketing/checkout/legal/blog routes as requested.

## UI/UX

- [ ] Validate mobile (≤375px) and tablet (≈768px) nav behavior.
- [ ] Check long names/emails and skeleton/loading states.
- [ ] Ensure no CLS and ensure sticky/scroll behavior is acceptable.

## Tests

- [ ] Run/adjust any navbar-related unit tests if impacted.
- [ ] Manual Chrome DevTools MCP QA (console/network/a11y/perf checks) on key routes.

## Notes

- Assumptions: Landing `/` now uses customer navbar/footer; marketing footer not used for customer flows.
- Deviations: Removed marketing/checkout/legal/blog routes per request.

## Batched Questions

- None currently.
