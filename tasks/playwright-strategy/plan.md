# Plan: Playwright strategy deliverable

## Goals

1. Document repository architecture relevant to Playwright.
2. Produce phased roadmap (Foundations → Coverage → Hardening) with exec summary.
3. Build coverage matrix capturing feature areas, test types, priorities, owners, data/network strategy.
4. Enumerate concrete high-value test cases per critical flow (happy path, edges, roles, i18n, multi-user when relevant).
5. Draft repo-ready scaffolding: file tree, config, fixtures, helpers, example specs covering auth, CRUD, payments, uploads, iFrame, service worker, WebSocket, feature flags.
6. Define data/network management approach, including seeds, mocks, HAR, concurrency patterns.
7. Outline visual/a11y/performance approach.
8. Provide CI/CD integration templates and npm scripts.
9. Offer migration guidance from existing Playwright/Cypress (only minimal Playwright now) to expanded suite.
10. Identify risks, gaps, open questions, plus backlog with effort/timeline/success metrics.

## Approach

1. Summarize architecture & flows using research context (Next.js App Router + Reserve SPA, API routes, Supabase).
2. Rank user journeys by risk (booking wizard, profile management, payments, marketing leads, etc.).
3. Create phased roadmap referencing toggles (`NEXT_PUBLIC_RESERVE_V2`), environment differences, dependencies.
4. Build coverage matrix table enumerating area vs type/browsers/data/network/priority/owner.
5. For each major flow (auth, onboarding/reservation, search? etc.), outline tests, selectors, edges, roles, i18n considerations.
6. Specify scaffolding file structure and config (projects, reporters, env handling, mobile). Provide TS code for config/fixtures/helpers/spec samples.
7. Document data strategy referencing database seeds, Supabase clients, route mocking options (MSW, Playwright HAR, API intercepts).
8. Outline visual/a11y/perf integration with Playwright + axe + screenshot flows.
9. Provide CI pipeline example (GitHub Actions) with smoke/full matrix, artifact uploads, scheduling.
10. List migration path for existing placeholder Playwright tests and integration with Vitest/MSW.
11. Identify open issues (missing test IDs, API stubs) and propose backlog/timeline/owners/metrics.

## Deliverables

- Comprehensive markdown response (final message) covering sections requested (1–10) with citations.
- Ensure plan references actual repo features (wizard, profile, bookings API, seeds, feature flags).
