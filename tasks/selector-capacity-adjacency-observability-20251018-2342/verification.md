# Verification Report

## Manual QA — Chrome DevTools (MCP)

Tool: Chrome DevTools MCP

### Console & Network

- [ ] No Console errors _(pending manual run)_
- [ ] Network requests shaped per contract _(pending manual run)_
- [ ] Performance warnings addressed (note if any)

### DOM & Accessibility

- [ ] Semantic HTML verified _(pending manual run)_
- [ ] ARIA attributes correct _(pending manual run)_
- [ ] Focus order logical & visible indicators _(pending manual run)_
- [ ] Keyboard-only flows succeed _(pending manual run)_

### Performance (profiled)

- FCP: _TBD_ s
- LCP: _TBD_ s
- CLS: _TBD_
  Notes: Selector stress harness (`36` tables, neighbour span `5`) evaluated `540` merge combos in ≈`9.09 ms` (`pnpm tsx --tsconfig tsconfig.json /tmp/capacity-perf-sample.ts`).

### Device Emulation

- [ ] Mobile (≈375px)
- [ ] Tablet (≈768px)
- [ ] Desktop (≥1280px)

## Test Outcomes

- [x] Happy paths _(unit/integration via Vitest)_
- [x] Error handling _(auto-assign integration tests)_
- [ ] Non-critical performance issues (tracked as <ticket>)

## Known Issues

- [ ] Awaiting manual UI QA for selector metrics & allowed-capacity editing flows once feature flags enabled in staging.

## Verification Notes

- Automated tests executed:
  - `pnpm vitest run tests/server/capacity/selector.scoring.test.ts --config vitest.config.ts`
  - `pnpm vitest run tests/server/capacity/autoAssignTables.test.ts --config vitest.config.ts`
  - `pnpm vitest run src/app/api/ops/allowed-capacities/route.test.ts src/app/api/ops/metrics/selector/route.test.ts --config vitest.config.ts`
  - `pnpm vitest run tests/server/analytics/events.test.ts tests/server/security/rate-limit.test.ts tests/server/auth/guards.test.ts tests/server/capacity/selector.performance.test.ts tests/server/bookings/pastTimeValidation.test.ts --config vitest.config.ts`
  - `pnpm vitest run tests/server/restaurants/details.test.ts --config vitest.config.ts`
  - `pnpm vitest run tests/server/reserve/wizardReducer.test.ts --config vitest.config.ts`
- SQL trigger verification plan:
  - Use `SELECT are_tables_connected(:restaurant_id, :table_ids)` to pre-compute the merge graph and confirm adjacency depth prior to enabling groups.
  - Attempt an `INSERT` into `merge_group_members` where one table lacks adjacency to the anchor and expect the trigger to raise `merge_group_requires_adjacency`.
  - Validate successful cases by inserting an allowed pair, then deleting a member and re-querying `are_tables_connected` to ensure the trigger prevents orphaned entries.
- Frontend regression coverage:
  - `pnpm vitest run tests/ops/dashboard.metrics.test.tsx --config vitest.config.ts`
- Pending manual QA steps:
  - Enable `FEATURE_SELECTOR_SCORING`, `FEATURE_CAPACITY_CONFIG`, `FEATURE_OPS_METRICS`, `FEATURE_ADJACENCY_VALIDATION` in staging.
  - Validate allowed capacity management UI in Ops dashboard (add/remove capacities, ensure tables respect list).
  - Exercise auto-assignment flows while capturing DevTools logs (ensure structured JSON logs emitted, no console errors).
  - Confirm selector metrics dashboard renders with sample data and handles empty/error states gracefully.
  - Attempt to create merge groups with disconnected tables to confirm DB trigger blocks persistence.

## Sign-off

- [ ] Engineering
- [ ] Design/PM
