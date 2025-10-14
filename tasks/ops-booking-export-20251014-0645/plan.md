# Implementation Plan: Ops Booking Export

## Objective

We will enable ops team members to export the day’s reservations for the active restaurant so that they can print a service sheet and keep an offline backup.

## Success Criteria

- [ ] A “Download CSV” control appears on `/ops`, scoped to the selected restaurant/date, and triggers a CSV download in the browser.
- [ ] The CSV contains at least time, guest, party size, status, contact, and notes columns for every booking returned by the dashboard summary.
- [ ] Unauthorized or membership-mismatched requests are rejected (403/401), and UI surfaces an actionable error state (toast).

## Architecture & Components

- `app/api/ops/bookings/export/route.ts`: new route cloning the customer export auth pattern, delegating to `getTodayBookingsSummary` for data.
- `src/components/features/dashboard/ExportBookingsButton.tsx`: client-side download button modeled after `ExportCustomersButton`.
- `src/components/features/dashboard/DashboardSummaryCard.tsx`: accept `restaurantId` & `exportDate`, render the new button in the header actions row.
- `src/components/features/dashboard/OpsDashboardClient.tsx`: pass `restaurantId`, `summary.date`, and `restaurantName` into the summary card.

## Data Flow & API Contracts

Endpoint: `GET /api/ops/bookings/export`

Query parameters:

- `restaurantId` (uuid, required)
- `date` (YYYY-MM-DD, optional – defaults to restaurant-local “today” if omitted)

Response: `text/csv; charset=utf-8` with BOM. Each row includes
`Service Time`, `Guest`, `Party Size`, `Status`, `Email`, `Phone`, `Reference`, `Source`, `Loyalty Tier`, `Allergies`, `Dietary`, `Notes`.

Errors:

- `401` when unauthenticated
- `403` when user lacks membership for restaurant
- `400` for validation failure
- `500` for unexpected Supabase/query issues (logged server-side)

## UI/UX States

- Loading: button switches to `Exporting…`, disabled to prevent duplicate requests.
- Success: toast “Booking export ready.”, browser download triggered.
- Error: toast “Unable to export bookings. Please try again.”, button re-enabled.

## Edge Cases

- No bookings present → CSV still includes headers, zero data rows.
- Missing/invalid date parameter → route falls back to validated today date.
- Bookings with missing times/details → ensure formatting gracefully degrades (e.g., “Time TBC”, empty strings).
- Special characters in guest names/notes → rely on `generateCSV` escaping + BOM to preserve encoding.

## Testing Strategy

- Unit: add `tests/server/ops/booking-export-route.test.ts` verifying auth path, header metadata, and CSV content.
- Integration: rely on existing dashboard summary coverage; optional Playwright smoke left out for scope (document in verification).
- Accessibility: button uses standard `<Button>` component; ensure `aria-label` covers loading state.

## Rollout

- Feature flag: not required (small additive capability, no user-facing risk); document in verification.
- Exposure: full release once merged.
- Monitoring: rely on server logs for export errors; note in verification if further telemetry desired.
