# Implementation Plan: Ops Sidebar Navigation

## Objective

Create a shared operations app shell with a collapsible sidebar so authenticated `/ops` routes share navigation, meet accessibility standards, and provide mobile-friendly toggling.

## Success Criteria

- [ ] `/ops`, `/ops/bookings/new`, and `/ops/team` render inside a shared layout with sidebar + header.
- [ ] Sidebar collapses to icons on narrow viewports and toggles via keyboard (`⌘/Ctrl+B`) and trigger button.
- [ ] Active route highlighted; navigation links support Cmd/Ctrl-click and match existing URL structure.
- [ ] No regressions in Supabase auth flow or existing page redirects.

## Architecture

### Components

- `components/ui/sidebar.tsx`: shadcn sidebar primitives (installed via CLI to stay upstream-compatible).
- `components/ops/AppSidebar.tsx`: client component exporting the operations-specific navigation tree.
- `components/ops/OpsAppShell.tsx`: client shell combining sidebar, header, and content slot.

### Layout Integration

- New server `app/(ops)/ops/(app)/layout.tsx` to wrap pages with `OpsAppShell`.
- Layout renders `SidebarInset` content area; individual pages return section markup (no duplicate `<main>`).

### State Management

- Sidebar state handled by shadcn `SidebarProvider` (with persisted cookie).
- Determine active nav item via `usePathname()` inside `AppSidebar`.

### Data Flow

- Layout remains server-only for auth-critical logic; pages still fetch data as before.
- Sidebar client components use static nav definitions (no async fetching required initially).

## UI/UX Considerations

- Mobile-first: sidebar collapses to icon-only rail, trigger placed in header with accessible label.
- Header includes page title slot + future actions; ensure focus styles visible (`focus-visible`, `touch-action: manipulation` on buttons).
- Maintain existing content max widths by wrapping children in `div` with responsive padding.
- Provide aria-current on active links, sr-only labels for icon-only buttons, and visible focus rings.

## Testing Strategy

- Manual: navigate between `/ops`, `/ops/bookings/new`, `/ops/team`; verify sidebar highlights, collapse/expand, keyboard shortcut, and mobile toggle.
- Automated: consider Playwright smoke later; for now ensure no lint/type errors (`pnpm lint`, `pnpm typecheck`).
- Accessibility: keyboard tab order (trigger → nav → content), screen reader announcements (`aria-label`, `sr-only`).

## Rollout Plan

- Ship behind existing auth gating (no feature flag needed).
- Post-deploy, monitor 4xx/5xx on `/ops*` routes and Supabase auth logs.
- Capture user feedback from ops stakeholders after initial release.

## Open Questions

- Should header expose restaurant switcher/global status? (Out of scope; future enhancement.)
- Need to confirm final nav labeling with ops stakeholders (default to “Dashboard”, “Walk-in bookings”, “Team”).
