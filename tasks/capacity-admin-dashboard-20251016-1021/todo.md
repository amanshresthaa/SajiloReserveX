# Implementation Checklist

## Backend & Data

- [x] Create migration adding `label` (text) and `override_type` (enum) columns to `restaurant_capacity_rules`
- [x] Update Supabase types (`pnpm db:types`) and regenerate `types/supabase.ts`
- [x] Extend `CapacityService` interface to include override helpers
- [x] Update `/api/ops/capacity-rules` route to accept new fields
- [x] Implement `/api/ops/capacity-rules/[id]/route.ts` for delete operations
- [x] Add `/api/ops/capacity-overrides` (GET) endpoint
- [x] Add `/api/ops/capacity/overbooking-export` endpoint returning CSV

## Services & Hooks

- [x] Expand `src/services/ops/capacity.ts` with overrides + export functions
- [x] Update `useCapacityService` consumers; add new React Query keys for overrides and reports
- [ ] Extend `TableInventoryService` to expose normalized position data

## UI Implementation

- [x] Refactor `CapacityConfigClient` into tabbed admin console
- [x] Build `CapacityRuleEditor` component with scope/override controls
- [x] Build `CapacityOverridesPanel` with calendar/date list UI
- [x] Enhance `SlotUtilizationPanel` to show counts + tooltips
- [x] Implement `FloorPlanView` leveraging table positions
- [x] Create `OverbookingReportsPanel` with date range picker + CSV download
- [x] Wire feature flag `ENABLE_CAPACITY_ADMIN_DASHBOARD`

## Navigation & Routing

- [ ] Update Ops navigation to surface new tabs if flag enabled
- [ ] Ensure `/ops/capacity` loads new layout with Suspense fallback

## Testing & QA

- [ ] Write unit tests for new API routes and services
- [ ] Update Playwright coverage for capacity admin flow
- [ ] Conduct manual QA via DevTools MCP (mobile/desktop, accessibility audit)

## Documentation

- [ ] Update story summary + TODO status
- [ ] Record verification steps in `verification.md`
- [ ] Draft admin user guide snippet for overrides, floor plan, exports
