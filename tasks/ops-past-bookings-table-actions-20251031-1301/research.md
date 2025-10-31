# Research: Ops Past Bookings Table Assignment Handling

## Requirements

- Functional:
  - Hide or disable table-assignment controls (auto + manual) when viewing a service date that is already in the past.
  - Prevent misleading “Table assignment required” messaging on past bookings.
  - Treat individual bookings whose service time has already passed as read-only even if the date is today.
  - Highlight bookings starting within the next 15 minutes so ops can prioritise assignments.
  - Surface clear visual cues when staff action is required (e.g., check-in once service starts, check-out once service ends).
- Non-functional (a11y, perf, security, privacy, i18n):
  - Respect restaurant timezone when deciding whether a date is “past”.
  - Maintain dashboard performance by reusing existing summary data (no extra fetch).
  - Ensure disabled/hidden actions remain keyboard-accessible for valid dates (no regressions).

## Existing Patterns & Reuse

- `OpsDashboardClient` (src/components/features/dashboard/OpsDashboardClient.tsx) already derives `summary.date` and `summary.timezone`, and uses `getTodayInTimezone` helper downstream (e.g., `BookingActionButton` gating check-ins to same-day).
- `BookingsList` computes `supportsTableAssignment` based on `onAssignTable`/`onUnassignTable` callbacks; can be extended with a flag to disable assignment UI.
- `BookingDetailsDialog` sets `lifecycleAvailability.isToday` via `getTodayInTimezone(summary.timezone) === summary.date` to gate lifecycle actions; similar pattern can be reused to suppress the “Tables” tab / manual assignment tooling.
- Luxon is already in the project; we can reuse `DateTime` to compare booking `startTime` (HH:mm) against the current time in the restaurant timezone.

## External Resources

- `lib/utils/datetime.ts` provides `getTodayInTimezone` and date helpers—no external API required.

## Constraints & Risks

- Summary dates are strings in `YYYY-MM-DD`. Direct lexical comparison works but must account for timezone to avoid off-by-one errors.
- Manual assignment dialog currently assumes table actions are available; hiding the tab must not break other layout or state transitions.
- Need to avoid breaking automated/no-show workflows which still rely on `BookingsList` even for past dates.
- Rendering should update over time (minute cadence) without requiring a full refresh so near-term bookings move between states predictably.
- Action indicators must work alongside existing status badges and remain readable against altered card backgrounds.

## Open Questions (owner, due)

- Q: Should users still be able to view historical table assignments (read-only) while preventing changes?
  A: Default to read-only messaging (badge can reflect historical assignment); disable mutation actions but keep visual context.

## Recommended Direction (with rationale)

- Derive `const isPastServiceDate = summary.date < getTodayInTimezone(summary.timezone)` in `OpsDashboardClient`.
- Gate the auto-assign button and table assignment handlers via a new `allowTableAssignments` boolean passed to child components; adjusts messaging to “Past service — assignments locked”.
- Update `BookingDetailsDialog` to hide/disable the manual assignment tab when `allowTableAssignments` is false, keeping overview/history accessible.
