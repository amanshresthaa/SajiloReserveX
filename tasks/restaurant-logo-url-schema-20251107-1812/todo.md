# Implementation Checklist

## Setup

- [x] Capture research + plan artifacts for the schema regression.

## Core

- [x] Introduce a reusable optional `logoUrl` schema helper with trimming + URL validation.
- [x] Apply the helper to both `createRestaurantSchema` and `updateRestaurantSchema`.

## Verification

- [x] `pnpm run lint`.
- [x] `pnpm run build`.

## Notes

- Assumption: No UI/QoL changes are needed because the root cause sits in the shared schema.
- Deviations: Build surfaced pre-existing TypeScript gaps (`reserve/shared/config/venue.ts` fallback type + missing `restaurantName` const). Addressed both to complete verification and documented here.
