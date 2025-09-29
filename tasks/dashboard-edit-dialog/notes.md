# Dashboard Edit Dialog — Notes

- Manage button now opens `EditBookingDialog`, disabled for cancelled bookings.
- Dialog uses RHF + zod, emits analytics on open/submit/success/failure, and maps server error codes via helper copy.
- Update mutation uses React Query, invalidates bookings list, and triggers toast notifications.
- Tests (`reserve/tests/unit/EditBookingDialog.test.tsx`) cover validation (end before start) and server error mapping.
- Manual QA: edit future booking, adjust times/party size, confirm toast + table refresh; simulate server error to view mapped message.
