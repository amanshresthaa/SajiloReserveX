---
task: booking-manual-assignment-map
timestamp_utc: 2025-11-17T20:17:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Research: Consolidate Booking Manual Assignment Map

## Requirements

- Functional:
  - Provide a single canonical JSON map for booking manual assignment, located at `/manual-assignment-map.json`.
  - Ensure the map captures the authoritative backend + frontend surfaces involved in manual assignment (APIs, engine/core logic, data access, UI touchpoints).
  - Remove or avoid duplicate/distributed mappings so future edits happen in one place.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Documentation-only change; keep JSON valid/pretty for easy diffing.
  - Avoid stale references; align paths with current code layout.
  - No secrets or runtime behavior changes.

## Existing Patterns & Reuse

- `docs/manual-assignment-map.json` already documents backend/front-end areas for manual table assignment.
- Manual assignment flow implemented across `src/app/api/staff/manual/{validate,hold,confirm}/route.ts`, `server/capacity/table-assignment/manual.ts` + helpers, and surfaced to clients via `server/capacity/engine/public-api.ts` exports.
- Frontend relies on `src/services/ops/bookings.ts` methods, `src/hooks/ops/useManualAssignmentContext.ts`, and UI in `src/components/features/dashboard/BookingDetailsDialog.tsx`.
- `context/table-assignment-code.json` and `manual_assignment_redesign_proposal.md` provide broader context on the domain.

## External Resources

-

## Constraints & Risks

- Risk of duplication if the old `docs/manual-assignment-map.json` lingers alongside the new canonical file.
- Must ensure listed files/roles reflect current engine exports (e.g., `server/capacity/engine/public-api.ts` -> `validateManualSelection`, `holdManualSelection`, `getManualContext`).
- Keep JSON small and scoped so it stays maintainable and does not fall out of date.

## Open Questions (owner, due)

- Q: None identified
  A: N/A

## Recommended Direction (with rationale)

- Promote a single source of truth by creating `/manual-assignment-map.json` at repo root, populated from the current `docs/manual-assignment-map.json` and updated to reflect the latest manual-assignment surfaces.
- Remove the old `docs/` copy to eliminate duplication; if needed in the future, point docs to the root file instead of maintaining two copies.
