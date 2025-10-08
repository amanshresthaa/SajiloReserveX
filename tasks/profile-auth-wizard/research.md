# Research — Profile, Wizard Offline, Auth Guards

_Date_: 2025-01-14  
_Scope_: US-005 Profile Management, US-006 Wizard QA & Offline, US-007 Auth Flow & Guards  
_Inputs_: repo inspection (`rg`, `sed`), Vitest/Playwright suites, Supabase client utilities, analytics helpers, existing task plans (e.g. `tasks/sprint-1-foundation-execution/plan.md`)

## 0. Task Outline & Subtasks

- **US-005**: (a) profile fetch + form prefill, (b) update mutation w/ idempotency + analytics, (c) avatar upload error UX, (d) Vitest + Playwright flows.
  - Challenge framing: do current hooks satisfy requirements, or are there edge cases (idempotency, hydration, analytics coverage) still missing?
- **US-006**: (a) wizard offline banner + analytics, (b) skeleton parity + optimistic states, (c) failure analytics (`booking_cancel_error` etc.), (d) offline simulations in Vitest/Playwright.
  - Scrutinise wizard state machine (`useReservationWizard`) for existing support; cross-check Reservation detail page offline pattern as reference.
- **US-007**: (a) Supabase server client + middleware checks, (b) route protection for `/dashboard`, `/profile`, wizard post-confirmation, (c) `/signin` UI using RHF + shadcn, (d) magic link/password flows + tests.
  - Verify current middleware & signin page; identify mismatches vs acceptance criteria.

> **Meta-check**: For each subtask, compared code-level findings with tests + config to challenge assumptions (e.g. verifying middleware behaviour via Playwright specs, ensuring analytics events exist in unions, confirming Supabase clients already exported).

## 1. US-005 — Profile Management

### 1.1 Existing Data Flow & Prefill

- `app/(authed)/profile/manage/page.tsx` fetches server profile via `getOrCreateProfile` and renders `ProfileManageForm` with SSR-prefilled data (`components/profile/ProfileManageForm.tsx` lines 31-36).
  - Server helper `getOrCreateProfile` (`lib/profile/server.ts`) normalises Supabase rows and ensures hydration-safe defaults.
- Client hook `useProfile` (`hooks/useProfile.ts:19-34`) issues `/api/profile`, populating TanStack cache (`queryKeys.profile.self()`), aligning with form’s `useEffect` warm-cache call.
  - Verified query uses `fetchJson` with credentials include; ensures consistent Accept headers.
- **Gap check**: Prefill path is complete; need to confirm hydration/resets for TDD? Tests already cover resets & focus management (`reserve/tests/profile/ProfileManageForm.test.tsx`).

### 1.2 Update Mutation + Idempotency + Analytics

- `useUpdateProfile` mutation handles optimistic updates + emits `track('profile_updated')` and `emit('profile_updated')` upon success; errors revert cache + toast.
  - Mutation currently sends plain `PUT /api/profile` JSON without idempotency headers.
- API route `app/api/profile/route.ts` validates inputs with `profileUpdateSchema` and updates Supabase row. No idempotency semantics yet (e.g. ensuring repeat submissions dedupe).
  - Compare to bookings API (`app/api/bookings/route.ts`) where `Idempotency-Key` header normalised & stored; no equivalent column on `profiles`. Need to explore Supabase schema for `profiles` to ensure column exists or needs adding (checked `types/supabase.ts`: profiles table lacks `idempotency_key`).
  - Alternative idea: use middleware-level idempotency token (e.g. `If-Match` on `profiles.updated_at`). Need investigation.
- Analytics union already contains `profile_updated` & `profile_upload_error` (`lib/analytics.ts`), so new events should extend there if necessary (e.g. `profile_update_retry`?).
- **Conclusion**: idempotency still missing; must design approach (client key + server persistence) or justify via actual requirement (maybe treat repeated payloads as idempotent by comparing fields). Need to confirm with stakeholder? For now plan to store key with Supabase `profiles_update_requests` table or reuse `profiles.id` + `updated_at`.

