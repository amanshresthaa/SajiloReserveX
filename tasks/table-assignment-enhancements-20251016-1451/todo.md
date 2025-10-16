# Implementation Checklist

## Setup

- [x] Confirm data structures for `OpsTodayBooking` and Supabase relationships.
- [x] Scaffold new API route directories for table assignment operations.

## Core

- [x] Extend `getTodayBookingsSummary` + types to include table assignments/flags.
- [x] Implement server-side auto assignment algorithm + helper to run per-date.
- [x] Add API routes for auto-assign, manual assign, and unassign with membership checks.
- [x] Update booking service + new hook for table assignment mutations.

## UI/UX

- [x] Show table assignment badge in `BookingsList`.
- [x] Enhance `BookingDetailsDialog` with assignment section, select, and controls.
- [x] Add auto-assign button in reservations header hooked to mutation feedback.

## Tests

- [x] Update `getTodayBookingsSummary` tests for assignment data.
- [x] Add unit tests for combination helper/auto-assign logic and route behaviors.

## Notes

- Assumptions: Auto-assign processes all unassigned bookings for selected date; default seating duration = 90 minutes when end time missing.
- Deviations: None yet.

## Batched Questions (if any)

- TBD
