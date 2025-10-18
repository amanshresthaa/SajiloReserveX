# Verification Report

## Manual QA — Chrome DevTools (MCP)

Tool: Chrome DevTools MCP

### Console & Network

- [ ] No Console errors (MCP pass pending)
- [ ] Network requests shaped per contract (MCP pass pending)
- [ ] Performance warnings addressed (note if any)

### DOM & Accessibility

- [ ] Semantic HTML verified
- [ ] ARIA attributes correct
- [ ] Focus order logical & visible indicators
- [ ] Keyboard-only flows succeed

### Performance (profiled)

- FCP: TBD s
- LCP: TBD s
- CLS: TBD
  Notes: TBD

### Device Emulation

- [ ] Mobile (≈375px)
- [ ] Tablet (≈768px)
- [ ] Desktop (≥1280px)

## Test Outcomes

- [x] Happy paths — `pnpm vitest run tests/server/capacity/autoAssignTables.test.ts`
- [x] Error handling — `pnpm vitest run tests/server/ops/getTodayBookingsSummary.test.ts`
- [x] UI smoke — `pnpm vitest run tests/ops/bookings-list.badges.test.tsx`
- [ ] Non-critical performance issues (tracked as <ticket>)

## Known Issues

- [ ] TBD (owner, priority)

## Sign-off

- [ ] Engineering
- [ ] Design/PM
