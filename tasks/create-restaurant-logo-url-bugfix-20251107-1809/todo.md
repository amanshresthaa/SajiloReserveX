# Implementation Checklist

## Setup

- [x] Confirm current schema requirements for `CreateRestaurantInput`.

## Core

- [x] Update `CreateRestaurantDialog` to include a `logoUrl` value when constructing the payload.

## UI/UX

- [x] Ensure no unintended UI props/ARIA changes were introduced.

## Tests

- [x] Run `pnpm run lint` to verify type safety.

## Notes

- Assumptions: No immediate need to expose logo uploads inside the dialog; null placeholder is acceptable.
- Deviations: None so far.
