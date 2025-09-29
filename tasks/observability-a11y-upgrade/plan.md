# Plan – Observability, Accessibility, QA Stories

## 0. Guiding principles

- Apply repo’s existing patterns: reuse `lib/analytics/emit.ts`, React Query hooks, Radix UI dialogs, `reserve/tests/*` layout, Supabase service helpers.
- Respect accessibility/performance checklist supplied (focus-visible, keyboard, semantics, polite live regions, etc.).
- Keep scope aligned with Stories E1–E3, F1–F2; prioritise non-optional stories first (E1, E2, F1, F2), then tackle optional E3 if time allows.
- Challenge assumptions at each step: validate data sources, confirm behaviour via tests/logging, and document unresolved risks.

## 1. Story E1 – Client analytics events

1. **Schema alignment & typing**
   - Define shared `AnalyticsEvent` TypeScript type reflecting required schema `{ name, ts, user, context, props }`.
   - Add helper(s) to produce `anonId` (stable UUID per browser) and deterministic `emailHash` (SHA-256 of lowercase email or null when unavailable) without exposing raw email.
   - Decide data sources: use Supabase session for email/user id; fallback to anonymised random id if unauthenticated. Validate session fetch cost (avoid blocking UI).
   - Confirm build version source: scan for env constant (e.g., `NEXT_PUBLIC_RELEASE_VERSION`); if absent, plan to accept optional `appVersion` parameter from environment/config.
2. **Emitter design**
   - Extend `lib/analytics/emit.ts` to queue events client-side (buffer until next flush or page unload).
   - Implement flush strategies: `navigator.sendBeacon` where available; fallback to batched `fetch` POST. Ensure retries/backoff and drop-on-failure policy to avoid memory growth.
   - Provide dev-mode console logger (existing behaviour) plus optional immediate flush toggle for debugging.
   - Ensure JSON payload matches schema exactly; include route context (use `next/navigation` `usePathname` or require callers to pass route?). Evaluate trade-offs and pick consistent approach (e.g., emitter-level route capture via optional injection).
3. **Usage updates**
   - Update existing emit callsites (hooks, dialogs, empty state) to pass structured `props` only; emitter should inject user/context automatically.
   - Add instrumentation for any missing “key UI actions” noted in DoD (verify coverage across dashboard: login success? filter change? confirm requirements with product stakeholder if ambiguous).
4. **Validation & docs**
   - Add unit tests for emitter (queueing, flush, dev logging). Use Vitest + fake timers/fetch.
   - Document usage in `lib/analytics/README` or inline comments.
   - Verify `/api/events` still handles new schema (update handler or tests as needed); add schema validation there if feasible.

## 2. Story E2 – Accessibility pass

1. **Audit inventory**
   - Enumerate all dashboard components/routes (Bookings table, dialogs, filters, pagination, empty state, header/nav, forms).
   - For each, evaluate against provided checklist: keyboard support, focus management, aria labels, button text, semantics, error messaging, `aria-live` usage, etc.
2. **Dialog focus management**
   - Confirm Radix Dialog focus trap works out of the box; add explicit `DialogClose` buttons where missing (e.g., accessible “Close” text or icon-only `aria-label`).
   - Ensure `DialogContent` includes `role="dialog"` (Radix handles) and `aria-describedby` references only existing elements.
   - Add optional `components/a11y/FocusGuard.tsx` if gaps remain (e.g., custom overlays or drawers).
3. **Controls & tables**
   - Ensure every button/link has discernible text; add `aria-label` for icon-only actions (audit `StatusChip`, `Pagination`, `Header`).
   - Verify table markup uses `<th scope="col">` and `<tr>` already; adjust if additional tables exist.
4. **Form behaviour**
   - Check form inputs for `autocomplete`, `name`, proper `type/inputmode`. Ensure validation errors focus first invalid element.
   - Guarantee loading buttons keep label + spinner (update `Button` variants if necessary).
