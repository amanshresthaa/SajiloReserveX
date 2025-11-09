# Implementation Plan: Sprint Plan for Comprehensive Test Authoring

## Objective

We will execute a two-week focused sprint that inventories all testing/QA gaps across SajiloReserveX, authors or strengthens the missing specs (unit, integration, component, visual, E2E, load, manual QA, security) tied to every `package.json` script, and publishes the resulting coverage artifacts plus verification evidence so release management can trust every guardrail before the next deployment cycle.

## Success Criteria

- [ ] Each package script (48 verified via Node + Python parsing) has at least one net-new or materially expanded spec/automation item with an owner and Jira reference captured in the sprint backlog.
- [ ] Research/plan/todo/verification artifacts inside `tasks/sprint-plan-create-tests-20251108-2307` remain up to date, link to baselines/reports, and document Chrome DevTools MCP instructions.
- [ ] Manual QA playbook defines console/network/device/perf steps with evidence templates plus performance targets (FCP, LCP, CLS) and accessibility cues.
- [ ] Visual/component baselines stored under `tests/visual/baselines` are refreshed with variance-handling notes, and Playwright CT/E2E projects gain smoke vs regression tagging plus mobile coverage.
- [ ] Load/stress tooling (`scripts/run-allocation-stress-test.sh`, booking matrix/pack loaders) expose parameterized cases, threshold assertions, and exportable metrics compared to historical baselines.
- [ ] Secret scanning + env validation SOPs updated so new env keys/tests are enforced via `validate:env` and `secret:scan` pipelines, with escalation paths documented.

## Architecture & Components (Workstreams)

- **Static Quality Bar**: Expand lint/typecheck coverage, ensure new directories inherit ESLint config, add tests for `guard:no-shadcn`, and document lint scenarios plus owners.
- **Unit/Integration (Vitest Reserve + Server)**: Cover hooks, components, state management, API handlers, email flows, queue scripts. Introduce shared MSW fixtures and benchmarking harness alignment with `vitest.config.ts` `benchmark.include`.
- **Component/Visual (Playwright CT + Storybook)**: Build stories + component tests for loading/empty/error/success states, ensure focus styles/accessibility instrumentation, capture baseline screenshots with diff tolerances.
- **E2E Automation (Playwright)**: Write new specs for booking/admin/authentication/feature-flag toggles/error recovery, define tagging (`@smoke`, `@matrix`, `@mobile`), ensure multi-browser projects (Chromium/Firefox/WebKit + Pixel) remain green.
- **Load/Stress/Ops**: Extend allocation stress harness, booking loaders, DB verification scripts with parameterized inputs, metrics assertions, export comparators, and fail-fast alerts.
- **Manual QA & A11y**: Produce Chrome DevTools MCP playbook, scoreboard template, keyboard-only + screen-reader instructions, and performance targets; align with AGENTS phase 4 template.
- **Security & Secrets**: Update secret scanning SOP, env validation tests for new keys, escalation documentation, and automated checks referencing `secret:scan` & `validate:env` scripts.
- **Reporting & Handoff**: Aggregate verification artifacts, README/testing-strategy updates, sprint demo deck focusing on coverage deltas and remaining risks.

## Data Flow & API Contracts (Coverage Mapping)

- Create a Day0-1 catalog that maps every script → owning suite → planned artifact (e.g., `test:e2e` → Playwright E2E spec; `observability:baseline` → metrics export tests). Maintain catalog in backlog and link to Jira tasks.
- Define fixture/data needs per suite: Reserve Vitest uses component factories from `reserve/tests`, server Vitest relies on MSW/resend/email mocks, Playwright E2E draws from `tests/global-setup.ts` seeding, load scripts use Supabase queries via remote DB.
- Explicitly document error/edge paths to validate—e.g., queue workers should include retries/timeouts; booking flows should test failure recoveries and feature-flag toggles.

## UI/UX States

- For each surface touched in Playwright CT or Storybook, ensure states: Loading (skeletons/spinners), Empty (no data), Error (toast/banner), Success (happy path). Document focus outlines, aria-live usage, and screen-reader narration per component.
- Visual baselines must cover desktop + pixel-7 mobile states; annotate any tolerated diffs (e.g., timestamp drift) in `tests/visual/baselines/README.md` (to add/update).

## Edge Cases

- DST/timezone transitions affecting booking flows, previously captured in tasks like `fix-dst-and-contextversion-tests`; include dedicated scenarios in Vitest + Playwright matrix.
- Feature-flag toggles mid-session, ensuring guardrail specs degrade gracefully when flags disabled.
- Supabase rate limits or unavailable network during load tests—scripts should short-circuit with descriptive metrics.
- Secret scanning false positives vs actual incidents; plan for suppression process review.

## Testing Strategy

- **Vitest Reserve**: Implement component + hook specs with MSW/mocks, ensure coverage of state machines; add benchmarking harness for performance-critical logic using `tests/benchmarks` patterns.
- **Vitest Server/Ops**: Cover API handlers, email/queue flows, CLI scripts; leverage `tests/server`, `tests/scripts`, `tests/emails`, `tests/ops` directories and `vitest.setup.ts` global config.
- **Playwright Component**: Increase CT coverage for new UI states; integrate baseline screenshots into `tests/visual/baselines` and document diff handling.
- **Playwright E2E**: Build smoke/regression/matrix tags, ensure `PLAYWRIGHT_AUTH_REFRESH` flows succeed, run locally for validation, and plan CI dry runs with `test:e2e`, `test:e2e:smoke`, `test:e2e:matrix` scripts.
- **Load/Stress**: Parameterize `scripts/run-allocation-stress-test.sh`, booking loaders, DB verifiers. Capture metrics JSON/CSV for historical comparison; integrate with `tests/load` for automated assertions.
- **Manual QA**: Chrome DevTools MCP script covering console/network/device/perf; include frame-by-frame instructions, screenshot prompts, and scoreboard template.
- **Security**: Expand `secret:scan` coverage, integrate env validation tests for new keys in `scripts/validate-env.ts`, add regression tests for guardrails (e.g., `guard:no-shadcn`).

## Rollout

- Feature flag: `tests.sprint.create-coverage` (to be created) gating new suites until baseline stable; toggled by Release manager.
- Exposure timeline:
  - Day0-1 inventory backlog; Day2 acceptance criteria/test charters recorded in `research.md` + new Jira tasks.
  - Day3-4 implement Vitest specs & harness updates; Day5 component/visual/regression baselines with design sync.
  - Day6-7 E2E specs & snapshot guidelines; Day8 load/stress automation extensions.
  - Day9 readiness review (manual QA playbook + security SOP), Day10 consolidation/demo & README/testing-strategy updates.
- Monitoring: daily standups, Day5 design sync, Day9 readiness review, Day10 retro/handoff; reporting via sprint demo deck referencing coverage metrics.
- Kill-switch: revert feature flag or skip new suites from CI (toggle scripts in `package.json`) if blockers arise; documented rollback path in verification artifact.
