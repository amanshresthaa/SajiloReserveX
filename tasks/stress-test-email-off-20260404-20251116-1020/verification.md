---
task: stress-test-email-off-20260404
timestamp_utc: 2025-11-16T10:20:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Verification Report

## Manual QA — Chrome DevTools (MCP)

Tool: Chrome DevTools MCP (not applicable; CLI-only run)

### Console & Network

- [ ] No console errors
- [ ] Network requests match contract

### DOM & Accessibility

- [ ] Semantic HTML verified
- [ ] ARIA attributes correct
- [ ] Focus order logical & visible
- [ ] Keyboard-only flows succeed

### Performance (profiled; mobile; 4× CPU; 4G)

- FCP: <value> s | LCP: <value> s | CLS: <value> | TBT: <value> ms
- Budgets met: [ ] Yes [ ] No (notes)

### Device Emulation

- [ ] Mobile (≈375px) [ ] Tablet (≈768px) [ ] Desktop (≥1280px)

## Test Outcomes

- [ ] Happy paths
- [ ] Error handling
- [ ] A11y (axe): 0 critical/serious

## Artifacts

- Slot logs: `artifacts/slot-fill-*.log`
- Summary: `artifacts/summary.txt` (to be added)

## Known Issues

- [ ] Restaurant schedule currently closed on Saturdays (no operating hours for 2026-04-04); stress run blocked until override is added or date is adjusted. (owner: eng, priority: high)
- [ ] Weekday run (2026-04-03): 12:00 slot meets ~20–30% fill (4–6 successes). All later slots (12:15 onward) are failing due to capacity/timeouts even with manual retries (party 1–12, up to 8 attempts each); many attempts hit “Insufficient filtered capacity” or inline/ background timeouts. Need direction on adjusting party range/caps or relaxing per-slot success criteria. (owner: eng)

## Sign-off

- [ ] Engineering
- [ ] Design/PM
- [ ] QA
