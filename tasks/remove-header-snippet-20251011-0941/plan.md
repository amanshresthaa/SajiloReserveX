# Implementation Plan: Remove Sticky Ops Header

## Objective

Eliminate the sticky Ops header markup so that `/ops` pages no longer render the extra header band while keeping navigation controls accessible.

## Success Criteria

- [ ] `OpsAppShell` no longer renders the `<header>` element that matches the provided snippet.
- [ ] Sidebar remains toggleable via `SidebarTrigger`.
- [ ] `New walk-in booking` CTA is removed along with the header (no dangling controls).
- [ ] Layout spacing around the main content stays visually balanced.
- [ ] Global `CustomerNavbar` is not rendered on any `/ops` route, eliminating the second sticky header snippet.

## Architecture

### Components

- `components/ops/OpsAppShell.tsx`: remove header JSX and adjust surrounding layout spacing if required.
- `components/LayoutClient.tsx`: gate `CustomerNavbar` rendering behind a path check so Ops pages bypass it.

### State Management

- No new state. Ensure existing `isOnWalkInPage` logic is either repurposed or removed if unused.

### Data Flow

- Unchanged; only presentational markup is affected.

## Implementation Steps

1. Delete the `<header>` block and its children from `OpsAppShell`.
2. Remove any now-unused variables (e.g., `isOnWalkInPage`).
3. Confirm the main content container still has appropriate padding once the header is gone.
4. Skip rendering `CustomerNavbar` when `usePathname()` indicates an `/ops` route.

## Edge Cases

- Ensure skip link still lands on `#ops-content`.
- Confirm pages without the CTA (walk-in page) behave correctly after associated JSX removal.

## Testing Strategy

- Manual check of `/ops` UI via Chrome DevTools to confirm header is gone and layout remains correct.
- Verify no console errors from removed elements.

## Rollout Plan

- Straightforward removal; no feature flag needed. Deploy with standard monitoring for layout regressions.
