---
task: ops-sidebar-glitch
timestamp_utc: 2025-11-12T11:49:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Create shared `OpsSidebarTrigger` component that composes `SidebarTrigger` with ops-specific styles.
- [x] Update `OpsShell` to render the trigger in an always-visible utility bar without disrupting existing page layouts.

## Core

- [x] Ensure trigger controls mobile sheet + desktop collapse via the provider context.
- [x] Keep cookie persistence functional by reusing `SidebarTrigger`.
- [x] Provide visually hidden label + tooltip for a11y clarity.

## UI/UX

- [x] Mobile: sticky toggle button accessible at top-left; confirm `touch-action: manipulation` and 44px target size.
- [x] Desktop: button aligns with sidebar edge and updates aria-pressed state.
- [x] Skip-link remains first focusable control.

## Tests

- [x] Manual QA on desktop (≥1280px) and mobile (375px) via Chrome DevTools MCP.
- [x] Check cookie flips using DevTools Application tab.
- [x] Axe/Accessibility quick scan to ensure no new violations.

## Notes

- Assumptions: pages rely on shell for toggle, so adding a single trigger is acceptable; no conflicting triggers exist yet.
- Deviations: none.

## Batched Questions

- None.
