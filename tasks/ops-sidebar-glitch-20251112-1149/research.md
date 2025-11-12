---
task: ops-sidebar-glitch
timestamp_utc: 2025-11-12T11:49:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Research: Ops sidebar toggle regression

## Requirements

- Functional:
  - Ensure the /ops shell sidebar can be toggled open/closed on desktop via the rail and by an explicit trigger control that is keyboard accessible.
  - Provide an obvious toggle button for mobile/tablet so the sheet-style sidebar can be opened and dismissed without relying on hidden rails.
  - Persist the last desktop open/closed state via the existing `sidebar_state` cookie so the server layout keeps honoring user preference.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Toggle control must be reachable via keyboard and expose `aria-pressed` state.
  - Maintain current layout performance (no additional client fetches; only lightweight UI state).
  - No new secrets/config.

## Existing Patterns & Reuse

- Ops shell already uses the shared `SidebarProvider`, `Sidebar`, `SidebarRail`, and `SidebarInset` primitives from `components/ui/sidebar.tsx`. These handle cookies and desktop collapse.
- There is an example usage with `SidebarTrigger` (`src/app/(ops)/ops/(app)/dashboard/page.tsx`) that wires a button into the header; we can reuse that trigger inside a dedicated `OpsSidebarToggle` so every page inherits a consistent control.
- The shell renders `OpsSidebar` (navigation) and `OpsSidebarInset` (content container); we can wrap children in a header slot that hosts the toggle plus breadcrumbs if needed.

## External Resources

- [Radix UI Sheet](https://www.radix-ui.com/docs/primitives/components/sheet) — informs how the mobile sidebar is exposed via a sheet overlay.
- [WAI-ARIA Authoring Practices — disclosure/navigation](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) — reference for accessible toggle button behavior.

## Constraints & Risks

- Must avoid breaking existing page layouts that may already render their own top bars; introducing a wrapper header inside `OpsShell` must be opt-in or minimal so content spacing stays identical.
- Pages might already include a bespoke toggle; double buttons would confuse users. Need a way to hide the global toggle if a page explicitly provides one (e.g., via prop or context).
- We have to ensure mobile toggle opens the sheet (which uses `openMobile` state) rather than toggling desktop `open`; relying solely on `SidebarTrigger` is acceptable because it uses `toggleSidebar` which routes to the right state internally.

## Open Questions (owner, due)

- Q: Do any ops pages already supply their own sidebar trigger that we should preserve? (owner: github:@assistant, due: before coding) — Action: audit `/src/app/(ops)/ops/(app)` for `SidebarTrigger` usage (currently only demo page). Pending confirmation but unlikely to block implementation.

## Recommended Direction (with rationale)

- Add a reusable `OpsSidebarToggle` client component inside `components/features/ops-shell/` that renders `SidebarTrigger` with styling suited for the ops header and exposes optional slot for breadcrumbs/title. This component reuses the existing sidebar primitives and ensures accessibility.
- Update `OpsShell` to include an always-available top utility bar (visually minimal) that contains the toggle on the left and a slot for per-page header content passed via a new `header` prop. This keeps backward compatibility by defaulting to simple spacing when no header is provided.
- For immediate bug fix, also inject a floating toggle button that only appears on small screens when the sidebar is closed, ensuring mobile users can reopen it even if the header scrolls off-screen. This can be implemented with `SidebarTrigger` plus responsive utility classes.
