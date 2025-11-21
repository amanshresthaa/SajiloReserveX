---
task: table-availability-20251126-1945
timestamp_utc: 2025-11-21T15:14:10Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Verification Report

## Manual QA — Chrome DevTools (MCP)

Tool: Chrome DevTools MCP (N/A — data-only task; no UI changes; UI QA not required)

### Console & Network

- [ ] No Console errors (N/A)
- [ ] Network requests match contract (N/A)

### DOM & Accessibility

- [ ] Semantic HTML verified (N/A)
- [ ] ARIA attributes correct (N/A)
- [ ] Focus order logical & visible (N/A)
- [ ] Keyboard-only flows succeed (N/A)

### Performance (profiled; mobile; 4× CPU; 4G)

- FCP: <value> s | LCP: <value> s | CLS: <value> | TBT: <value> ms
- Budgets met: [ ] Yes [ ] No (notes) (N/A)

### Device Emulation

- [ ] Mobile (≈375px) [ ] Tablet (≈768px) [ ] Desktop (≥1280px) (N/A)

## Test Outcomes

- [x] Happy paths (SQL aggregation + table list cross-check)
- [ ] Error handling
- [ ] A11y (axe): 0 critical/serious (N/A)

## Artifacts

- [x] SQL results: `tasks/table-availability-20251126-1945-20251121-1513/artifacts/availability-20251126-1945.csv`
- [ ] Supporting screenshots/notes: `artifacts/` (N/A)

## Known Issues

- [ ] <issue> (owner, priority)

## Sign‑off

- [ ] Engineering
- [ ] Design/PM
- [ ] QA
