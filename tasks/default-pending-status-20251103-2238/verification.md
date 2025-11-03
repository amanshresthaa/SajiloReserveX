# Verification Report

## API

- [x] POST /api/bookings returns booking with status "pending" (manual curl)
- [ ] RPC-present environment: ensure route enforces pending when RPC returns confirmed

## UI

- [ ] Wizard confirmation shows "Booking pending" and pending note
- [ ] Thank-you page shows pending header and note
- [ ] My bookings list shows status Pending for the new booking

## Notes

- Ops endpoints still create confirmed bookings explicitly; not changed.
