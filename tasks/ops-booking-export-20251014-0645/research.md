# Research: Ops Booking Export

## Existing Patterns & Reuse

- `app/(ops)/ops/(app)/page.tsx` renders the Ops dashboard and already resolves the active restaurant + selected date state via `OpsDashboardClient`.
- `src/components/features/dashboard/OpsDashboardClient.tsx` owns the `selectedDate` state and passes booking data into the card view—central point to wire an export trigger.
- `src/components/features/dashboard/DashboardSummaryCard.tsx` houses the “Today’s service snapshot” card where actions related to the day’s bookings live; good anchor for a download action.
- `src/components/features/customers/ExportCustomersButton.tsx` provides a fully built CSV download button pattern (loading state, filename handling, error toasts) we can adapt.
- `app/api/ops/customers/export/route.ts` demonstrates the auth/membership guard, Supabase service client usage, and CSV response headers we should mirror.
- `server/ops/bookings.ts#getTodayBookingsSummary` already loads the date-scoped booking dataset (with loyalty/profile enrichments) we need for the CSV payload.
- `lib/export/csv.ts` exposes `generateCSV` and escaping helpers; reuse for consistent CSV output and BOM handling.

## External Resources

- [MDN — `Content-Disposition` header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition) to ensure filename compatibility (already leveraged in customer export).
- [WCAG 2.2 — Operable interface controls](https://www.w3.org/TR/WCAG22/#operable) reminder to expose the download via an accessible button; handled by reusing existing button component.

## Constraints & Risks

- Must respect Ops membership permissions: only export bookings for restaurants the user can access (follow `fetchUserMemberships` pattern).
- Date handling needs to align with restaurant timezone; `getTodayBookingsSummary` already normalizes dates, but we must accept an explicit `date` query to support “other date” exports.
- CSV should include all bookings regardless of the client-side status filter so printout is complete; ensure column order and formatting work well for print.
- Large booking volumes could make CSV generation slower, but relying on existing summary query (already used in dashboard) limits risk; still guard with caching headers off.

## Open Questions (and answers if resolved)

- Q: Should export respect the current status filter (e.g., only “completed”)?  
  A: For printing, exporting the full day is safer; we can note in plan to export all bookings for the selected date.
- Q: File naming convention preferred?  
  A: Follow customer export style: `bookings-<restaurant>-<yyyy-mm-dd>.csv`.
- Q: Do we need PDF/print layout?  
  A: Request only mentions download for printing; CSV is acceptable and consistent with existing exports.

## Recommended Direction (with rationale)

- Add `app/api/ops/bookings/export/route.ts` that authenticates, validates `restaurantId` + optional `date`, checks membership, uses `getTodayBookingsSummary` to load data, and streams CSV via `generateCSV`.
- Create `ExportBookingsButton` client component (likely in `src/components/features/dashboard/`) replicating the customer export UX but passing `restaurantId`, `restaurantName`, and `selectedDate`.
- Plumb `restaurantId`/`selectedDate` props through `OpsDashboardClient` → `DashboardSummaryCard` and render the new export button alongside the summary header controls for visibility.
- Update hooks/tests if required to cover the new API; document CSV columns in plan to ensure they capture time, guest, party size, status, contact, notes for easy print reference.
