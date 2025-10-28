# Implementation Plan: Booking Details UX Refresh

## Objective

We will make the booking-details dialog easier to scan—surfacing key guest, contact, and status info up front while moving advanced table-assignment tooling behind a clear tab—so ops staff can take action faster on mobile and desktop.

## Success Criteria

- [ ] Default “Overview” tab shows guest/contact/notes in a compact grid with a single quick-action area (no duplicated controls).
- [ ] Manual assignment tools live inside a dedicated “Tables” tab with unchanged validation behavior.
- [ ] Dialog remains keyboard-accessible (existing hotkeys work) and responsive at ≤375px without horizontal scroll.

## Architecture & Components

- `BookingDetailsDialog` (`src/components/features/dashboard/BookingDetailsDialog.tsx`) — restructure layout, manage new tab state, consolidate lifecycle controls.
- Shadcn `Tabs` primitive (to be added under `components/ui/tabs.tsx`) — provides accessible tabbed navigation.
- Existing manual-assignment components (`ManualAssignmentSummaryCard`, `TableFloorPlan`, etc.) — reused within the “Tables” tab.

## Data Flow & API Contracts

- No backend/API changes. Manual assignment hooks (`useManualAssignmentContext`, `bookingService.manualHoldSelection`, etc.) stay intact; only the render tree changes based on active tab selection.

## UI/UX States

- Loading: maintain spinners/placeholders already present for manual context (`Loader2` overlay) but only within the “Tables” tab.
- Empty: Overview gracefully handles missing info with “Not provided” and `Badge` placeholders; tables tab continues to show “No tables assigned yet.”
- Error: Preserve existing alerts for manual assignment errors and history load failures.
- Success: Post-action toasts unchanged; UI reflects assignments within their tab.

## Edge Cases

- Ensure tab switch preserves any in-progress manual selection (don’t reset state on overview view).
- Keep keyboard shortcuts operable regardless of active tab.
- Confirm screen-reader/tab order respects new tab list and headings.

## Testing Strategy

- Unit/manual: smoke BookingDetailsDialog story by triggering dialog in dev and verifying both tabs.
- Regression: rerun affected vitest suites (`tests/server/...` unaffected; component-level tests absent).
- Accessibility: Manual keyboard + screen-reader spot check in browser (tab focus cycle, role="tablist").
- Visual: Manual QA via Chrome DevTools MCP after implementation.

## Rollout

- No feature flag; ship directly once manual verification passes.
- Monitoring: rely on existing telemetry/toasts; no new logging required.