### 1.3 Avatar Upload Error Handling

- Form uses `useUploadProfileAvatar` mutation; `onError` tracks + emits `profile_upload_error`, and UI surfaces toast plus inline message (`ProfileManageForm.tsx:153-167, 224-239`).
  - File validation occurs client-side (`validateAvatarFile`) to reduce server load; ensures preview blob cleanup.
- Playwright `tests/e2e/profile/avatar-upload.spec.ts` covers upload success + toast. No test for error path; need new scenario mocking failure (e.g. intercept `/api/profile/image` 500).
- Accessibility: inline error `role="alert"` ensures screen reader announcement; focus resets to status message after success to meet `aria-live` requirement.

### 1.4 Testing Inventory

- Vitest suite (`reserve/tests/profile/ProfileManageForm.test.tsx`) already covers validation, submission, empty state. No coverage for avatar error `toast` or analytics.
  - To satisfy TDD requirement, need new tests for: (a) idempotency key generation logic (if introduced), (b) analytics emission verifying `track/emit` called with expected fields, (c) avatar upload error path toggles `aria-live` message.
- Playwright coverage limited to happy-path avatar upload; need keyboard navigation test for entire form (per todo). Use `userPress` to tab through, ensure `Enter` submission works, focus returns to error.

### 1.5 Open Questions / Risks

- **Idempotency persistence**: Without DB column, we must decide on approach. Options: (1) add `profile_update_events` table storing `idempotency_key`; (2) rely on `If-Unmodified-Since` semantics using `updated_at`; (3) treat updates as safe because they’re PATCH-like (but requirement explicitly wants idempotency).
  - Need alignment on Supabase schema changes (migrations). Check `supabase/migrations` to confirm ability to alter table.
- **Analytics duplicates**: `ProfileManageForm` triggers `track` inside both `useUpdateProfile` and `validateAvatarFile`. Need to ensure new instrumentation doesn’t double-send events.
- **Form prefill**: `useProfile` warms query using server data; must guard against flicker if API returns stale data (should rely on updated `updatedAt`). Could add eTag to mitigate but optional.

## 2. US-006 — Wizard QA & Offline

### 2.1 Current Wizard Behaviour

- Core hook `useReservationWizard` orchestrates step transitions, idempotent submission via `useCreateReservation` (which already generates `Idempotency-Key` header and resets on success).
  - Mutation triggers analytics `track('booking_created')` with minimal payload (party/time/reference). Failure path sets error but no analytics.
- Layout `WizardLayout.tsx` lacks offline messaging; wizard steps don’t use `useOnlineStatus`.
  - Compare to reservation detail page offline UX (`app/reserve/[reservationId]/ReservationDetailClient.tsx:180-210, 360-380`): uses `useOnlineStatus`, `track('network_offline')`, `emit`. Provides `Alert` with `aria-live="polite"`.

### 2.2 Offline Banner Patterns

- `hooks/useOnlineStatus.ts` is SSR-safe, defaulting to `true`. Should reuse for wizard.
  - Need to ensure offline analytics deduplicated (reservation detail uses refs to avoid duplicate track). Should replicate pattern (store `lastOnlineAt`, guard by boolean).
  - For offline banner component, can extract from reservation detail? Possibly create shared `<OfflineAlert>` component in `components/ui/` or `reserve/features/...`.

### 2.3 Skeleton Parity & Optimistic States

- `WizardLayout` default skeleton is simple spinner (`BookingWizard.tsx:16-31`). Need to compare with existing content skeleton spec (`tasks/sprint-1-foundation-execution/plan.md` lines 106-118).
  - Already using optimistic UI: `useCreateReservation.onMutate` omitted -> only server success updates. Might need local optimistic state in `useReservationWizard` for sticky actions? Should confirm requirement more precisely.