5. **Automated checks (optional)**
   - Set up Playwright or Cypress + axe check for dashboard route (only if quick win and stable in CI). Document manual audit results if automation deferred.
6. **Verification**
   - Add targeted accessibility-focused unit tests (Testing Library + `axe-core` via `vitest-axe`?) if allowed; otherwise manual checklist documented in `tasks/.../a11y.md`.

## 3. Story E3 – DB / RLS linkage (optional)

1. **Schema decision**
   - Reconcile `supabase_user_id` vs existing `auth_user_id`. Options: (a) rename column, (b) add alias column + triggers, (c) skip due to redundancy. Reach consensus before migration.
2. **Migration**
   - If proceeding, create SQL migration adding column + index, update `database.sql`, seeds, and generated `types/supabase.ts`.
3. **Backfill job**
   - Implement script (SQL or server job) to map `customers.email -> auth.users` and populate new column. Document partial successes (“best-effort”).
4. **RLS policy**
   - Define RLS on `bookings` for `SELECT`/`UPDATE` verifying `auth.uid()` matches linked `customers.supabase_user_id` (or `auth_user_id`).
   - Update server to set `supabase_user_id` on new bookings when session exists.
5. **Testing**
   - Add SQL tests or server integration tests verifying policy enforcement (e.g., supabase-js row-level queries with different auth context).

## 4. Story F1 – Unit tests (Vitest)

1. **API list filters & auth**
   - Add tests covering `/api/bookings?me=1` query: filter permutations (status, pagination) + unauthorized vs authorized. Reuse service mocks; extend to ensure RLS changes don’t break tests.
2. **Hooks**
   - Write tests for `useBookings`: error handling (should surface toast? -> confirm), caching keys (ensures consistent queryKey). Need to mock `fetchJson` and React Query context.
3. **Components**
   - Expand existing dialog tests: ensure spinner text, focus behaviour (open to verifying with `document.activeElement`). Add tests for validation & error messaging per DoD.
4. **Test utilities**
   - Provide fetch mock helper (if not existing) to reduce duplication; ensure tests run under JSDOM via `reserve/tests/setup-tests.ts`.

## 5. Story F2 – Playwright flows

1. **Environment prep**
   - Confirm Playwright config & baseURL usage. Provide instructions/env sample for running against dev server (`next dev`).
   - Build helper to seed data via API or SQL: re-use `database/seed.sql` and/or create fixture endpoint.
2. **Scenario scripts**
   - Implement `reserve/tests/e2e/dashboard.spec.ts` with scenarios:
     - Magic link dev login → view dashboard list.
     - Edit future booking -> overlap rejection -> success path.
     - Cancel booking -> status updated.
     - Empty state user -> CTA to `/reserve` works.
   - Use data-test attributes for stable selectors; add them to UI where necessary (ensuring they don’t harm a11y).
3. **Verification & artifacts**
   - Ensure tests capture screenshots or traces on failure if desired. Update README/test docs.

## 6. Validation & verification pass

- Run `pnpm lint`, `pnpm test`, `pnpm test:e2e` as applicable.
- Document verification evidence in `tasks/observability-a11y-upgrade/verification.md` once executed.
- Re-review accessibility checklist to ensure compliance.

## 7. Outstanding questions / decisions to track

1. Clarify `supabase_user_id` vs `auth_user_id` duplication (blocker for E3).
2. Identify source of `context.version` for analytics events (env var? build metadata?).
3. Confirm minimal acceptable scope for “key UI actions” instrumentation (beyond bookings flows?).
4. Determine whether automated a11y checks are mandatory.
5. Validate test environment support for Playwright (CI vs local) and data seeding strategy.

## 8. Next steps sequencing

1. Finalise outstanding questions with stakeholders.
2. Implement Story E1 (emitter + instrumentation + tests).
3. Conduct accessibility audit & fixes (Story E2).
4. Add Vitest coverage (Story F1).
5. Add Playwright flows (Story F2).
6. Optional: proceed with Story E3 once schema decision resolved.
