# Research: Optimize Manual Table Assignment

## Objective

Identify root causes of slowness in manual table assignment and simplify the UI/UX by removing legacy components.

## Current Architecture

- **State Management**: `useManualAssignmentContext` fetches `ManualAssignmentContextWithSession` (tables, holds, conflicts) and subscribes to realtime updates on `allocations`, `table_holds`, and `booking_table_assignments`.
- **Rendering**: `TableFloorPlan` renders tables using absolute positioning. It computes layout (`computeLayout`) on every render where data changes.
- **Interaction**: `BookingDetailsDialog` manages local state (`selectedTables`, `validationResult`). Toggling a table triggers a full dialog re-render.
- **Validation**: Explicit "Validate" action triggers a server-side check.

## Performance Bottlenecks

1.  **Heavy Re-renders**: `TableFloorPlan` re-calculates layout whenever `tables`, `holds`, or `conflicts` change. Realtime updates can trigger this frequently.
2.  **Context Fetching**: The entire context is refetched on any realtime event. If the payload is large, this is slow.
3.  **Dialog Re-renders**: Toggling a table selection updates state in `BookingDetailsDialog`, causing the entire modal (including the Sidebar and Header) to re-render.

## Legacy & Complex Components

1.  **`ManualAssignmentSummaryCard`**: Displays detailed capacity, zone, and hold info. Much of this (like "Slack", "Zone") might be overkill for a quick assignment task.
2.  **`ManualAssignmentValidationPanel`**: A dedicated card for validation messages. Could be integrated into a simpler status area.
3.  **`ManualAssignmentActions`**: Separate buttons for Validate/Confirm/Clear.

## Simplification Opportunities

1.  **Unified Control Bar**: Replace the Summary Card and Validation Panel with a compact "Assignment Toolbar" at the bottom or top of the floor plan.
2.  **Optimized Floor Plan**:
    - Memoize `computeLayout` more aggressively.
    - Prevent `TableFloorPlan` from re-rendering if only `selectedTables` changes (pass selection as a separate signal or context, or just optimize the props).
3.  **Streamlined Workflow**:
    - Auto-validate on selection change (debounced) instead of requiring a manual click? Or keep manual but make it faster.
    - Remove "Slack" and "Zone" details unless critical.

## Proposed Strategy

1.  **Refactor UI**: Create a new `AssignmentControls` component that combines summary, validation, and actions.
2.  **Optimize State**: Move assignment state (`selectedTables`, `validationResult`) into a separate context or smaller component to avoid re-rendering the whole dialog.
3.  **Simplify Floor Plan**: Ensure `TableFloorPlan` only re-renders when necessary.

## Questions

- Do we need "Zone" and "Slack" info? (Likely legacy).
- Can we move `selectedTables` state down to the `Tables` tab content only? (Yes).
