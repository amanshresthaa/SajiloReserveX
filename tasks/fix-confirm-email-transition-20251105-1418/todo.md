# Implementation Checklist

## Setup

- [x] Create migration to qualify `public.bookings.status` in transition function.

## Core

- [x] Apply function replacement remotely via psql.
- [x] Transition affected booking to `confirmed` using the function.
- [x] Send confirmation email using one-off script.

## Verification

- [x] Verify `bookings.status` is `confirmed`.
- [x] Verify two rows in `booking_table_assignments` remain intact.
- [x] Verify email sent (Resend log ID printed).

## Notes

- Assumptions: Direct function replacement is safe and idempotent.
- Deviations: Used direct psql execution due to migration history mismatch on remote.
