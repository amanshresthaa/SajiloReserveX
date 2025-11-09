# Research: Sprint Plan for Comprehensive Test Authoring

## Requirements

- Functional:
  - Deliver a two-week sprint plan focused on creating or strengthening tests so every `package.json` script and manual Chrome DevTools QA flow has tangible coverage artifacts, baseline evidence, and traceable ownership.
  - Convert coverage gaps (lint/type gates, Vitest unit/integration, Playwright component & E2E, stress/load harnesses, manual QA scripts, secret scanning) into taskable backlog items referencing AGENTS.md policy.
  - Produce documentation updates (README/testing strategy, verification.md links) plus reporting artifacts for release/demo.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Enforce AGENTS.md mandates: remote Supabase only, Chrome DevTools MCP for UI, WCAG-compliant flows, conventional commits.
  - Ensure manual QA playbooks capture performance targets (FCP/LCP/CLS) and secret scanning SOPs extend gitleaks/trufflehog usage.
  - Maintain traceability by storing research/plan/todo/verification outputs under `tasks/<slug>-YYYYMMDD-HHMM`.

## Existing Patterns & Reuse

- Package scripts (48 total) span lint/typecheck, dual Vitest configs (`reserve/vitest.config.ts`, repo `vitest.config.ts`), Playwright CT/E2E (`playwright.component.config.ts`, `playwright.config.ts`), Storybook, allocation/load scripts, observability exports, env validation, secret scanning, Supabase migrations, and booking stress runners.
- `tests/` monorepo already houses subdirectories for `e2e`, `component`, `load`, `ops`, `server`, `visual/baselines`, plus shared fixtures (`tests/fixtures`, `tests/mocks`, `tests/helpers`). Reserve-specific tests live under `reserve/tests` with their own setup file.
- Stress tooling exists in `scripts/run-allocation-stress-test.sh`, `scripts/booking-matrix-load.ts`, `scripts/booking-pack-fill.ts`, and Supabase SQL utilities—providing scaffolds for extending parameterization and metric assertions.
- Manual QA precedent captured in existing task `verification.md` files (e.g., `tasks/sprint-2-security-scale-operability-20251107-0634/verification.md`) that already follow the AGENTS Chrome DevTools template; new playbooks can extend that structure.
- Observability baselines/export scripts plus `tests/load` directories offer patterns for capturing performance metrics and historical comparisons.

## External Resources

- [AGENTS.md](../../agents.md) – authoritative SDLC, remote Supabase rule, Chrome DevTools mandate, template structures for research/plan/todo/verification.
- [playwright.config.ts](../../playwright.config.ts) & [playwright.component.config.ts](../../playwright.component.config.ts) – define device matrix (Chromium/Firefox/WebKit + Pixel 7) and CT snapshot directories, informing scope for new specs and baselines.
- [vitest.config.ts](../../vitest.config.ts) & [reserve/vitest.config.ts](../../reserve/vitest.config.ts) – describe existing include/exclude globs, benchmark harness support, and environment setup that new tests must leverage.
- [scripts/run-allocation-stress-test.sh](../../scripts/run-allocation-stress-test.sh) – reference for load/stress automation enhancements (parameterized runs, reporting, threshold assertions).

## Constraints & Risks

- Remote-only Supabase policy prohibits local DB resets; all migrations/seeds must use scripts with environment variables sourced securely.
- Chrome DevTools MCP manual QA is mandatory for any UI change; sprint deliverables must include a reproducible playbook plus evidence capture instructions.
- guard:no-shadcn script requires regression tests to ensure unauthorized imports are caught—failing to extend coverage risks future violations.
- 48 package scripts imply wide surface area; missing owners or neglected scripts (e.g., `db:wipe`, `assign:loop`) could leave blind spots if not explicitly planned.
- Playwright baseline updates can produce noisy diffs; need variance-handling guidelines to avoid flakes or false positives (especially across browsers and mobile viewports).
- Stress tooling touches production-like data; parameterized loads must avoid impacting live tenants and respect rate limits/secret handling.
- Approval policy is `never`, so every plan element must be achievable without elevated permissions or new tooling installs.

## Open Questions (owner, due)

- Q: Do we have current coverage metrics (Vitest coverage %, Playwright pass rate) to prioritize gaps?  
  A: Not surfaced in repo; will propose capturing via CI dashboards and highlight as follow-up for QA lead (due Day 0).
- Q: Which Jira project houses resulting tickets referenced in the sprint backlog?  
  A: Ticket IDs unspecified; need confirmation from Release Manager before Day 1 backlog conversion.
- Q: Are there regulated data constraints impacting new load tests (e.g., PII in exports)?  
  A: Not documented; assume yes and include data-masking requirements pending security review by Day 2.

## Recommended Direction (with rationale)

- Follow sprint structure from prompt (inventory → criteria → implementation → verification) while mapping each workstream (Static Quality, Unit/Integration, Component/Visual, E2E, Load/Stress, Manual QA/A11y, Security & Secrets, Reporting) to concrete deliverables referencing existing scripts/configs.
- Establish cross-functional roles (QA lead, domain dev leads, UX a11y reviewer, Release manager) and ritual checkpoints (daily standups, Day5 design sync, Day9 readiness, Day10 demo) to ensure coverage progress is inspectable.
- Create backlog conversion checklist for Day0-1 using script inventory (verified via Node + Python parsing of `package.json` for redundancy) to guarantee no script is left without an associated new/updated spec.
- Emphasize evidence capture: baseline screenshots in `tests/visual/baselines`, Chrome DevTools logs, stress metrics exports, plus documentation updates (`docs/testing-strategy.md`, `tasks/.../verification.md`).
- Treat secret scanning and env validation expansions as first-class deliverables to prevent regressions when new keys/scripts are introduced.
