# Implementation Checklist

## Setup

- [x] Review current `AppSidebar` implementation and supporting sidebar primitives.

## Core Functionality

- [x] Restructure nav configuration into labelled sections.
- [x] Update JSX to render grouped navigation with proper labels and spacing.
- [x] Ensure active-state matcher logic still works after refactor.

## UI/UX

- [x] Refresh icons and ordering to match new grouping semantics.
- [ ] Verify touch targets, aria attributes, and focus states remain intact.

## Testing

- [x] Run relevant lint/type checks for the modified files. (ESLint ✅; `pnpm typecheck` blocked by pre-existing booking test errors.)
- [ ] Perform manual QA with Chrome DevTools across key breakpoints.

## Questions/Blockers

- None at this time.
