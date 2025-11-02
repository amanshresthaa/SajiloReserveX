# Research: Booking Dialog Table Availability

## Requirements

- Functional: In booking details dialog (Ops), hide or block tables that are not available during the booking’s window. Prefer only showing available tables.
- Non-functional: Accessibility (labels, focus), minimal UI disruption.

## Existing Patterns & Reuse

- TableFloorPlan already differentiates selected/owned/assigned/blocked/inactive.
- ManualAssignmentContext provides holds and conflicts per table for the booking window.

## External Resources

- N/A

## Constraints & Risks

- Performance: filtering must be light; lists are modest.
- UX: Hiding tables may confuse; add a toggle.

## Open Questions (owner, due)

- Should default be hide or grey? (Assumed: hide by default.)

## Recommended Direction (with rationale)

- Add a "Only show available" toggle (default on) in the Tables tab.
- Filter out unavailable (inactive, held by others, or conflicting) while keeping assigned/held-by-this booking visible.
