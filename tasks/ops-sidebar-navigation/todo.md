# Implementation Checklist

## Setup

- [x] Install shadcn `sidebar` component (CLI) and verify tokens already present.

## Components

- [x] Create `components/ops/AppSidebar.tsx` with navigation items and active state.
- [x] Create `components/ops/OpsAppShell.tsx` wrapping `SidebarProvider`, `AppSidebar`, header, and content slot.

## Layout Integration

- [x] Add server layout at `app/(ops)/ops/(app)/layout.tsx` consuming `OpsAppShell`.
- [x] Update `/ops` dashboard page to render content section without extra `<main>`.
- [x] Update `/ops/bookings/new` page to drop redundant `<main>` wrapper.
- [x] Update `/ops/team` page to fit new shell spacing semantics.

## Testing & Verification

- [x] Run `pnpm lint` or `pnpm test --filter=...` (whichever fastest) to ensure no regressions.
- [ ] Manually verify navigation highlight, collapse/expand, keyboard shortcut, and mobile layout.

## Documentation

- [ ] Fill `verification.md` with tested scenarios and outcomes.
