# Implementation Plan — Profile, Wizard Offline, Auth

_Date_: 2025-01-14  
_Scope_: US-005 (Profile Management), US-006 (Wizard QA & Offline), US-007 (Auth Flow & Guards)  
_Approach_: Mobile-first, TDD-first for each unit/integration, reuse shadcn primitives, ensure analytics emit/track parity.

## 1. Shared Foundations

- **Feature flag sweep**: confirm `NEXT_PUBLIC_RESERVE_V2 === 'true'` in dev/stage; toggle offline Playwright suite behind env to avoid CI surprises.
- **Idempotency strategy**: introduce `profile_update_requests` table (Supabase) keyed by `(profile_id, idempotency_key)` storing `payload_hash`, `applied_at`. Server returns cached profile for duplicate keys; otherwise proceeds update and records entry in transaction. Rationale: avoids altering `profiles` schema; easy unique constraint; similar to bookings API.
  - Migration steps: create table, unique constraint, trigger to prune old rows (optional). Update `types/supabase.ts`.
  - Server route: read `Idempotency-Key` header; if absent, generate server-side UUID (maintain behaviour). Hash payload to compare (prevent replay with different data).
- **Analytics additions**: extend `AnalyticsEvent` union with:
  - `profile_update_duplicate` (idempotent replay)
  - `wizard_offline_detected`
  - `wizard_submit_failed`
  - `auth_signin_attempt`, `auth_signin_error`, `auth_magiclink_sent`
  - Add Vitest coverage for new emit logic where appropriate.
- **Testing harness**: extend shared test utils for Supabase mocking (for signin) and `useOnlineStatus` overrides (Vitest). Update Playwright fixtures if new selectors introduced.

## 2. US-005 — Profile Management Enhancements

### 2.1 API & Data Layer

1. **Migration**: add SQL file creating `profile_update_requests (id uuid pk default gen_random_uuid(), profile_id uuid references profiles(id), idempotency_key text, payload_hash text, applied_at timestamptz default now())`. Unique index on `(profile_id, idempotency_key)`.
   - Update `supabase/types` via codegen or manual mapping.
2. **Route handler** (`app/api/profile/route.ts`):
   - Parse `Idempotency-Key`; if missing, generate `crypto.randomUUID()` (return header).
   - Normalize payload (sorted JSON) and compute SHA-256 hash (use native crypto).
   - Transaction: check table for existing `(profile_id, key)`. If found:
     - If stored hash matches current payload -> re-fetch profile & short-circuit with 200 + `Idempotency-Key` header; emit `track('profile_update_duplicate', ...)`.
     - If mismatch -> return 409 `IDEMPOTENCY_KEY_CONFLICT`.
   - On fresh request: perform update, insert row with hash & `profile_id`. Include response header `Idempotency-Key`.
   - Wrap Supabase calls with try/catch; reuse `ensureProfileRow`.
3. **Client hook** (`useUpdateProfile`):
   - Maintain `idempotencyKeyRef` (mirroring wizard create mutation).
   - Pass header on `fetchJson` call; forward response header (if present) for analytics? (Optional: record in toast).
   - On error 409, surface friendly status + focus first field.

### 2.2 UI & UX

1. **`ProfileManageForm`**:
   - Ensure status message differentiates duplicate update (e.g. “No changes detected — up to date.”).
   - Add spinner overlay on submit (loading variant already there).
   - Confirm avatar error `aria-live` and toast interplay meets spec; adjust to show inline `aria-live="assertive"` plus toast as fallback.
2. **Keyboard flow**:
   - Guarantee Tab order: `Choose image` (hidden input focusable?), manual `tabIndex`? Evaluate to ensure accessible; add `visually-hidden` input `id`.
   - Provide `touch-action: manipulation` on buttons (global? maybe `components/ui/button` already handles—verify and document).

### 2.3 Analytics

- On `useUpdateProfile` success: already tracking; extend payload with `idempotencyKey` truthiness.
- On duplicate detection: `track('profile_update_duplicate', { reason: 'server_short_circuit' })`.
- On avatar validation failure: ensure `track` includes `idempotencyKey`? N/A.

### 2.4 Tests

- **Vitest**:
  - `hooks/useProfile.test.ts`: verify header injection + analytics call when server responds 409; stub `fetchJson`.
  - `ProfileManageForm` tests: add new spec asserting duplicate message + `aria-live` for avatar error; ensure analytics spies invoked.
  - Migration-level test? (Optional) Add `supabase/profile-idempotency.test.ts` using `vitest` + `@supabase/supabase-js` mock to confirm conflict logic (unit).
- **Playwright**:
  - Extend `tests/e2e/profile/avatar-upload` with failure scenario (use `route.fulfill` 500). Validate toast + inline error.
  - New test `profile.keyboard-flow.spec.ts`: start at `/profile/manage`, Tab through fields, use keyboard to submit, ensure focus returns to status.

## 3. US-006 — Wizard QA & Offline

### 3.1 Offline Banner & Analytics

1. Create shared component `reserve/features/reservations/wizard/ui/WizardOfflineBanner.tsx`:
   - Uses `Alert` with `aria-live="polite"`, `role="status"`, message referencing disabled actions.
   - Accepts props `wasOnlineMs` for analytics message.
2. Integrate into `BookingWizard` (or `WizardLayout`):
   - Call `useOnlineStatus` at top-level; maintain `lastOnlineAtRef`, `offlineTrackedRef` similar to reservation detail.
   - On offline transition: `track('wizard_offline_detected', { path, step, wasOnlineMs })`; `emit` equivalent.
   - Pass offline state via context to steps to disable network-dependent buttons (e.g. confirm, share).
