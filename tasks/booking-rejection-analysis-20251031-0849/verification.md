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

- FCP: <value> s
- LCP: <value> s
- CLS: <value>
  Notes: ...

### Device Emulation

- [ ] Mobile (≈375px)
- [ ] Tablet (≈768px)
- [ ] Desktop (≥1280px)

## Test Outcomes

- [x] Unit (server): `pnpm vitest run tests/server/capacity/strategic-config.test.ts tests/server/capacity/demand-profiles.test.ts`
- [x] Build: `pnpm run build` (Next.js + typecheck)
- [x] Unit (server): `pnpm vitest run tests/server/capacity/autoAssignTables.test.ts`
- [ ] Happy paths
- [ ] Error handling
- [ ] Non-critical perf issues (tracked as <ticket>)

## Known Issues

- [ ] <issue> (owner, priority)

## Sign-off

- [ ] Engineering
- [ ] Design/PM

## MCP Pre-Flight

- [ ] Server reachable (version printed)
- [ ] Session token valid (if required)
- [ ] Secrets sourced via env (not logged)
- [ ] Target environment confirmed (staging/prod)
