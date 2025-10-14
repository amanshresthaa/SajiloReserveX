# Implementation Checklist

## Setup

- [x] Create task folder scaffolding

## Core

- [x] Extend `BookingDTO` type/shared serializers with customer fields
- [x] Update ops bookings mapping to include customer data
- [x] Expose ops variant through `BookingsTable`/`BookingRow`
- [x] Add ops booking details dialog + actions wiring

## UI/UX

- [x] Adjust desktop table columns/skeleton for ops variant
- [x] Update mobile list content for ops variant
- [x] Ensure details dialog handles missing data accessibly

## Tests

- [x] Update/add unit coverage for mobile list (variant expectations)

## Notes

- Assumptions:
  - Ops bookings list does not expose phone/tier; dialog limited to available fields.
- Deviations:
  - None yet.

## Batched Questions (if any)

- None.