3. Ensure actions (confirm button etc.) respect offline: e.g. disable `ReviewStep` confirm CTA, show tooltip `Reconnect to confirm`.

### 3.2 Skeleton & Optimistic States

1. Audit Plan/Details steps for loading toggles; create skeleton components mirroring layout (cards, forms).
   - Introduce `WizardSkeleton` used during Suspense fallback and while React Query loading states triggered (if editing existing booking).
2. Ensure `useReservationWizard` sets `state.submitting` promptly (already). Add cancellation logic to revert sticky actions when mutation fails.

### 3.3 Failure Analytics & Error UX

- Extend `useCreateReservation`:
  - In `onError`, call `emit('wizard_submit_failed', { code, status, idempotencyKey })` + `track`.
  - Reset `idempotencyKeyRef` on error to allow retry with new key (matching w/ bookings).
- `useReservationWizard` error path: surface message in `aria-live="polite"` alert at top; focus trap to alert; include “Retry” CTA.

### 3.4 Tests

- **Vitest**:
  - New `wizard/offline.analytics.test.tsx`: mock `useOnlineStatus`, assert `track/emit` triggered only once per offline session.
  - `useCreateReservation` test verifying idempotency key reuse + error instrumentation.
  - Component test ensuring offline banner renders and confirm button disabled.
- **Playwright**:
  - Enhance `tests/e2e/service-worker/offline.spec.ts`: after offline, assert banner text, confirm button disabled, analytics request? (If capturing network?). Ensure offline toggled back in `finally`.
  - Add new scenario for mutation failure (mock `/bookings` returning 500) verifying toast and analytics (maybe inspect `/api/events` stub).

### 3.5 Accessibility/UX Checks

- Confirm offline banner focus: use effect to focus hidden region when offline toggles (without causing scroll).
- Add `scroll-margin-top` to wizard step headings for anchor nav.

## 4. US-007 — Auth Flow & Guards

### 4.1 Route Protection Review

- Middleware already guards `/dashboard` + `/profile`; ensure wizard post-confirmation route (e.g. `/thank-you`) added to matcher if required.
  - Add test hitting `/reserve/thank-you` (if route exists) to ensure redirect.
- Confirm server components (e.g. `app/(authed)/dashboard/page.tsx`) also check `getServerComponentSupabaseClient`. Add fallback to redirect with `redirectedFrom`.

### 4.2 Sign-in UI Rebuild

1. Create `components/auth/SignInForm.tsx` using:
   - RHF + Zod schema for email/password (password min 8, trimmed) + optional `redirectedFrom`.
   - Tabs or segmented control for `Password` vs `Magic link`.
   - Buttons: use `@/components/ui/button`, maintain 44px min height, `aria-live` region for status.
   - Spinner: `Loader2` icon, keep label text.
2. Page restructure `app/signin/page.tsx`:
   - Compose layout with `Metadata` update (set `<title>`).
   - Provide `Skip to content` anchor (if not global).
   - Call `track('auth_signin_viewed')` on mount (extend analytics union).
3. Submit handlers:
   - On password submit: call `signInWithPassword`; handle Supabase errors (e.g. `AuthApiError` for invalid credentials) -> inline message + toast.
   - On magic link: send OTP, show success message, disable button until countdown ends.
   - Manage `redirectedFrom` (prefill hidden input, on success `router.replace`).
   - Ensure focus returns to error message on failure.
4. Add `touch-action: manipulation`, `-webkit-tap-highlight-color` adjustments at root (maybe via CSS in layout).

### 4.3 Analytics & Telemetry

- On submit attempt (both modes): `track('auth_signin_attempt', { method, redirectedFrom })`.
- On success: `emit('auth_signin_success', { method })`.
- On error: `track('auth_signin_error', { method, code })`.
- Magic link success: `track('auth_magiclink_sent')`.

### 4.4 Tests

- **Vitest**:
  - Unit test for `SignInForm` verifying validation, analytics calls, focus on errors. Mock Supabase client via vi spy.
  - Hook test ensuring `useSignInForm` (if extracted) handles redirect param.
- **Playwright**:
  - Update `tests/e2e/profile/auth-session.spec.ts` to match new UI (selectors). Provide environment to skip? Document requirement for credentials.
  - Add keyboard navigation spec verifying Tab order, Enter submit, inline errors visible.

### 4.5 Docs & Cleanup

- Update `tasks/sprint-1-foundation-execution/todo.md` checkboxes once done.
- Document new env var requirements if analytics events rely on toggles.

## 5. Rollout & Validation

- **Order of execution**: (1) Implement profile idempotency (migration + API + hook + tests), (2) Wizard offline & analytics, (3) Sign-in rebuild + middleware adjustments, (4) Update Playwright suites. Keep commits per US for clarity.
- **Verification**:
  - Run `pnpm lint`, `pnpm test -- --runInBand`, `pnpm test:e2e --project=mobile` (with necessary env).
  - Manually smoke: update profile, trigger duplicate request, toggle offline (DevTools), attempt wizard confirm offline, sign in/out flows.
- **Risks**: migrations altering Supabase require coordination; ensure rollback script or guard for prod. Provide guard rails (feature flag) for offline analytics if noise risk.

## 6. Pending Clarifications

- Confirm expectation for idempotency conflict response text (should we show modal?).
- Should wizard offline state block creation entirely or just warn? (Default to disable primary action, mention in banner).
- Are there existing analytics dashboards expecting specific naming? If not, adopt proposed event names and document in analytics spec.
