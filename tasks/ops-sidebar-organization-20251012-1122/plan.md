# Implementation Plan: Ops Sidebar Organization

## Objective

Improve the `/ops` sidebar hierarchy so day-to-day tasks and configuration areas are clearly separated while keeping existing navigation behaviour intact.

## Success Criteria

- [ ] Sidebar groups are split into at least two meaningful sections under `SidebarContent`.
- [ ] Navigation highlighting and routing still work for every link (Dashboard, Bookings, Walk-in booking, Manage restaurant, Restaurant settings, Team).
- [ ] Icons remain descriptive and no two adjacent items share the same glyph.
- [ ] Lint/build passes and manual QA via Chrome DevTools reports no accessibility regressions.

## Architecture

### Components

- `components/ops/AppSidebar.tsx`: Refactor nav data from a flat `NAV_ITEMS` array into grouped sections, adjust rendering to iterate sections, and tweak icon selections.
- `components/ui/sidebar.tsx`: No direct changes expected; continue leveraging existing primitives.

### State Management

- Reuse current client-side state (sign-out loading state, sidebar provider). No new global or local state required beyond possible derived memoisation for grouped nav items.

## Data Flow

- The layout continues to pass `account` details into `AppSidebar`.
- Link click handling still relies on Next.js routing; regrouping does not introduce new data sources.

## API Contracts

- N/A (no API changes anticipated).

## UI/UX Considerations

- Adopt section labels such as "Daily operations" versus "Restaurant management" to support quick scanning.
- Order items within each group from most to least frequent usage (Dashboard → Bookings → Walk-in booking; Team → Manage restaurant → Restaurant settings).
- Maintain touch target sizing and `aria-current` handling.
- Ensure new icons visually differentiate configuration areas from operational ones.

## Testing Strategy

- Manual smoke test each navigation link to confirm routing.
- Verify active state highlighting by visiting each route.
- Leverage Chrome DevTools Accessibility and Device emulation during verification to ensure focus order and responsive layout remain correct.

## Edge Cases

- Account object may be `null`; header should continue to render initials fallback.
- Pathname may be `undefined` briefly; keep existing skeleton fallback intact.
- External support link should remain accessible after reflow.

## Rollout Plan

- Behind no feature flag; deploy once code review passes.
- Document changes in `verification.md` after manual QA so the team can sign off quickly.
