# Verification Report

## Manual QA — Chrome DevTools (MCP)

Tool: Chrome DevTools MCP

### Console & Network

- [ ] No Console errors
- [ ] Network requests match contract
- [ ] Performance warnings addressed (notes)

### DOM & Accessibility

- [ ] Semantic HTML verified
- [ ] ARIA attributes correct
- [ ] Focus order logical & visible indicators
- [ ] Keyboard-only flows succeed

### Performance (profiled)

- FCP: s
- LCP: s
- CLS:
  Notes:

### Device Emulation

- [ ] Mobile (≈375px)
- [ ] Tablet (≈768px)
- [ ] Desktop (≥1280px)

## Test Outcomes

- [x] Happy paths
- [x] Error handling
- [ ] Non-critical perf issues (tracked as )

### Automated Tests

- `pnpm test:ops` — ❌ fails (baseline issues): `tests/server/ops/bookings-route.test.ts` expects populated `env.node.env`; `src/app/api/owner/restaurants/[id]/service-periods/route.test.ts` syntax error at orderedKeys literal. Both suites pre-existing; no capacity modules touched. Targeted suites below pass.
- `pnpm vitest run tests/server/capacity/isTableAvailableV2.test.ts` — ✅
- `pnpm vitest run tests/server/capacity/manualConfirm.test.ts` — ✅
- `pnpm vitest run tests/server/capacity/windowsOverlap.property.test.ts` — ✅
- `pnpm vitest run tests/server/capacity/findSuitableTables.test.ts` — ✅

## Known Issues

- [ ] `pnpm test:ops` baseline env/syntax errors tracked upstream (see above); capacity-related suites pass locally.

## Sign-off

- [ ] Engineering
- [ ] Design/PM

## MCP Pre-flight

- [ ] Server reachable (version printed)
- [ ] Session token valid (if required)
- [ ] Secrets sourced via env (not logged)
- [ ] Target environment confirmed (staging/prod)
