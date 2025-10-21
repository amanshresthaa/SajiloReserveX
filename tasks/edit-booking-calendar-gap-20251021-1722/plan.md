# Implementation Plan: Edit Booking Calendar Gap

# Implementation Plan: Edit Booking Calendar Gap

## Objective

We will eliminate the phantom “skipped day” in booking calendars and rework booking edits to use a fixed, restaurant-configured duration so that both dashboard and `/reserve` flows stay consistent and predictable.

## Success Criteria

- [ ] Calendar date pickers never hide the current day when the minimum timestamp includes a same-day time.
- [ ] End times in dashboard/Ops editing are no longer user-editable; they auto-align to the configured duration.
- [ ] `/reserve` retains the same auto-duration behaviour and shows continuous dates.

## Architecture & Components

- `components/dashboard/EditBookingDialog.tsx`: remove end-time input, compute derived end timestamp.
- `hooks/useUpdateBooking.ts` & related call sites: pass derived end ISO without exposing control to the user.
- `src/components/features/booking-state-machine/TimestampPicker.tsx` & `reserve/features/.../Calendar24Field.tsx`: normalize min/max comparisons to day-level to stop premature disabling.
- `src/app/api/bookings/[id]/route.ts`: safeguard server-side duration enforcement.
- Shared calendar utilities remain intact; only comparison logic changes to avoid regressions elsewhere.

## Data Flow & API Contracts

- Update payload stays `{ startIso, partySize, notes }` on the client, with `endIso` computed client-side using `start + duration`. Server continues to validate `start < end` and ignores caller-provided durations.
- Duration source: prefer restaurant configuration; fallback to the booking’s current duration if config unavailable.
- `/reserve` wizard already stores `reservationDurationMinutes`; ensure min-date comparison respects day granularity.

## UI/UX States

- Edit dialog shows read-only summary (e.g., “Automatically ends at 7:30 PM (90 min)”) instead of a picker.
- Calendar date pickers show continuous grids; disabled days only when legitimately before min date or beyond max range.
- Error states continue to highlight invalid start times (past or overlapping) as today.

## Edge Cases

- Bookings spanning multiple days: derived end uses duration; ensure it doesn’t exceed configured max (clamp if min+duration crosses maxDate).
- Missing restaurant duration: fall back to booking’s existing duration, preventing sudden shrink/extend.
- Ensure timezone handling remains correct when normalizing day comparisons.

## Testing Strategy

- Unit tests for `TimestampPicker` and `Calendar24Field` disable logic covering same-day min.
- Update `EditBookingDialog` tests to assert absence of end picker and correct derived payload.
- Regression/unit coverage for API update ensuring forced duration remains valid.
- Manual QA for dashboard and `/reserve` flows (Chrome DevTools MCP) across viewports.

## Rollout

- No feature flag; ship as behaviour fix.
- Monitor booking update errors post-deploy; add verification notes in `verification.md`.
