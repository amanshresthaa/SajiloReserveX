# Implementation Plan: Fix Ops Summary Loyalty Join

## Objective

Ensure Ops dashboard APIs (summary + VIPs) load successfully by resolving the invalid Supabase join and still enriching bookings with loyalty metadata.

## Success Criteria

- [ ] `/api/ops/dashboard/summary` responds with 200 for a valid restaurant and includes loyalty info when available.
- [ ] `/api/ops/dashboard/vips` continues to surface loyalty VIPs without PostgREST errors.
- [x] `pnpm run build` succeeds.

## Architecture & Components

- `server/ops/bookings.ts#getTodayBookingsSummary`: fetch bookings, profiles, loyalty info.
- `server/ops/vips.ts#getTodayVIPs`: VIP selection logic.
  State: Both functions depend on Supabase queries and share loyalty enrichment logic.

## Data Flow & API Contracts

- No endpoint contract changes; still return `loyaltyTier`, `loyaltyPoints`, and VIP fields.
- Implement a helper to fetch loyalty point rows by `customer_id` + `restaurant_id`.

## UI/UX States

- No UI adjustments required (API-only change).

## Edge Cases

- Restaurants without loyalty program should return `null` loyalty values without errors.
- Customers missing loyalty records handled gracefully.
- Avoid extra Supabase calls when there are zero bookings (early-return).

## Testing Strategy

- `pnpm run build` (compilation + type check).
- Hit `/api/ops/dashboard/summary` locally (already covered by dev server logs) to confirm no 500 errors.

## Rollout

- Hotfix; deploy immediately once merged.
