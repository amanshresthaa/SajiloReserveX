# Verification Report (Sprint Planning Artifacts)

## Manual QA — Chrome DevTools (MCP)

Tool: Chrome DevTools MCP (to be executed during implementation when UI changes/tests are ready)

### Console & Network

- [ ] No console errors/warnings during Reserve UI + Ops dashboard critical flows (booking create/edit, admin toggles, feature flag flips).
- [ ] Network captures include POST/GET payload validation versus API contracts; attach HAR exports and annotate perf metrics.
- [ ] Performance warnings documented with mitigation notes (e.g., assets over budget) and associated Jira follow-ups.

### DOM & Accessibility

- [ ] Semantic HTML verified for forms, dialogs, toasts; include screenshots with focus indicators.
- [ ] ARIA attributes validated (aria-live, aria-invalid, role assignments) using DevTools Accessibility pane.
- [ ] Keyboard-only walkthrough recorded (video/screenshot) covering booking wizard + Ops admin flows.

### Performance (profiled)

- Target metrics: FCP ≤ 2.0s, LCP ≤ 2.5s, CLS ≤ 0.1 on desktop; mobile Pixel 7 thresholds FCP/LCP within +0.5s.
- [ ] Capture Lighthouse traces per environment; store JSON + summary in `tasks/.../evidence/`.
- Notes: Document variance allowances (e.g., first-run caches) and tie to perf monitoring plan.

### Device Emulation

- [ ] Mobile (≈375–412px) – booking wizard + admin toggles.
- [ ] Tablet (≈768px) – Ops dashboard/reservation lists.
- [ ] Desktop (≥1280px) – full flow incl. stress dashboards.

## Test Outcomes (to be filled as suites land)

- [ ] Vitest Reserve/server suites executed; include coverage % deltas vs baseline.
- [ ] Playwright CT/E2E suites run (smoke, matrix, mobile), attach reports.
- [ ] Load/stress automation outputs uploaded (metrics, CSV/JSON exports) with comparison commentary.
- [ ] Secret scanning + validate:env scripts executed post-changes.

## Known Issues

- [ ] Document any flaky tests, baseline diffs, or data/environment blockers (owner, severity, mitigation).

## Sign-off

- [ ] Engineering
- [ ] QA Lead
- [ ] UX/A11y Reviewer
- [ ] Release Manager
