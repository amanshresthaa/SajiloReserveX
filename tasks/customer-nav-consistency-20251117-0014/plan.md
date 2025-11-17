---
task: customer-nav-consistency
timestamp_utc: 2025-11-17T00:14:00Z
owner: github:@assistant
reviewers: []
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Customer Nav/Footer Consistency

## Objective

Make customer-facing routes share a consistent navbar/footer with responsive behavior and clean spacing across mobile/tablet/desktop, keeping required links (logo, Browse, My bookings, Profile, Sign in/Sign out).

## Success Criteria

- Navbar shows the specified links with correct auth-aware states; mobile hamburger works and remains keyboard-accessible.
- Footer on customer flows is simplified to copyright-only content; marketing footer remains unchanged.
- No layout regressions on target routes; a11y checks (focus-visible, keyboard nav) pass; manual QA artifacts captured.

## Architecture & Components

- `components/customer/navigation/CustomerNavbar.tsx`: normalize link set, responsive sheet menu, focus states.
- `components/Footer.tsx`: introduce simple variant for customer flows (or prop to toggle links); ensure spacing and mobile stacking.
- Layouts: `src/app/(guest-public)/(guest-experience)/layout.tsx`, `src/app/(guest-account)/layout.tsx`, and `/` landing decision (if switching to customer footer).

## Data Flow & API Contracts

- No backend contract changes; only UI chrome.

## UI/UX States

- Desktop vs mobile nav (collapsed sheet). Signed-in vs signed-out button states. Empty/error states unchanged.

## Edge Cases

- Long display names/emails in avatar menu.
- No profile/session (loading skeleton) in navbar.
- Small screens: ensure menu scrolls and focus trap works.

## Testing Strategy

- Manual Chrome DevTools MCP across mobile/tablet/desktop: keyboard nav, focus visibility, sheet open/close, link targets.
- Visual check of spacing/overflow on target routes.
- (Optional) Unit snapshot for navbar if existing tests need updates.

## Rollout

- No flag; small scoped UI change.

## DB Change Plan

- Not applicable.
