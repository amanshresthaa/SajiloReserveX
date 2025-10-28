# Verification Report

## Manual QA — Chrome DevTools (MCP)

Tool: Chrome DevTools MCP (not applicable — no UI changes)

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

- FCP: N/A
- LCP: N/A
- CLS: N/A
  Notes: No UI touched in this sprint

### Device Emulation

- [ ] Mobile (≈375px)
- [ ] Tablet (≈768px)
- [ ] Desktop (≥1280px)

## Test Outcomes

- [x] Happy paths (targeted capacity unit suites)
- [x] Error handling (manual selection & availability tests)
- [ ] Non-critical perf issues (tracked as <ticket>)

## Known Issues

- [ ] (owner, priority)

### Test Commands

- `pnpm vitest tests/server/capacity/selector.scoring.test.ts tests/server/capacity/selector.performance.test.ts tests/server/capacity/findSuitableTables.test.ts`
- `pnpm vitest tests/server/capacity/manualSelection.test.ts`
- `pnpm vitest tests/server/capacity/isTableAvailableV2.test.ts`

## Sign-off

- [ ] Engineering
- [ ] Design/PM
