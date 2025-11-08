# Implementation Plan: Ops dashboard responsive cleanup

## Objective

Deliver a mobile-first yet desktop-efficient layout for `/ops` so operators get an organized dashboard regardless of device width while keeping all booking functionality intact.

## Success Criteria

- [ ] Sections flow as a single column on mobile and switch to a two-column layout (`Reservations` + sidebar modules) on large screens without overlapping content.
- [ ] KPI/stat cards remain legible and wrap gracefully on small screens.
- [ ] No React hook order changes; runtime hooks still execute before any conditional returns.
- [ ] Lint/type tooling runs cleanly (no new warnings/errors).

## Architecture & Components

- `OpsDashboardClient` remains the orchestration point.
  - Wrap content in `<main>` for semantics.
  - Group structural sections into logical containers: header, service-date, stats, layout grid.
  - Introduce `lg:grid` container with `minmax` columns so the right rail (VIP + change feed) becomes an `aside` stack.
- All subordinate components (`BookingsList`, `VIPGuestsModule`, etc.) stay untouched.

## Data Flow & API Contracts

- No API changes; existing hooks continue fetching the same data.
- Ensure `selectedDate` state stays in client scope; only markup reorganizes.

## UI/UX States

- Loading, empty, and error states remain handled by existing components (BookingOfflineBanner, DashboardSkeleton, DashboardErrorState, VIP empty state, change feed empty state).
- Responsive behavior ensures each state still spans full width on mobile and slots into the correct column on desktop.

## Edge Cases

- When `statCards` is empty the surrounding layout should collapse without leaving awkward gaps.
- VIP and change feed modules must still show empty-state copy even when rendered inside the sidebar column.

## Testing Strategy

- Manual inspection via code review (Tailwind class audit) for responsive breakpoints.
- Run `pnpm lint` (existing lint target) to verify no lint regressions; no automated visual tests available locally.

## Rollout

- No feature flag; change is purely presentational.
- Monitor for layout regressions during QA; revert by restoring previous markup if issues appear.
