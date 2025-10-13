# Implementation Checklist

## Setup

- [x] Scaffold `src/` directory structure (components/common, components/features, hooks, contexts, services, utils, types).
- [x] Remove legacy ops feature flag toggle; new architecture is always enabled.
- [x] Create Ops task barrel files (index exports) for new structure.

## Core

- [x] Implement `OpsSessionProvider` + `OpsServicesProvider` with persistence + dependency injection hooks.
- [x] Rebuild Ops shell (sidebar, layout, skip links) under `components/features/ops-shell`.
- [x] Dashboard: create service, hooks, and decomposed components for summary + heatmap + booking actions.
- [x] Bookings list: refactor into container/hook using services, ensure pagination/filter parity.
- [x] Walk-in booking: wrap booking flow in new container with service-driven submission.
- [x] Team management + restaurant settings: migrate to feature-driven components/hooks.
- [x] Update API/service wiring to use new services while preserving route handlers.

## UI/UX

- [x] Ensure responsive layouts for shell + primary pages (mobile-first).
- [x] Implement shared loading/empty/error states with accessible messaging.
- [x] Verify dialog focus management, skip links, semantic headings across pages.

## Tests

- [x] Unit tests for services + hooks (`useTodayBookings`, `useBookingsTableController`, `OpsSessionProvider` reducer).
- [ ] Integration tests for Dashboard + Bookings containers.
- [x] Update/Add Playwright smoke for Ops flows.
- [x] Run axe/manual accessibility checks noted in `verification.md`.

## Notes

- Assumptions: Preserve current API response shapes; backend contracts unchanged.
- Deviations: None yet.

## Batched Questions (if any)

- ...
