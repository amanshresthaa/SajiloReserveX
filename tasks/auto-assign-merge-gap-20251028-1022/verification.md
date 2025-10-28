# Verification Report

## Manual QA — Chrome DevTools (MCP)

Tool: Chrome DevTools MCP

### Console & Network

- [ ] No Console errors
- [ ] Network requests shaped per contract
- [ ] Performance warnings addressed (note if any)

### DOM & Accessibility

- [ ] Semantic HTML verified
- [ ] ARIA attributes correct
- [ ] Focus order logical & visible indicators
- [ ] Keyboard-only flows succeed

### Performance (profiled)

- FCP: <value> s
- LCP: <value> s
- CLS: <value>
  Notes: ...

### Device Emulation

- [ ] Mobile (≈375px)
- [ ] Tablet (≈768px)
- [ ] Desktop (≥1280px)

## Test Outcomes

- [x] Happy paths _(autoAssignTables merged tables scenario)_
- [x] Error handling _(lunchtime overrun + insufficient capacity skips)_
- [ ] Non-critical performance issues (tracked as <ticket>)
- Notes: `pnpm exec vitest run --config vitest.config.ts tests/server/capacity/autoAssignTables.test.ts`; `pnpm exec vitest run --config vitest.config.ts tests/server/capacity/manualConfirm.test.ts`.

## Known Issues

- [ ] <issue> (owner, priority)

## Sign-off

- [ ] Engineering
- [ ] Design/PM
