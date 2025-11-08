# Implementation Checklist

## Core Changes

- [x] Remove the bespoke `verifyRestaurantAccess` helper and import `requireMembershipForRestaurant` / `requireAdminMembership`.
- [x] Use those helpers inside GET/PATCH/DELETE handlers with the correct allowed roles and consistent error mapping.
- [x] Capture the membership role from helper output to keep response payload identical to today.

## Verification

- [x] Run `pnpm lint`.

## Notes

- Assumption: managers should have same access to PATCH as owners.
- Deviations: None yet.
