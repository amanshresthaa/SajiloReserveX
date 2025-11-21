---
task: production-hardening
timestamp_utc: 2025-11-21T13:24:24Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: high
flags: []
related_tickets: []
---

# Verification Report

## Manual QA — Chrome DevTools (MCP)

Tool: Chrome DevTools MCP (required for any UI changes; TBD after implementation)

### Console & Network

- [ ] No console errors
- [ ] Network requests match contract and env guard behavior

### DOM & Accessibility

- [ ] Semantic HTML verified (if UI impacted)
- [ ] ARIA attributes correct
- [ ] Focus order logical & visible
- [ ] Keyboard-only flows succeed

### Performance (profiled; mobile; 4× CPU; 4G)

- FCP: <value> s | LCP: <value> s | CLS: <value> | TBT: <value> ms
- Budgets met: [ ] Yes [ ] No (notes)

### Device Emulation

- [ ] Mobile (≈375px) [ ] Tablet (≈768px) [ ] Desktop (≥1280px)

## Test Outcomes

- [ ] Happy paths (lint/typecheck/test/build pipelines)
- [ ] Error handling (env guard blocks, DB script blocks)
- [ ] A11y (axe): 0 critical/serious
- [ ] Security scans: `secret:scan`, `pnpm audit` thresholds met
- [ ] Migration drift check (if added) passes

## Artifacts

- [ ] Lighthouse: `artifacts/lighthouse-report.json` (stretch)
- [ ] Network: `artifacts/network.har` (if UI touched)
- [ ] Drifts/DB diff: `artifacts/db-diff.txt` (if applicable)
- [ ] Secret scan/audit outputs: `artifacts/`
- [ ] CI logs/screenshots for guards/tests

## Known Issues

- [ ] <issue> (owner, priority)

## Sign-off

- [ ] Engineering
- [ ] Design/PM
- [ ] QA
