# Verification Report

## Manual QA — Chrome DevTools (MCP)

Tool: Chrome DevTools MCP (not applicable for backend stress tests)

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

- FCP: _n/a_
- LCP: _n/a_
- CLS: _n/a_
  Notes: _n/a_

### Device Emulation

- [ ] Mobile (≈375px)
- [ ] Tablet (≈768px)
- [ ] Desktop (≥1280px)

## Test Outcomes

- [x] Stress test executed (`pnpm exec tsx scripts/stress-check-table-blocking.ts`)
- [x] Logs captured (see console.table output below)
- [ ] Issue reproduced/noted

```
label           status      expected    window
--------------  ----------  ----------  -----------------------------------------------
active-window   reserved    reserved    [2025-10-26T23:16:09.852Z -> 2025-10-27T00:31:09.852Z)
future-window   available   available   [2025-10-27T00:46:09.852Z -> 2025-10-27T01:46:09.852Z)
past-window     available   available   [2025-10-26T21:46:09.852Z -> 2025-10-26T22:16:09.852Z)
```

## Known Issues

- [ ] ...

## Sign-off

- [ ] Engineering
- [ ] Design/PM
