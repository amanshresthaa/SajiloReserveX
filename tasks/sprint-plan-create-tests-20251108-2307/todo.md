# Implementation Checklist

## Setup

- [ ] Confirm sprint team roster (QA lead, Reserve UI dev lead, server/ops dev lead, DB/scripts owner, UX a11y reviewer, Release manager) and calendar rituals (daily standup, Day5 design sync, Day9 readiness, Day10 retro/demo).
- [ ] Finalize backlog structure: create Jira epics/stories referencing `tasks/sprint-plan-create-tests-20251108-2307` and AGENTS.md requirements.
- [ ] Generate script coverage matrix (48 package scripts) with owners + required artifacts; store alongside backlog.

## Core

- [ ] Day0-1: Inventory existing coverage gaps (lint/type, Vitest, Playwright CT/E2E, stress scripts, manual QA) and log into Jira tasks with links to AGENTS guidelines.
- [ ] Day2: Define acceptance criteria + test charters per workstream; update `research.md` (requirements) and `plan.md` (scenarios, fixtures, mocks, perf/a11y targets).
- [ ] Day3-4: Implement prioritized Vitest specs (Reserve + server), add missing mocks/factories/benchmark harness wiring, run CI dry runs.
- [ ] Day5: Ship component + visual regression tests, capture baseline screenshots, document variance handling and link to `tests/visual/baselines` artifacts.
- [ ] Day6-7: Author new Playwright E2E specs (smoke, regression, matrix, mobile) with snapshot update SOP; ensure global setup seeds/data fixtures align.
- [ ] Day8: Extend load/stress automation (allocation stress script, booking matrix/pack loaders) with parameterized cases, metrics assertions, and reporting exports; update `tasks/.../todo.md` notes.
- [ ] Day9: Draft Chrome DevTools MCP manual QA playbook + security/secret scanning SOP updates; add to `verification.md` and `security` docs.
- [ ] Day10: Consolidate artifacts, link new tests to package scripts, update README/testing-strategy, capture open issues + mitigation plans, prep demo deck + release handoff.

## UI/UX

- [ ] Ensure component/visual/E2E specs cover loading/empty/error/success states and focus/keyboard management for Reserve UI + Ops dashboards.
- [ ] Validate a11y (WCAG) cues via both automated checks (axe/playwright) and manual Chrome DevTools flows.
- [ ] Capture baseline screenshots for desktop + mobile; annotate expected variances.

## Tests

- [ ] Vitest Reserve + server suites extended with new specs + benchmarks.
- [ ] Playwright CT/E2E suites updated with new tests, tags, snapshot/update docs.
- [ ] Stress/load scripts produce exportable metrics + assertions; integrate into CI where possible.
- [ ] Secret scanning + env validation tests updated for new keys.
- [ ] Chrome DevTools MCP manual QA checklist executed once code ready; evidence (screens, logs) stored with verification artifact.

## Notes

- Assumptions: Sprint capacity supports multiple parallel workstreams; necessary secrets/env vars already provisioned; Release manager can gate CI toggles.
- Deviations: To be logged daily in `tasks/sprint-plan-create-tests-20251108-2307/todo.md` with owner + resolution.
- Update 2025-11-08: Added `tests/scripts/validate-env.test.ts` plus supporting refactor of `scripts/validate-env.ts` to make the guard testable; executed `pnpm vitest run --config vitest.config.ts tests/scripts/validate-env.test.ts` to confirm coverage.

## Batched Questions (if any)

- [ ] Confirm Jira project identifiers for backlog linkage.
- [ ] Validate whether load/stress automation can target staging vs production data.
- [ ] Determine if additional tooling (e.g., Storybook visual plugins) requires security review.
