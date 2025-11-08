# Research: Guest Edit Warning Copy

## Requirements

- Functional:
  - Surface a clear warning inside the guest edit booking dialog informing users that changing details releases their existing table and availability is not guaranteed.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Warning must be accessible (role, readable text) and respect existing design system.
  - No additional network requests; purely UI copy.

## Existing Patterns & Reuse

- `components/dashboard/EditBookingDialog.tsx` already renders alerts for errors and missing schedule metadata.
- `@/components/ui/alert` provides a consistent warning style used elsewhere (e.g., reservation warnings list in `src/app/reserve/[reservationId]/ReservationDetailClient.tsx`).

## External Resources

- N/A – copy provided by stakeholder.

## Constraints & Risks

- Must not block edits; warning is informational.
- Ensure copy makes it clear tables may not be immediately available to avoid surprise pending status.

## Open Questions (owner, due)

- None.

## Recommended Direction (with rationale)

- Add a non-dismissable `Alert` with `variant="warning"` near the top of `EditBookingDialog` so users see it before changing details. This leverages existing UI components, keeps copy scoped to guest edits, and avoids duplicating logic elsewhere.
