# Implementation Checklist

## Setup

- [x] Introduce feature flag `FEATURE_OPS_REJECTION_ANALYTICS` with default off (env schema + `lib/env.ts` + feature-flags helper).
- [x] Scaffold server + client directories for rejection analytics (`server/ops/rejections`, `src/components/features/dashboard/rejections`).
- [ ] Prepare migration stubs / SQL drafts for Supabase objects (`strategic_configs` table, `capacity_selector_rejections_v1` view, `demand_profiles` additions) — capture in `/supabase/migrations` placeholders per remote-only policy.

## Core

- [x] Enhance auto-assignment telemetry: capture top rejected candidate + dominant penalty; tag decisions as hard vs strategic.
- [x] Extend strategic config loader to read Supabase overrides + expose cache invalidation hook.
- [x] Update demand multiplier resolver to honour time-of-day specificity + priority ordering.
- [x] Implement Supabase query helper for rejection aggregations and build API route `GET /api/ops/dashboard/rejections` with validation.
- [x] Implement strategic config mutation API `POST /api/ops/settings/strategic-config` with auth + audit stub.
- [x] Add simulation shell endpoint `POST /api/ops/strategies/simulate` returning placeholder while jobs pipeline defined.

## UI/UX

- [x] Build Ops dashboard tab/route for Rejections (navigation entry, URL state share).
- [x] Implement summary cards + trend chart skeleton (loading/empty/error states).
- [x] Create strategic breakdown table with accessible toggles for score breakdown JSON.
- [x] Build strategic settings modal to edit weights (form validation, success/error feedback) and wire to API.
- [x] Add simulation trigger UI with KPI comparison placeholder; ensure responsive layout + keyboard support.
- [ ] Verify all new surfaces meet a11y requirements (focus order, aria labels, color contrast).

## Tests

- [ ] Unit: classification helpers, demand rule selection (in progress), strategic config loader, API validators.
- [ ] Integration: auto-assignment telemetry pipeline snapshot, API route end-to-end with mocked Supabase.
- [ ] E2E (critical flows): Playwright scenario covering new dashboard filters + settings update path.
- [ ] Axe/Accessibility checks on new dashboard views and modal.

## Notes

- Assumptions:
  - Remote Supabase environments will add `strategic_configs` and demand profile minute/priority columns; local generated types were updated to match the planned schema.
- Deviations:
  - Unit tests added for demand multiplier rule selection and per-restaurant strategic cache; remaining API validator coverage still pending.
  - Removed stale exports from `hooks/index.ts` and rely on `src/hooks` re-exports; ensured build passes by updating type guards for Luxon ISO helpers.
  - Fixed hydration mismatch in `OpsRestaurantSwitch` by deferring localStorage preference hydration to effects so SSR/client initials stay consistent.
  - Strategic config loader now tolerates missing `strategic_configs` table (logs once, falls back to env defaults) to keep legacy environments functional until the Supabase migration lands.
  - Supabase test client updated to stub `strategic_configs` and demand profile limit chaining so auto-assign tests run without the new schema.

## Batched Questions (if any)

- ...
