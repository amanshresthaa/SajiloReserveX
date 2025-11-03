# Implementation Plan: Default status to pending

## Objective

Ensure new bookings are created with status "pending".

## Steps

- Update default in `insertBookingRecord` to pending.
- Update fallback inserts in capacity transaction and route to pending.
- Typecheck and sanity test POST /api/bookings.
- Enforce status to 'pending' post-RPC creation in route.
- Update customer-facing confirmations:
  - Wizard confirmation step heading/description for pending
  - Thank-you page heading/icon and note for pending
