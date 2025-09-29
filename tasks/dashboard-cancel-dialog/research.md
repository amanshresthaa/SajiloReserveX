# Dashboard Cancel Dialog — Research

## Task Outline & Subtasks

- Review existing dashboard table and edit dialog integration to understand how row actions are wired.
- Examine `/api/bookings/[id]` DELETE handler to confirm payload/response and error codes.
- Identify available UI primitives (dialog, button, toast, analytics emitter) and reuse patterns from edit flow.

## Findings

- `BookingsTable` now invokes `onEdit` for Manage button; we will extend actions to include cancel (likely via secondary button or dropdown). Need to ensure status chips update to `cancelled` post-success.
- API: `DELETE /api/bookings/[id]` exists in `app/api/bookings/[id]/route.ts`. Need to confirm DoD: server logs `booking_cancelled`, sending email, expecting 200. Errors likely `BOOKING_NOT_FOUND`, `FORBIDDEN`, `CUTOFF_PASSED`. Need to map to user-friendly copy similar to edit flow.
- UI: Already have dialog primitives and toasts; can reuse `components/ui/dialog.tsx`. Should implement `CancelBookingDialog` with confirmation text, accessible buttons, optional textarea? spec says confirmation dialog with keyboard shortcuts (Enter confirm, Esc cancel). Provide analytics events `booking_cancel_confirmed`, `booking_cancel_succeeded`, `booking_cancel_failed`.
- Mutation: create `hooks/useCancelBooking.ts` with React Query mutation hitting DELETE, invalidating bookings query. On success, toast and analytics, disable actions in UI. Maybe also optimistic update by invalidating or adjusting local state.
- Tests: Add RTL test verifying cancel button triggers mutation and error mapping.

## Considerations & Risks

- Manage state for both edit and cancel; likely maintain in page component with separate state (active booking for dialog). Ensure that cancel dialog prevents re-opening while pending.
- UI layout: Manage button currently single ghost button; need to decide on dropdown or row of buttons (edit/cancel). For this sprint, maybe transform Manage button into `More` menu or `Button` group containing `Edit` and `Cancel`. For accessibility, ensure labels and `aria` states.
- Prevent cancel for already cancelled bookings (button disabled). Ensure `booking.status` updates after invalidation.

## Open Questions

- Should cancel confirm show details (date/time)? We'll display summary inside dialog.
