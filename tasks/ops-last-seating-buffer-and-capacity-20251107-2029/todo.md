# Implementation Checklist

## Core Work

- [x] Update `RestaurantDetailsForm` types/state/sanitizer/validation/UI to remove capacity and relax buffer validation + helper copy.
- [x] Adjust `RestaurantProfileSection` defaults and mutation payload (no capacity, buffer default 15).
- [x] Update `EditRestaurantDialog` to pass the new `RestaurantDetailsFormValues` (without capacity).

## Verification

- [x] Run `pnpm lint`.

## Notes

- Buffer minimum remains enforced server-side; this work ensures UI matches and default is 15.
