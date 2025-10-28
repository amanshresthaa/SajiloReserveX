# Research: Booking Details UX Refresh

## Existing Patterns & Reuse

- `src/components/features/dashboard/BookingDetailsDialog.tsx` drives the entire booking detail dialog, combining lifecycle actions, guest metadata, manual table assignment, and history modals inside one `Dialog` (`BookingDetailsDialog` definition around :100). It already uses Shadcn primitives like `Dialog`, `Badge`, `Button`, and custom floorplan/assignment widgets.
- Summary metadata is rendered via `InfoRow` cards in a 2-column grid (`BookingDetailsDialog.tsx:746-755`), while guest profile segments reuse badges/icons inline (`BookingDetailsDialog.tsx:766-845`).
- Manual table assignment reuses shared components—`TableFloorPlan`, `ManualAssignmentSummaryCard`, `ManualAssignmentValidationPanel`, `ManualAssignmentActions`—within a single bordered section (`BookingDetailsDialog.tsx:850-960`).
- Lifecycle controls are duplicated both in the header stack and again in a sidebar-style card at the bottom (`BookingDetailsDialog.tsx:729-742` and `BookingDetailsDialog.tsx:970-988`), signalling an opportunity to consolidate.

## External Resources

- Shadcn UI `tabs` primitive is not currently present under `components/ui`, so adding it via the Shadcn MCP tool will likely be required before introducing tabbed navigation.
- Observability/booking history already exposed via `bookingService.getBookingHistory` and a secondary dialog (`BookingDetailsDialog.tsx:1002-1053`), meaning we can link to it instead of re-implementing timeline UI.

## Constraints & Risks

- Manual assignment context fetch (`useManualAssignmentContext`) is keyed off dialog `isOpen`; heavy UI reorganisation must keep this data accessible for multi-table workflows without regressing adjacency/validation behavior.
- Keyboard shortcut handling (`handleKeyDown`, `BookingDetailsDialog.tsx:555-621`) must continue to operate after layout changes; tab navigation cannot interfere with hotkeys.
- Dialog height is capped (`max-h-[85vh]`), so adding additional vertical chrome could reintroduce scrolling pain—improvements should streamline, not expand, content.

## Open Questions (and answers if resolved)

- Q: Can we defer manual assignment rendering until a user opts into that view?
  A: The context query enables when `isOpen`; we can conditionally render the heavy floor plan behind a tab while leaving data fetching untouched to avoid refactor risk.
- Q: Do we already have a Shadcn `Tabs` component available?
  A: No—`components/ui` lacks `tabs.tsx`, so we must add it via the Shadcn MCP workflow before use.

## Recommended Direction (with rationale)

- Introduce a tabbed layout separating the dense manual-assignment tooling from the overview to improve scanability for hosts, dramatically shortening the default view on mobile.
- Consolidate lifecycle actions into a single “Quick actions” block near the header to remove duplication and repeated controls.
- Refine the overview into semantic cards (contact info, booking metadata, guest profile) for better hierarchy, leveraging existing Shadcn `Card`, `Badge`, and icon patterns.
- Keep manual assignment components intact but wrap them in a dedicated tab with contextual helper text so advanced controls remain accessible without overwhelming the initial UI.
