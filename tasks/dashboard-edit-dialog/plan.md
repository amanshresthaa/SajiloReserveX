# Dashboard Edit Dialog — Plan

## Goal

Deliver Story D1: add an edit/reschedule dialog accessible from each booking row, using RHF + zod, wiring PUT `/api/bookings/[id]`, mapping server errors, and refreshing the bookings list.

## Steps

1. **Infrastructure**
   - Add `components/ui/dialog.tsx` from shadcn preset (supports modal structure w/ focus trap).
   - Create helper utilities for datetime conversion (ISO ↔ `datetime-local`).

2. **Mutation Hook**
   - Implement `hooks/useUpdateBooking.ts` using React Query `useMutation`, calling `fetchJson` with `PUT /api/bookings/{id}`.
   - On success, invalidate `queryKeys.bookings.list` and optionally `queryKeys.bookings.all`.

3. **Dialog Component**
   - Build `components/dashboard/EditBookingDialog.tsx` that accepts booking data & open state, uses RHF + zod resolver.
   - Fields: start, end (`datetime-local` inputs), party size (number), notes (textarea). Show server error messages in form.
   - Map server error codes to UI copy per spec. Emit analytics events on open/submit/success/fail.
   - Surface loading states (disable submit, show spinner). On success, close dialog and toast success.

4. **Table Integration**
   - Update `BookingsTable` to render Manage button that opens dialog for selected booking (skip cancelled rows). Manage button triggers `booking_edit_opened` event.
   - Manage local state in `BookingsTable` or wrap in parent page to control dialog. Probably manage in `DashboardPage` to ensure single dialog instance.

5. **Validation & Error Handling**
   - Add zod schema ensuring start < end, party size >0, required fields. Provide inline errors.

6. **Testing**
   - Add RTL tests for `EditBookingDialog` verifying validation, error mapping, success flows (mock mutation). Use Vitest + Testing Library in `components/dashboard/__tests__/EditBookingDialog.test.tsx`.

7. **Docs**
   - Update task TODO + notes; mention manual QA steps.

## Verification

- Run `pnpm test` targeting new test suite.
- Manual: edit booking from `/dashboard`, ensure modal opens, successful edit triggers toast & list refresh, error codes display proper message.
