# Research: Default booking status to "pending"

## Requirements

- Make initial booking status "pending" for all creation paths.
- Preserve validation, capacity enforcement, and side-effects.

## Existing Patterns & Reuse

- `insertBookingRecord` defaulted to confirmed.
- `createBookingWithoutCapacity` explicitly passed `status: "confirmed"`.
- Route POST fallback insert passed `status: "confirmed"`.

## Recommended Direction

- Change default in `insertBookingRecord` to pending.
- Update both fallback insert sites to pending.
- Leave RPC path unchanged (DB may continue to return confirmed if that’s business logic; adjust later if needed).
