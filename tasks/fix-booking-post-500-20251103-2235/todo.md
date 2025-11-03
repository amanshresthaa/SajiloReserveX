# Implementation Checklist

## Setup

- [x] Create task folder and SDLC docs

## Core

- [x] Add recovery lookup on POST `/api/bookings` when booking is missing
- [x] Emit `booking.create.recovered` observable event and fallback insert

## Tests

- [x] Manual API call: POST /api/bookings returns 201
- [ ] Manual wizard flow (UI) validates end-to-end

## Notes

- Assumptions: RPC may return success without record; DB still created the row.
- Deviations: None
