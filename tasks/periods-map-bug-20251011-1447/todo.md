# Implementation Checklist

## Prefetch Fix

- [x] Update `RestaurantSettingsPage` to cache only the service period array.

## Client Hardening

- [x] Normalize service periods data in `ServicePeriodsSection` before mapping.
- [x] Log and surface a user-friendly error if data shape is unexpected.

## Verification

- [x] Run targeted tests or lint command.
- [ ] Perform manual QA on `/ops/restaurant-settings`.
