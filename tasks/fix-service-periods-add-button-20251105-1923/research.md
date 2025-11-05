# Research: Add Multiple Service Periods in Ops

## Requirements

- Functional: Allow ops users to add more than one service period in Restaurant Settings.
- Non-functional: Maintain existing validation (required fields, non-overlap, valid times), accessibility of controls.

## Existing Patterns & Reuse

- UI component `ServicePeriodsSection` already supports multiple rows and client-side validation.
- API `PUT /api/owner/restaurants/[id]/service-periods` accepts arrays; server validates overlaps and times.

## External Resources

- Internal server logic validates overlap: `server/restaurants/servicePeriods.ts`.

## Constraints & Risks

- Ensure Add button available when list is non-empty; avoid regressions to keyboard/focus behavior.

## Open Questions (owner, due)

- Should Add also appear in header? (Owner: Ops UX, Due: post-merge)

## Recommended Direction (with rationale)

- Add a persistent "Add service period" button in the footer actions alongside Reset/Save. This is minimal, discoverable, and reuses the existing `addPeriod` logic. Keep empty-state Add for zero rows.
