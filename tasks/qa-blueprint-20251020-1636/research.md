# Research: Repository QA Blueprint

## Existing Patterns & Reuse

- **Next.js App Router domain** – Customer, ops, and auth flows live under `src/app/**` with providers from `src/app/layout.tsx` and middleware gating in `middleware.ts`. Verified via `rg --files -g 'page.tsx' src/app` and manual inspection of `COMPREHENSIVE_ROUTE_ANALYSIS.md`.
- **REST APIs co-located with routes** – All handlers in `src/app/api/**/route.ts` share helpers from `server/*` (e.g., guards in `server/auth/guards.ts`, rate limits in `server/security/rate-limit.ts`). Checked by listing routes with `rg --files -g 'route.ts' src/app/api` and tracing imports.
- **Shared service layer** – Business logic consolidated in `server/` (bookings, customers, occasions, emails, observability). `server/bookings.ts` reuses Supabase helpers from `server/supabase.ts` and caching in `server/cache/availability.ts`.
- **Reserve Vite micro-frontend** – Self-contained wizard under `reserve/` using React Router (`reserve/app/routes.tsx`) and shared config (`reserve/shared/config/env.ts`). Communicates with `/api` via `reserve/shared/api/client.ts`.
- **Testing toolbelt** – Vitest (`pnpm test` -> `reserve/vitest.config.ts`), Playwright for E2E/component (`playwright.config.ts`, `playwright.component.config.ts`), Testing Library for components. Existing E2E portfolio documented in `tests/e2e/E2E_TEST_COVERAGE_SUMMARY.md`.
- **Docs as source of truth** – Architecture, flows, and DB schema already captured in `documentation/` (e.g., `API_INTEGRATION_GUIDE.md`, `DATABASE_SCHEMA.md`) and high-signal operational notes in `COMPREHENSIVE_ROUTE_ANALYSIS.md`.

## External Resources

- `COMPREHENSIVE_ROUTE_ANALYSIS.md` – current inventory of pages/API routes; cross-checked with file system.
- `documentation/API_INTEGRATION_GUIDE.md` – base URLs, auth contracts, rate limits for `/api/v1`.
- `documentation/DATABASE_SCHEMA.md` + `supabase/migrations/20251019102432_consolidated_schema.sql` – canonical table, RLS, index definitions.
- `tests/e2e/E2E_TEST_COVERAGE_SUMMARY.md` & `tests/e2e/ADDITIONAL_COVERAGE_SUMMARY.md` – state of automated coverage, flakes, pending work.
- `openapi.yaml` – official schema for versioned REST endpoints; aligns with handlers in `src/app/api/v1/**`.
- `documentation/FEATURES_SUMMARY.md` – business epics & user stories for booking, ops, loyalty, security.

## Constraints & Risks

- **Supabase remote-only** – Per root `AGENTS.md` and scripts in `package.json`, migrations/seeds (`supabase/utilities/*.sql`) must target remote; jeopardizes seeding strategies.
- **Feature flag drift** – Numerous env toggles in `lib/env.ts` (e.g., `FEATURE_OPS_METRICS`, `FEATURE_ASSIGN_ATOMIC`); QA must exercise on/off paths.
- **Role nomenclature mismatch** – Docs mention roles `owner/admin/staff/viewer`, but DB constraint (`restaurant_memberships_role_check`) and `lib/owner/auth/roles.ts` enforce `owner/manager/host/server`. Need to clarify in plan.
- **Flaky / incomplete tests** – Playwright suites for ops flows timing out (per coverage summary); placeholders for payments lack implementation.
- **Cache & rate limits** – Upstash Redis optional; fallback to in-memory (`server/security/rate-limit.ts`) diverges from prod behavior.
- **Analytics & PII** – Emails flow via Resend (`libs/resend.ts`), analytics events queue in browser (`lib/analytics/emit.ts`) with hashed identifiers, requiring log redaction tests.

## Open Questions (and answers if resolved)

- Q: Are “viewer/admin” roles still relevant?  
  A: Code enforces `owner/manager/host/server`; plan should highlight doc/code discrepancy and validate with stakeholders.
- Q: Do payments exist beyond placeholders?  
  A: No active payment service detected (only placeholder tests and `stripe_events` table). Treat payment coverage as future-ready section.
- Q: What environments are active?  
  A: Docs list prod/staging/dev with distinct base URLs; CI runs on GitHub Actions via `.github/workflows/ci.yml`.

## Recommended Direction (with rationale)

- Build QA blueprint around **three surfaces**: Next.js app (customer + ops), Reserve wizard, and Supabase-backed services. Each has distinct entry points and risks.
- Leverage existing service abstractions (`server/**`) to anchor integration & contract tests rather than duplicating logic in UI layers.
- Use documentation artifacts as references but validate against code (as done for routes and roles) to avoid drift.
- Prioritize gating around bookings lifecycle, team invitations, resource availability, and data integrity—core monetization and operational value.
- Address known automation gaps (ops dashboard, payment placeholders) with actionable stabilization roadmap tied to existing Playwright/Vitest infrastructure.
