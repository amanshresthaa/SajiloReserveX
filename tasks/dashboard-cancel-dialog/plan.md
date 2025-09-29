# Dashboard Cancel Dialog — Plan

## Goal

Implement Story D2: add a cancel confirmation dialog with proper analytics, mutation, toast, and UI refresh for each booking row.

## Steps

1. **Mutation Hook**
   - Create `hooks/useCancelBooking.ts` (React Query mutation hitting `DELETE /api/bookings/{id}`) with analytics events (`booking_cancel_confirmed`, `booking_cancel_succeeded`, `booking_cancel_failed`), invalidate bookings list, toast outcome.

2. **Dialog Component**
   - Build `components/dashboard/CancelBookingDialog.tsx` using existing dialog primitives. Display booking summary (restaurant, date/time, party size) and confirm CTA.
   - Ensure keyboard accessibility (Enter confirm via `type="submit"`, Escape closes) and analytics emission when opened.

3. **Table Integration**
   - Update actions column to present both Edit and Cancel (button group or dropdown). Manage local state for cancel target in dashboard page similar to edit.
   - Disable cancel button for already cancelled bookings.

4. **Tests**
   - RTL test for dialog verifying mutation invoked, analytics triggered (can mock), error message mapping.

5. **Docs**
   - Update task TODO/notes; mention manual QA.

## Verification

- `pnpm test` including new test suite.
- Manual: open `/dashboard`, cancel booking, ensure status chip updates, actions disable, analytics logs observed.
