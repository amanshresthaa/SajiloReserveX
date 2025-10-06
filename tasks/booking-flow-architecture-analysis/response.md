# Comprehensive Implementation Blueprints for Booking Flow Concerns

## Concern #1 — Dual UI Maintenance Burden

### Implementation Plan

- **Inventory & Comparison**
  - Generate component mapping between `components/reserve/booking-flow/**/*` and `reserve/features/reservations/wizard/**/*` using scripts to output a CSV for comparison.
  - Capture behavioral notes (props, side effects, analytics usage) in a matrix stored under `tasks/booking-flow-architecture-analysis/artifacts/ui-parity-matrix.csv`.
- **Shared Component Library**
  - Create `shared/components/booking-wizard/` with subfolders `layout/`, `fields/`, `steps/`, `providers/`.
  - Extract neutral primitives (wizard layout, progress indicator, contact form fields) using existing Tailwind classes and ShadCN components already installed.
  - Expose compound component API: `BookingWizard.Root`, `BookingWizard.Step`, `BookingWizard.Navigation` to support both Next.js and Vite apps.
- **Adapter Layer**
  - Introduce `shared/booking-wizard/adapters/navigation.ts` with `NavigationAdapter` interface plus concrete adapters for `next/navigation` (`app` router) and React Router (`reserve/app`).
  - Add adapters for analytics and modals to match DI usage in Reserve V2 (`WizardDependenciesProvider`).
- **Form Schema & Validation**
  - Consolidate Zod schemas into `shared/booking-wizard/schemas/` splitting by step (Plan, Details, Review).
  - Standardize React Hook Form controllers and error presentation; reuse `@/components/ui/*` primitives.
- **Migration Phases**
  - **Phase A:** Swap Reserve V2 components to shared modules; rely on existing DI to keep behavior identical. Verify via Vite Storybook and Playwright component tests.
  - **Phase B:** Move legacy wizard to shared components step-by-step (Plan → Details → Review → Confirmation) keeping `NEXT_PUBLIC_RESERVE_V2` flag for fallback.
  - **Phase C:** After parity, retire legacy entry point by always rendering `ReserveApp` in `app/reserve/page.tsx`, remove flag and delete legacy directory.

### Risk Assessment

- **Regression Risk:** Divergent UX flows; mitigated by parity matrix, Storybook snapshots, and dual Playwright e2e scripts (legacy & V2) during migration.
- **Integration Risk:** Path alias conflicts when importing shared components; validate with lint/typecheck pipelines after each move.
- **Timeline Risk:** Team bandwidth for component extraction; stage work per step and maintain daily parity checks.

### Rollback Strategy

- Keep legacy wizard intact behind feature flag until shared components prove stable; toggling flag reverts to unmodified flow.
- Maintain git branches per migration phase; if shared component faults arise, revert to previous release branch without touching upstream store.

### Testing Strategy

- **Unit/Component:** Add Storybook stories and Vitest tests for each shared component step with snapshot coverage.
- **Integration:** Run Playwright e2e flows for legacy and V2 during coexistence; once unified, prune legacy suite and keep new baseline.
- **Regression:** Utilize visual regression in Chromatic (if available) or Playwright trace viewer for key steps.

---

## Concern #2 — Performance Bottlenecks

### Implementation Plan

