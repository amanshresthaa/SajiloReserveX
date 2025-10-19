# Core Improvements — 2025-10-21

1. **Coverage Expansion**
   - Added analytics event emitter tests validating schema-versioned payloads and error propagation (`tests/server/analytics/events.test.ts`).
   - Hardened restaurant details sanitisation + validation through Supabase-mocked tests (`tests/server/restaurants/details.test.ts`).
   - Wrapped auth guard behaviours with dedicated suites covering session resolution, membership remapping, and error translation (`tests/server/auth/guards.test.ts`).
   - Strengthened booking guard coverage for invalid timezones and override handling (`tests/server/bookings/pastTimeValidation.test.ts`).
   - Ensured rate limiter exercises redis, fallback warnings, and memory rollover scenarios (`tests/server/security/rate-limit.test.ts`).
   - Captured deterministic reducer transitions for the reservation wizard (`tests/server/reserve/wizardReducer.test.ts`).

2. **Performance Profiling**
   - Introduced dense-adjacency selector stress test checking merge enumeration bounds (`tests/server/capacity/selector.performance.test.ts`).
   - Manual harness run (`pnpm tsx --tsconfig tsconfig.json /tmp/capacity-perf-sample.ts`) confirmed 36-table graph evaluated 540 merges in ~9.09 ms.

3. **Documentation & Task Tracking**
   - Updated `research.md`, `plan.md`, and `todo.md` to reflect new coverage obligations, stress testing, and verification steps.
   - Logged executed commands and results inside `verification.md` for auditability.

4. **Open Follow-Ups**
   - Manual Chrome DevTools MCP QA pending for Ops dashboard + capacity UI.
   - Consider similar contract tests for loyalty/observability modules to keep parity with new coverage.

5. **Verification Commands**
   - `pnpm vitest run tests/server/analytics/events.test.ts tests/server/security/rate-limit.test.ts tests/server/auth/guards.test.ts tests/server/capacity/selector.performance.test.ts tests/server/bookings/pastTimeValidation.test.ts --config vitest.config.ts`
   - `pnpm vitest run tests/server/restaurants/details.test.ts --config vitest.config.ts`
   - `pnpm vitest run tests/server/reserve/wizardReducer.test.ts --config vitest.config.ts`
