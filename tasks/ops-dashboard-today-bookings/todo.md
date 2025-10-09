# Implementation Checklist

## Server

- [x] Add timezone helpers for consistent date formatting.
- [x] Create `getTodayBookingsSummary` with counts & booking list.

## UI

- [x] Introduce `/ops` dashboard page with auth guard.
- [x] Build `TodayBookingsCard` component showing metrics + schedule.

## Verification

- [ ] Seed or observe data to confirm counts and list accuracy.
- [ ] Document known typecheck failures unrelated to this feature.
