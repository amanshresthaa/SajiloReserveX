# Verification Report

## Manual QA — Chrome DevTools (MCP)

Tool: Chrome DevTools MCP

### Console & Network

- [ ] No Console errors while replaying planner diagnostics in staging.
- [ ] Network requests match contract (verify strategic config fetch, Supabase lookups).
- [ ] Performance warnings addressed (notes) — capture selector duration metrics.

### DOM & Accessibility

- [ ] Semantic HTML verified (planner diagnostics pane).
- [ ] ARIA attributes correct for telemetry tables/cards.
- [ ] Focus order logical & visible indicators on config toggles.
- [ ] Keyboard-only flows succeed for ops interactions.

### Performance (profiled)

- FCP: s (capture staging load with strategic scoring enabled).
- LCP: s
- CLS:
  Notes: profile planner request to confirm <500 ms compute.

### Device Emulation

- [ ] Mobile (≈375px) — ensure diagnostics remain readable.
- [ ] Tablet (≈768px)
- [ ] Desktop (≥1280px)

## Test Outcomes

- [ ] Happy paths — Scenario A/B + sequential lookahead tests pass.
- [ ] Error handling — overrides disabled scenarios handled gracefully.
- [ ] Non-critical perf issues (tracked as <ticket>) — log if selector >500 ms.

## Known Issues

- [ ] (owner, priority)

## Sign-off

- [ ] Engineering
- [ ] Design/PM

## MCP Pre-Flight

- [ ] Server reachable (version printed)
- [ ] Session token valid (if required)
- [ ] Secrets sourced via env (not logged)
- [ ] Target environment confirmed (staging/prod)
