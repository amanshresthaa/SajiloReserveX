# Verification Report

## Manual QA — Chrome DevTools (MCP)

Tool: Chrome DevTools MCP

### Console & Network

- [ ] No Console errors
- [ ] Network requests shaped per contract
- [ ] Performance warnings addressed (note if any)

> Server-only change; UI QA not applicable.

### DOM & Accessibility

- [ ] Semantic HTML verified
- [ ] ARIA attributes correct
- [ ] Focus order logical & visible indicators
- [ ] Keyboard-only flows succeed

> Server-only change; UI QA not applicable.

### Performance (profiled)

- FCP: s
- LCP: s
- CLS:
  Notes:

> Server-only change; no web performance impact expected.

### Device Emulation

- [ ] Mobile (≈375px)
- [ ] Tablet (≈768px)
- [ ] Desktop (≥1280px)

> Not run (server-only change).

## Test Outcomes

- [x] Happy paths
- [x] Error handling
- [ ] Non-critical performance issues (tracked as )

## Known Issues

- [ ] ()

## Sign-off

- [ ] Engineering
- [ ] Design/PM

### Evidence

- `pnpm vitest run tests/server/capacity/selector.scoring.test.ts`