- Check other components for skeleton references (Plan step?). `reserve/features/reservations/wizard/ui/steps/PlanStep/PlanStepForm.tsx` uses `Skeleton`? need to inspect to confirm loading states.

### 2.4 Failure Analytics

- `booking_cancel_error` already instrumented in `hooks/useCancelBooking.ts`. For wizard we probably need to track `details_submit` errors or network failures.
  - Check existing analytics union: includes `booking_cancel_error`. Need to add new events if spec demands (maybe `wizard_submit_failed`).
  - `useCreateReservation` currently lacks `emit`/`track` on error; we should design instrumentation to align with detail page (both track + emit).

### 2.5 Testing Landscape

- Vitest analytics suites exist for plan/review steps (see `reserve/tests/features/wizard/*.analytics.test.tsx`). No tests for offline logic or failure analytics.
  - Add new tests verifying offline hook triggers track/emit once (mock `useOnlineStatus`). Could simulate with `renderHook`.
  - Use TDD: write failing tests in `reserve/tests/features/wizard/confirmation-step.offline.test.tsx` (or similar) before implementing.
- Playwright offline scenario `tests/e2e/service-worker/offline.spec.ts` currently skipped without `PLAYWRIGHT_TEST_OFFLINE`. It expects offline notice when offline during confirmation (but current UI doesn’t show, so test would fail if unskipped). Need to enhance flow to satisfy spec and optionally unskip when env var set.

### 2.6 Risks & Alternatives

- Must ensure offline banner doesn’t block focus progression. Should insert within main content but before hero, similar to detail page.
  - Consider storing offline state in context to disable actions (e.g. confirm button). Evaluate trade-off: do we disable confirm while offline? Maybe spec only wants banner + analytics.
- Need to double-check skeleton parity spec: may require placeholder matching each step (Plan/Details). Might need to design new skeleton components.

## 3. US-007 — Auth Flow & Guards

### 3.1 Supabase Client & Middleware

- `server/supabase.ts` already exports `getServerComponentSupabaseClient`, `getRouteHandlerSupabaseClient`, and `getMiddlewareSupabaseClient` with cookie adapters & service client caching.
  - Middleware `middleware.ts` refreshes Supabase session and guards `/dashboard` + `/profile` (regex). Routes redirect to `/signin?redirectedFrom=...` using config `auth.loginUrl`.
  - `app/reserve/[reservationId]/page.tsx` manually redirects to `/signin` if not authed (guards wizard confirmation). So requirement largely met; need to confirm coverage for “wizard post-confirmation” (maybe needs to guard `/reserve/thank-you` or similar). Search indicates `useReservationWizard.handleClose` pushes `/thank-you`; must ensure route protected if necessary (verify actual route).
- Playwright `tests/e2e/profile/auth-redirect.spec.ts` ensures unauthenticated redirect to `/signin`. Dashboard spec also checks redirect.
  - Need new tests verifying middleware with Supabase session check (maybe unit test using `vitest` + request mocks) or rely on Playwright.

### 3.2 `/signin` UI State

- Current `app/signin/page.tsx` uses legacy DaisyUI + imperative Supabase calls; lacks React Hook Form, password support, analytics, accessible feedback.
  - No password field currently; requirement demands both magic link + password flows.
  - Need to rebuild using shadcn `Form`, `Input`, `Button`, `Tabs`? Could use `react-hook-form` w/ Zod for validation.
  - Should incorporate `track` events (e.g. `track('auth_login_submit')`? Not currently defined—would need to extend analytics union).
  - Provide spinner on submit (per spec: keep label, show spinner).
  - Manage focus, `aria-live`, error toast, idempotent submission (disable after request).

### 3.3 Magic Link & Password Support

- Supabase client: `getSupabaseBrowserClient` (singleton). Need to implement `signInWithPassword` path.
  - Ensure password field uses `type="password"`, `autoComplete="current-password"`, min 16px font.
  - Provide fallback for mobile (avoid auto-focus). Manage `Cmd+Enter` vs `Enter`.

