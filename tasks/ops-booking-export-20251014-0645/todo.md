# Implementation Checklist

## Setup

- [x] Align with user on CSV column expectations (time, guest, party size, status, contact, notes) — update plan if feedback differs.

## Core

- [x] Add `GET /api/ops/bookings/export` route with auth, membership validation, CSV generation via `getTodayBookingsSummary`.
- [x] Write `tests/server/ops/booking-export-route.test.ts` covering happy path + headers.

## UI/UX

- [x] Build `ExportBookingsButton` component (loading state, success/error toasts, filename handling).
- [x] Wire button into `DashboardSummaryCard` header and pass props from `OpsDashboardClient`.
- [x] Ensure button accessible label reflects exporting state.

## Tests

- [x] Run `pnpm vitest tests/server/ops/booking-export-route.test.ts` (or suite) and capture results in verification.

## Notes

- Assumptions: CSV may be downloaded even when no bookings exist (yields header-only file).
- Deviations: Manual Chrome DevTools MCP QA still pending once UI is running locally.

## Batched Questions (if any)

- None.
