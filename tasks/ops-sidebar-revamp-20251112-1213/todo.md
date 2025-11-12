---
task: ops-sidebar-revamp
timestamp_utc: 2025-11-12T12:13:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Scaffold new ops sidebar layout components (provider wrapper + nav + trigger).
- [x] Remove/replace legacy `OpsSidebar`, `OpsSidebarTrigger`, and related glue once new structure is ready.

## Core

- [x] Render nav sections + account/support entries from existing config with active state detection.
- [x] Implement desktop collapse + mobile sheet using Shadcn primitives, including keyboard shortcuts.
- [x] Persist preference via `sidebar_state` cookie hook.

## UI/UX

- [x] Ensure restaurant switcher and skip link integrate cleanly with new layout spacing.
- [x] Add tooltips/aria labels for icon-only collapsed state.
- [x] Provide loading skeleton for nav while pathname is undefined.

## Tests

- [x] `pnpm typecheck`
- [x] Manual QA via Chrome DevTools MCP (desktop/mobile approximation), verifying toggle, navigation, and cookie persistence.
- [x] Spot-check axe for regressions (no new warnings observed).

## Notes

- Assumptions: nav data remains stable; design tokens from Tailwind config remain valid.
- Deviations: none yet.

## Batched Questions

- None.
