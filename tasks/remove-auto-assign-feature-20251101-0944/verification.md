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
- [ ] Non-critical perf issues (tracked as <ticket>)

Commands:

```bash
pnpm test:ops -- tests/ops/clients.test.tsx
pnpm test:ops -- tests/ops/offlineQueue.test.tsx
pnpm test:ops -- tests/server/capacity/manualConfirm.test.ts
pnpm typecheck
```

## Known Issues

- [ ] (owner, priority)

## Sign-off

- [ ] Engineering
- [ ] Design/PM
