# Research Notes — Profile manage UX + Playwright

## Existing UX + accessibility patterns

- `components/profile/ProfileManageForm.tsx:249-357` already maintains a `status` object with `{message, tone, live}`; duplicates currently map to info tone + `aria-live="polite"` even when server warns (`IDEMPOTENCY_KEY_CONFLICT` toggles to `live: 'assertive'`). Focus is moved to the status paragraph via `statusRef` (`focusStatus()` line 231) to announce the message.
- Avatar validation shows inline `<p role="alert">` without explicit `aria-live`; the label container uses `role="alert"` so SRs announce immediately, but message color/status tone is hard-coded to red (`components/profile/ProfileManageForm.tsx:398-424`). No analytics copy surfaced for duplicate events.
- `components/auth/SignInForm.tsx:205-247` exposes a very similar status pattern: `role="status"`, `aria-live` toggled between polite/assertive based on severity, and `statusRef` focus. This form also applies `touch-manipulation` classes to keep 44px tap targets—a reuse candidate.
- Several components lean on `aria-live="assertive"` for warnings (e.g., `ReservationDetailClient.tsx:212-236`) and fall back to `polite` for informational statuses. Messaging distinguishes duplicates vs. success.

## Testing + tooling landscape

- Vitest suite at `reserve/tests/profile/ProfileManageForm.test.tsx` covers duplicate submissions (expects "your profile is up to date" copy) and avatar validation analytics via `role="alert"`. No assertions for `aria-live` or focus of status region; duplicate copy may need to align with analytics semantics.
- Hook-level coverage (`reserve/tests/profile/useUpdateProfile.test.tsx`) already verifies duplicate analytics `track/emit` and idempotency header usage.
- Playwright coverage for profile lives in `tests/e2e/profile/avatar-upload.spec.ts`. It already mocks `/api/profile/image` failures, checks inline error copy, and ensures keyboard-only submission via `press('Enter')`. However, it doesn’t yet observe aria-live/focus behavior, duplicate server responses, or toast content variations after duplicates.
- `tests/helpers/selectors.ts` defines reusable helpers (`profileSelectors.statusToast`) for status detection; new tests should likely extend these helpers rather than bespoke selectors.

## Pending UX gaps inferred from TODO

- Duplicate messaging currently says "No changes detected — your profile is up to date." but analytics track duplicates separately; product brief suggests a clearer explanation (e.g., prompt to refresh when server short-circuits) and potentially surfacing the duplicate fields.
- `aria-live` strategy may need to escalate duplicates/info states depending on severity (info vs warning). The TODO calls out "duplicate messaging, aria-live tweaks" implying we should ensure polite/ assertive toggles align with severity and coverage verifies this contract.
- Playwright TODO mentions "avatar failure, keyboard flow" despite existing tests—likely expecting richer assertions (focus management, toast fallback, `aria-live` announcements, idempotent duplicates) or brand-new scenarios (e.g. verifying spinner, toast, keyboard only from focus order perspective). Need to confirm with plan.

## Constraints & guardrails to honor

- Accessibility rubric mandates visible focus (`:focus-visible`). Status paragraph already has ring classes but we should double-check focus order on duplicates, avatar errors, and keyboard submit flows.
- Mobile-first guidance: ensure messaging wraps gracefully and hit targets remain ≥44px. Any new UI (e.g., status banner) must maintain responsive classes.
- Analytics instrumentation already exists; UI must align messaging with tracked events (`profile_update_duplicate`).

## Open questions / assumptions for planning

- Determine if duplicate copy should include fields or next steps (refresh?). Need to align with analytics expectation; possible new text should still be friendly and accessible.
- Decide whether to adjust `aria-live` for `status` to `assertive` when status tone is `warning`/`error` and keep `polite` for `info`/`success`. Currently duplicates (info) might need to stay `polite` but TODO implies a change—perhaps to ensure duplicates don't feel like silent successes.
- Clarify Playwright coverage expectations: do we add new spec verifying focus returns to status, or extend selectors to check `aria-live` attribute changes? Will mimic existing tests and ensure fail-first (TDD) before implementation.