- **Caching Layer Setup**
  - Provision Upstash Redis instance; store connection details via env schema (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`).
  - Implement `server/cache/availability.ts` exposing async cache operations with configurable TTL and metrics hooks.
  - Add cache warming script (`scripts/warm-availability-cache.ts`) scheduled via Vercel cron/CI to precompute 7-day slot windows.
- **findAvailableTable Refactor**
  - Refactor to fetch candidate tables once (`getTablesWithMetadata`) and run `checkTableAvailability` in parallel with `Promise.allSettled` to short-circuit upon first available slot.
  - Optimize Supabase query using RPC or SQL view that filters conflicts by timeframe; ensure utilization of composite index on `(table_id, start_time)`.
- **Database Enhancements**
  - Generate SQL migration adding `idx_bookings_availability` and optional materialized view `booking_availability_mv` refreshed via Supabase cron.
  - Evaluate partitioning by month using Supabase `pg_partman` extension.
- **Request Deduplication**
  - Implement `server/cache/request-deduplication.ts` with promise map; wrap availability fetches in `deduplicate` to collapse concurrent identical requests.
- **Observability & Instrumentation**
  - Instrument timing metrics using existing analytics stack (e.g., `recordObservabilityEvent`) tagging cache hits/misses and query durations.
  - Create dashboards (Datadog/Grafana) showing latency percentiles and cache efficacy.
- **Load Testing**
  - Author Artillery or k6 scripts under `scripts/perf/booking-load.test.js` simulating 1000 concurrent bookings, varying party size and durations.
  - Integrate into CI optional job or manual pipeline triggered before releases.

### Risk Assessment

- **Cache Inconsistency:** Potential stale data; mitigate with atomic invalidation tied to booking mutations and short TTL.
- **Resource Limits:** Upstash free tier constraints; plan paid tier or self-hosted Redis if throughput exceeds quotas.
- **Complexity:** Parallel queries may increase DB load; monitor Supabase rate limits and adjust concurrency.

### Rollback Strategy

- Feature-flag cache usage via env (`ENABLE_AVAILABILITY_CACHE`); disable to return to direct DB reads.
- Retain sequential function behind adapter; re-export previous version for quick rollback if parallel logic misbehaves.
- Keep SQL migrations reversible (drop index/view scripts) ready in `down` migrations.

### Testing Strategy

- **Unit:** Mock Redis client to verify cache-aside behavior and invalidation.
- **Integration:** Spin up Supabase test schema; run parallel booking scenarios ensuring no double bookings.
- **Performance:** Compare baseline vs optimized metrics using load tests; document improvements.
- **Monitoring Verification:** Inject synthetic traffic and confirm dashboard metrics update.

---

## Concern #3 — TypeScript Configuration

### Implementation Plan

- **Baseline Strict Config**
  - Add `tsconfig.strict.json` extending base config with `strict: true`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `exactOptionalPropertyTypes`.
  - Run `npx tsc --noEmit -p tsconfig.strict.json` to produce `typescript-errors.md` sorted by error code via script.
- **Prioritization Matrix**
  - Categorize errors (implicit any, null checks, property initialization) and compute counts per directory; store in `tasks/.../artifacts/ts-strict-report.json`.
  - Target core server modules and API routes first.
- **Incremental Flag Activation**
  - Toggle individual strict flags in main `tsconfig.json` according to readiness; enforce `noImplicitAny` and `strictNullChecks` earliest.
  - Gate new file exemptions via ESLint custom rule (e.g., `@typescript-eslint/ban-ts-comment` with allow-list limited to migrating files).
- **Fix Patterns & Utilities**
  - Introduce reusable type guards (e.g., `isConfirmedBooking`, `hasLoyaltyProfile`).
  - Normalize optional chaining and nullish coalescing for Supabase responses.
  - Adopt discriminated unions for booking result flows and idempotency responses.
- **Tooling & CI**
  - Update `package.json` with `"typecheck:strict": "tsc --noEmit -p tsconfig.strict.json"` and add GitHub Action to enforce on PRs tagged `strict`.
  - Integrate `type-coverage` tool to monitor coverage; fail if <95% once strict mode is on.
- **Knowledge Sharing**
  - Document patterns in `CONTRIBUTING.md` (pending users request) and host internal walkthrough; add VSCode snippet suggestions for common fix templates.

### Risk Assessment

- **Velocity Slowdown:** High initial error count; mitigate by time-boxed sprints and focusing on high-impact areas.
- **Developer Friction:** New errors surfacing in PRs; provide lint autofixers and pair programming sessions.
- **Legacy Code Edge Cases:** Some legacy modules may require heavier refactors; consider rewriting small modules instead of patching.

### Rollback Strategy

- Keep `strict` disabled in base config until core modules pass; revert to baseline by removing `tsconfig.strict.json` references if needed.
- Use branch strategy for strict migration; unreleased branches can be dropped without affecting production.

### Testing Strategy

- Ensure existing unit/integration suites run under strict mode to catch behavior changes.
- Add targeted tests when refactoring null handling to guarantee logic parity.
- Track `typecheck:strict` in CI to prevent regressions.

---

## Concern #4 — Runtime Environment Validation

### Implementation Plan

- **Schema Definition**
  - Create `config/env.schema.ts` housing Zod schemas for base, development, staging, production; align key names with existing env usage (`NEXT_PUBLIC_SUPABASE_URL`, etc.).
- **Validation Script**
  - Implement `scripts/validate-env.ts` using `dotenv` to load `.env`, `.env.local`, `.env.${NODE_ENV}`; parse with schema and emit developer-friendly errors.
  - Register `npm run validate:env` plus `prebuild`/`predev` hooks to enforce validation before build/dev.
- **Runtime Accessor**
  - Add `lib/env.ts` exposing memoized `getEnv()` and grouped getters (supabase, app, features, integrations); remove direct `process.env` usage across codebase.
- **Template & Tooling**
  - Provide `.env.*.example` templates matching schema and guiding developers on stage-specific requirements.
  - Add setup script (`scripts/setup-env.ts`) to scaffold `.env.local` interactively and run validation automatically.
- **CI/CD Integration**
  - Update GitHub workflows to inject secrets into `.env` before running `npm run validate:env` and builds.
  - For Vercel, prepend build command with `npm run validate:env`; optionally add Node script verifying `process.env` completeness.

### Risk Assessment

- **Build Failures:** Missing secrets halt deploys; mitigate via explicit messaging and secret management process before rollout.
- **Developer Experience:** Stricter validation may disrupt local setup; provide setup script and docs to smooth adoption.
- **Security:** Handling env files in scripts; ensure `.env` remains gitignored and secrets managed via CI vaults.

### Rollback Strategy

- Keep runtime guard in `lib/env.ts` optional; allow bypass by setting `SKIP_ENV_VALIDATION=true` during emergencies.
- Remove `prebuild` hook temporarily if build pipeline blocked; maintain script for manual runs until issues resolved.

### Testing Strategy

- Unit test schema parser with sample env payloads ensuring environment-specific rules (prod keys require `sk_live_` prefix, etc.).
- Integration test by running `validate:env` in CI against sanitized `.env.example` to confirm developer instructions remain valid.
- Smoke test builds locally with intentionally missing vars to verify error messaging.

---

## Concern #5 — Synchronous Side Effects

### Implementation Plan

- **Queue Selection & Setup**
  - Adopt Inngest for serverless-friendly integration or BullMQ if preferring Redis-backed workers; prototype both during spike, default to Inngest for minimal ops overhead.
  - Create `lib/jobs/client.ts` or `lib/jobs/queue.ts` depending on choice, defining strongly typed events/jobs.
- **API Refactor**
  - Modify `app/api/bookings/route.ts` (POST, DELETE) to enqueue side-effect jobs instead of executing synchronously; respond immediately after transactional DB write.
  - Use consistent idempotency keys (booking ID) for job dedupe; log job IDs in audit logs.
- **Worker Processes**
  - Implement job handlers under `jobs/workers/*` handling emails, loyalty, analytics, waitlist notifications; ensure each operation is idempotent and includes retry/backoff.
  - Provide dead-letter handling with alerting (Slack/email) and manual retry tooling via admin API.
- **Fallbacks & Circuit Breakers**
  - Introduce queue fallback helper to sync-execute critical actions if queue unreachable; apply circuit breaker for flaky providers (email, analytics) to avoid cascading failures.
- **Monitoring & Admin Tooling**
  - Build admin endpoint/UI to inspect queue metrics (`waiting`, `failed`, `completed`).
  - Instrument job success/failure metrics and surface in observability platform with alerts at >0.1% failure rate.
- **Deployment**
  - For BullMQ: extend deployment manifests (Docker Compose, Railway) to run dedicated worker processes; ensure graceful shutdown by draining queues.
  - For Inngest: configure event sources/steps in `inngest.config.ts` and deploy via Inngest dashboard; integrate with Vercel build.

### Risk Assessment

- **Data Loss:** Jobs dropped due to misconfiguration; mitigate with persisted queues (Redis) and dead-letter retry flows.
- **Operational Overhead:** Workers require monitoring; automate alerts and runbooks.
- **Complexity:** Additional infrastructure may increase maintenance; start with managed offering (Inngest) to reduce effort.

### Rollback Strategy

- Keep synchronous code path gated by env flag (`USE_ASYNC_SIDE_EFFECTS`); disable to revert to prior behavior if queue instability detected.
- Maintain ability to execute critical side effects (confirmation emails) synchronously on-demand via fallback helper.

### Testing Strategy

- **Unit:** Mock queue clients ensuring enqueues happen with expected payloads and idempotency keys.
- **Integration:** Run worker handlers against staging providers (Resend sandbox, analytics dev endpoint) verifying retries and logging.
- **End-to-End:** Execute booking flow and confirm asynchronous effects processed within SLA; inspect queue metrics.
- **Resilience:** Simulate provider downtime to validate retry/backoff and circuit breaker behavior.

---

## Timeline & Dependencies Overview

| Sequence | Initiative                            | Duration  | Dependencies                                  |
| -------- | ------------------------------------- | --------- | --------------------------------------------- |
| 1        | TypeScript Strict Mode (Concern 3)    | 3–4 weeks | Foundation for safer refactors                |
| 2        | Build-Time Env Validation (Concern 4) | 2 weeks   | Relies on strict-friendly env modules         |
| 3        | Async Side Effects (Concern 5)        | 4–5 weeks | Requires env validation for queue secrets     |
| 4        | Performance Optimizations (Concern 2) | 5 weeks   | Needs async side effects to keep API lean     |
| 5        | UI Consolidation (Concern 1)          | 5 weeks   | Benefits from strict types and stable backend |

## Success Metrics Recap

- Strict Mode: 0 TS errors, >95% type coverage, improved IDE support.
- Env Validation: 100% build-time detection of missing/invalid vars; faster onboarding.
- Async Jobs: <300 ms API response, >99.9% side-effect success.
- Performance: <300 ms avg booking response, >80% cache hit rate, support 5000 bookings/hour.
- UI Consolidation: 50% reduction in booking UI code, single shared wizard, no UX regressions.
