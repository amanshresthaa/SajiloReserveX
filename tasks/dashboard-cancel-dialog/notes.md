# Dashboard Cancel Dialog — Notes

- Cancel confirmation dialog uses shadcn modal, shows reservation summary, and blocks repeated submissions while pending.
- Mutation hook hits `DELETE /api/bookings/{id}`, emits analytics (`booking_cancel_confirmed/succeeded/failed`), invalidates bookings queries, and fires toasts.
- Actions column now exposes separate Edit and Cancel buttons (disabled for cancelled bookings); cancel dialog managed from dashboard page state.
- Tests: `reserve/tests/unit/CancelBookingDialog.test.tsx` covers successful confirmation + error-mapping scenario.
- Manual QA: open `/dashboard`, trigger cancel, ensure toast and list refresh; attempt cancel on cut-off scenario to view inline error.
