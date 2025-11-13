---
task: ops-sidebar-revamp
timestamp_utc: 2025-11-12T12:13:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Ops sidebar rebuild

## Objective

Deliver a cleaner, bug-free /ops sidebar experience by rebuilding the shell with Shadcn primitives, keeping existing navigation items/features but improving structure, accessibility, and reliability.

## Success Criteria

- [ ] Sidebar renders identical navigation structure and account/support sections with no missing links.
- [ ] Toggle behavior works flawlessly on desktop (collapse) and mobile (sheet/off-canvas) with persisted preference.
- [ ] Keyboard navigation and aria attributes meet WCAG baselines.
- [ ] No regressions in restaurant switcher or sign-out interactions.

## Architecture & Components

- `components/features/ops-shell/OpsShell.tsx`
  - Refactor into a lean layout that wires a new `OpsSidebarLayout` (provider + nav + inset). Accepts children. Handles skip links.
- `components/features/ops-shell/OpsSidebarLayout.tsx` (new)
  - Owns provider, aside, trigger, and content wrapper. Uses hook to sync cookie state. Responsible for showing mobile sheet and desktop rail.
- `components/features/ops-shell/OpsSidebarNav.tsx` (new)
  - Pure presentational nav list built from `OPS_NAV_SECTIONS`; ensures semantic grouping and highlight logic.
- `components/ui/sidebar.tsx`
  - Optionally trimmed to only export the primitives we still need, or replaced with simpler inline logic if necessary.
- `components/features/ops-shell/navigation.tsx`
  - Keep data/config as-is; update helper exports if new layout requires different props (e.g., tooltip text).

## Data Flow & API Contracts

- `useOpsSession` still supplies memberships and feature flags; new layout consumes it for restaurant switch + nav gating.
- `sidebar_state` cookie remains contract for remembering desktop collapse preference. `useSidebarPreference` hook reads cookie on mount and writes to document on change.

## UI/UX States

- Desktop expanded: 16rem width, full labels.
- Desktop collapsed: icon-only width; tooltips for nav items.
- Mobile: sheet overlay triggered by button; close on navigation.
- Loading skeleton: show placeholders when pathname not ready.

## Edge Cases

- No memberships loaded yet: show skeletons & disable nav.
- Feature-flagged items absent: layout shouldn’t leave empty sections.
- Long restaurant names: ensure truncation + tooltip.

## Testing Strategy

- Manual QA via Chrome DevTools MCP on desktop + mobile.
- Validate cookie behavior and focus management.
- Run `pnpm typecheck` and targeted lint if time permits.

## Rollout

- No feature flag. Merge behind standard PR referencing this task folder.
- Regression fallback: revert module.
