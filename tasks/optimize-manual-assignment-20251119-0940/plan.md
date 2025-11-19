# Implementation Plan: Optimize Manual Table Assignment

## Objective

Simplify the manual table assignment UI and improve performance by reducing re-renders and consolidating controls.

## Proposed Changes

### 1. UI Simplification

- **Remove**: `ManualAssignmentSummaryCard` and `ManualAssignmentValidationPanel`.
- **Create**: `AssignmentToolbar` component.
  - **Location**: Sticky footer or top bar within the "Tables" tab.
  - **Content**:
    - Selected Table Count / Capacity.
    - Validation Status (Icon + Tooltip).
    - "Assign" Button (Primary).
    - "Clear" Button (Ghost).
- **Remove**: "Slack" and "Zone" information from the UI.

### 2. Performance Optimization

- **Component Isolation**: Extract the content of the "Tables" tab into a new component `BookingAssignmentTabContent`.
  - This component will hold the `selectedTables` state.
  - This prevents the parent `BookingDetailsDialog` (and the Sidebar) from re-rendering when tables are selected.
- **Memoization**: Ensure `TableFloorPlan` is strictly memoized.

### 3. Code Cleanup

- Delete `ManualAssignmentSummaryCard.tsx` and `ManualAssignmentValidationPanel.tsx` after migration.
- Update `BookingDetailsDialog.tsx` to use the new `BookingAssignmentTabContent`.

## Detailed Steps

1.  **Create `AssignmentToolbar`**: A compact component for actions and status.
2.  **Create `BookingAssignmentTabContent`**: Move logic from `BookingDetailsDialog` (lines ~1200-1400) into this new component.
3.  **Refactor `BookingDetailsDialog`**: Replace the "Tables" tab content with `<BookingAssignmentTabContent booking={booking} />`.
4.  **Verify**: Check that selecting tables is snappy and doesn't lag.

## Risks

- **State Sync**: ensuring the new component syncs correctly with the parent if needed (though it should be self-contained).
- **Realtime**: The underlying `useManualAssignmentContext` is still heavy, but isolating the render cost will help significantly.
