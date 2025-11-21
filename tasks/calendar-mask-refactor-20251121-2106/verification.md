---
task: calendar-mask-refactor
timestamp_utc: 2025-11-21T21:06:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Verification Report

## Manual QA — Chrome DevTools (MCP)

Tool: Chrome DevTools MCP

### Console & Network

- [ ] No Console errors
- [ ] Network requests match contract
- Attempt: `pnpm reserve:dev -- --host 0.0.0.0 --port 5174`, browsed http://localhost:5174/reserve via Chrome DevTools MCP. Page hit error boundary (“Something went wrong… Retry”) with console error from React Router/render. Env fallback logged: `[reserve env] Using fallback API base URL "/api"`; likely requires RESERVE_API_BASE_URL/backend to render.
- Network: only module/dev server requests; no schedule/calendarMask calls observed due to render failure. Artifact snapshot/screenshot captured.

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
- Automated: `pnpm vitest --config reserve/vitest.config.ts reserve/features/reservations/wizard/hooks/__tests__/useUnavailableDateTracking.test.ts reserve/features/reservations/wizard/services/__tests__/useTimeSlots.test.tsx` (pass)

## Artifacts

- Lighthouse: `artifacts/lighthouse-report.json`
- Network: `artifacts/network.har`
- Traces/Screens: `artifacts/reserve-page.png`, `artifacts/reserve-page-snapshot.json`
- DB diff (if DB change): `artifacts/db-diff.txt`

## Known Issues

- [ ] UI render blocked locally due to missing API/base data; cannot complete manual QA until backend or mock provided. (owner: assistant, priority: medium)

## Sign-off

- [ ] Engineering
- [ ] Design/PM
- [ ] QA