### 3.4 Testing

- Vitest: Need to add tests for new form logic (mock Supabase client). Could place under `tests/unit/auth/signin-form.test.tsx` or similar.
  - For TDD, start by isolating form component (maybe create `components/auth/SignInForm.tsx`) with unit tests verifying validation, submission states, focus on error.
- Playwright: Add keyboard flow test hitting `/signin` ensuring Tab order, Enter submit, error message on invalid credential (requires stub backend or test credentials).
  - `tests/e2e/profile/auth-session.spec.ts` already outlines success path but currently skipped; form changes must align (fields names). Should update to use new selectors.

### 3.5 Risks & Unknowns

- Need to ensure Supabase env variables present in runtime; instructions confirm they exist. Still, consider fallback path if not configured (show support message).
  - For password login, must handle rate limits; include defensive error display.
  - Remember to maintain `redirectedFrom` query param to send back after login success.

## 4. Shared Patterns / Reuse Opportunities

- **Analytics**: Use `track` + `emit` together (observed in `hooks/useCancelBooking.ts`, `ReservationDetailClient`). Add new event strings to `lib/analytics.ts` and test `emit` queue (`reserve/tests/unit/analytics.emit.test.ts`).
- **React Query**: Profile + wizard use `useQueryClient` for optimistic updates. For idempotency keys, follow `useCreateReservation` pattern with `useRef`.
- **Accessibility**: Alerts use shadcn `Alert`; forms rely on `FormField` + `FormMessage`. Keep 44px touch targets, `aria-live="polite"`.
- **Testing Utilities**: Use `QueryClientProvider` wrappers (see profile tests). For wizard tests, `wizardStateFixture` from `tests/fixtures/wizard`. For Playwright, leverage `tests/fixtures/auth` for authenticated contexts.

## 5. Potential Pitfalls & Mitigations

- **Idempotency Implementation Complexity**: Introducing new Supabase column requires migration + TypeScript update (`types/supabase.ts`). Mitigation: design small migration + update server handler simultaneously; add Vitest to confirm dedupe when reusing same header.
- **Offline Banner Falsing**: Need to ensure SSR mismatches don’t cause hydration warnings (wrap in `useOnlineStatus` which starts `true`). Provide `aria-live` to avoid repeated announcements.
- **Sign-in Form SSR**: Page is client component; ensure tokens not leaked, manage `credentials` fetch. Provide loading states to avoid double submit.
- **Testing Flakiness**: Offline Playwright tests require gating behind env flag; document in plan. Provide `context.setOffline(true)` wrappers with `finally` block to reset.
- **Analytics Union Growth**: Each new event requires TypeScript union update; ensure VSCode watchers update. Add Vitest to guard `track` string names.

## 6. Verification Summary

- Cross-checked profile form behaviour via client code + Vitest suite to validate assumptions.
- Compared wizard offline requirements with existing reservation detail component to ensure pattern parity; confirmed no offline analytics in wizard currently.
- Validated middleware coverage by reading `middleware.ts` and existing Playwright specs, confirming route guard baseline.
- Double-checked Supabase helpers to avoid duplicating work; ensures we reuse `getMiddlewareSupabaseClient`.
- Highlighted omissions (idempotency column, signin form semantics) for plan stage.

## 7. Final Reflection & Re-evaluation

After completing research, re-read requirements and re-validated each conclusion against source files to ensure no critical gap:

- Re-ran `rg` for `profile_upload_error` to confirm analytics coverage (guards assumption).
- Cross-referenced `supabase/migrations` for profile schema—no idempotency field, confirming gap.
- Revisited Playwright specs to ensure new UI must match existing selectors; noted need to update tests accordingly.

Remaining uncertainties will be surfaced in plan (e.g. whether to introduce DB migration vs. soft idempotency). No contradictions found after second pass.
