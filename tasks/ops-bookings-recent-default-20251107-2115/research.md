# Research: Ops Bookings Recent Filter Default

## Requirements

- Functional:
  - Ensure `/ops/bookings` defaults to the "Recent" filter for status tabs when no `filter` parameter is provided.
  - Preserve ability to deep link with other filters (e.g., `filter=upcoming`) without regression.
- Non-functional:
  - Keep URL clean (omit `filter` query when the default is being used).
  - Maintain existing pagination/reset behavior tied to filter changes.

## Existing Patterns & Reuse

- `src/app/(ops)/ops/(app)/bookings/page.tsx` parses `searchParams` and passes `initialFilter` into `OpsBookingsClient`.
- `OpsBookingsClient` (`src/components/features/bookings/OpsBookingsClient.tsx`) defines `DEFAULT_FILTER` (`'upcoming'`) used whenever no initial filter is supplied; tab control uses that constant when syncing query params.
- Search param synchronization already removes the `filter` key when the selected value equals `DEFAULT_FILTER`.

## External Resources

- None required; change is internal UI logic.

## Constraints & Risks

- Need to ensure `DEFAULT_FILTER` change updates both initial render and query param reset logic.
- Verify `OpsStatusFilter` type still includes `'recent'` (confirmed in `hooks/useOpsBookingsTableState`).
- Watch for tests assuming `'upcoming'` default; update if necessary.

## Open Questions (owner, due)

- Any analytics or stakeholders rely on "Upcoming" being default? (assume ok based on user request.)

## Recommended Direction (with rationale)

- Update `DEFAULT_FILTER` constant in `OpsBookingsClient` to `'recent'` so all initialization + routing logic inherits the new default with minimal change footprint.
- Double-check any server-side code or tests referencing `'upcoming'` as default; adjust or document if needed.
- Re-run lint/typecheck to ensure no dead references; manual QA by loading `/ops/bookings` (blocked without creds, note if unable).
