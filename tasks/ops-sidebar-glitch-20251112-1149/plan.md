---
task: ops-sidebar-glitch
timestamp_utc: 2025-11-12T11:49:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Ops sidebar toggle regression

## Objective

Ensure operators can reliably open and close the navigation sidebar on every /ops page across desktop and mobile, using accessible controls that persist preference.

## Success Criteria

- [ ] Desktop users can toggle the sidebar via either the rail or an explicit trigger button; state persists after navigation/refresh.
- [ ] Mobile users see a clearly labeled toggle button that opens/closes the sheet-based sidebar.
- [ ] No layout regressions to existing page content; ops pages do not need per-page wiring to gain the fix.

## Architecture & Components

- `components/features/ops-shell/OpsShell.tsx`
  - Accept optional `header` slot but primarily inject a utility region containing a global `OpsSidebarTrigger` (new component) positioned for both mobile and desktop usage.
  - Manage focus order by placing skip link before the trigger.
- `components/features/ops-shell/OpsSidebarTrigger.tsx` (new)
  - Wraps `SidebarTrigger` with ops-specific button visuals, tooltips, aria-label, and responsive visibility (sticky on mobile, inline on desktop).
  - Optionally shows a pressed state indicator via `data-state` attribute from `useSidebar`.
- `components/features/ops-shell/index.ts` export updates as needed.

## Data Flow & API Contracts

- No API changes. The component continues relying on `SidebarProvider` context.
- Cookie persistence logic already handled inside sidebar primitives; ensure trigger uses `SidebarTrigger` so behavior stays consistent.

## UI/UX States

- Default: sidebar open; trigger displays "Hide sidebar" tooltip.
- Collapsed: trigger indicates "Show sidebar" (aria-pressed=false) and mobile floating button remains visible until reopened.
- Loading: unchanged skeleton state when pathname absent.

## Edge Cases

- When JavaScript disabled, sidebar remains in default state; skip to content and nav remain accessible.
- SSR hydration mismatch: ensure trigger renders deterministically (avoid `useEffect` only states).
- If a page renders its own trigger later, global trigger should still work without conflicting events.

## Testing Strategy

- Manual QA via Chrome DevTools MCP on desktop and mobile breakpoints (375px + 1280px) to confirm toggling, focus order, and cookies.
- Unit tests not required (UI component) but lint/typecheck must stay green.
- Verify `sidebar_state` cookie flips between true/false via DevTools Application tab.

## Rollout

- No flag; change applies immediately. No backend dependencies.
- Monitoring: rely on QA feedback; no runtime metrics needed.
- Kill-switch: revert component file in git if regressions found.
