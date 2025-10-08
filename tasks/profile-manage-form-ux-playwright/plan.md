# Implementation Plan — Profile Manage UX & Tests

## Objective

Close the remaining US-005 items by improving `ProfileManageForm` duplicate messaging + live-region behavior, and expanding automated coverage (Vitest + Playwright) to reflect the refined UX and keyboard/touch accessibility expectations.

## Approach Overview

1. **Adopt TDD**: change existing tests (Vitest + Playwright) to encode the desired UX before touching production code; run suites to confirm failures; then iterate until they pass.
2. **Mobile-first mindset**: keep adjustments resilient on narrow viewports (text wrapping, button sizing) and validate keyboard-only workflows per accessibility rubric.
3. **Reuse existing patterns**: emulate status helpers from `SignInForm` and reuse `profileSelectors` for Playwright assertions to stay idiomatic.

## Detailed Steps

### 1. Finalize duplicate messaging semantics

- **Desired behavior**: when the API reports `idempotent: true`, surface an informational status that explicitly states the affected fields and reassures the user nothing changed. Include a friendly refresh prompt only when server signals a conflicting older payload (`HttpError` with `code === 'IDEMPOTENCY_KEY_CONFLICT'`)—already implemented.
- **Message construction**: reuse the form draft keys (`name`, `phone`, `image`) and map them to human-readable labels (`display name`, `phone number`, `avatar`). Format as natural language (`“We already saved your display name — everything is up to date.”`, pluralized with Oxford comma). Use an en dash or em dash per style guide while ensuring accessibility.
- **Aria-live policy**: info/success → `polite`; warning/error → `assertive`. Duplicates remain informative (`polite`), conflict stays warning (`assertive`). Centralize this logic via helper (e.g., `announceStatus(tone, message, opts?)`) to avoid inconsistencies.
- **Focus management**: maintain focus shift to the status paragraph via `statusRef`, ensuring keyboard users hear the announcement.

### 2. Update Vitest coverage (fail-first)

- **Duplicate test**: adjust `reserve/tests/profile/ProfileManageForm.test.tsx` to expect the new copy and verify `aria-live="polite"` for the duplicate info message. Also assert focus moves to the status element after submission.
- **Idempotency conflict test**: extend existing warning test to confirm `aria-live="assertive"` (guards helper logic). Optionally assert focus as well to ensure helper is used.
- **Avatar validation test**: update the analytics spec to also assert the inline error exposes `aria-live="assertive"` (per TODO). Validate that the element is focusable or accessible.

### 3. Implement form updates

- **Helper extraction**: create `announceStatus` (or similar) inside `ProfileManageForm` to compute `aria-live` from tone, merge optional overrides, and focus the live region.
- **Duplicate copy**: build a formatter converting draft keys into friendly labels (w/ Oxford comma + “and”) and compose the final string. Ensure message uses ellipsis where spec requires (none needed) and stays under ~120 chars for readability.
- **Avatar alert**: set `aria-live="assertive"` explicitly on the `<p role="alert">` element and ensure visually the message remains accessible. Optionally assign `id` to allow focus referencing if we decide to move focus (not currently necessary).
- **Status markup**: confirm the `<p>` retains `role="status"`, `aria-atomic="true"`, and new `aria-live` logic; keep existing touch target classes.
- **Type safety**: update `StatusState` type if helper consolidates `live` inference (may relax to optional override).

### 4. Expand Playwright coverage (fail-first)

- **Avatar failure scenario**: enhance `tests/e2e/profile/avatar-upload.spec.ts` to assert the inline error carries `role="alert"` and `aria-live="assertive"`, and that toast still appears (if expected). Possibly check analytics network? (Optional—likely handled by unit tests.)
- **Keyboard flow**: extend the keyboard-only test to ensure focus lands on the status region after pressing Enter, and confirm status text matches duplicate copy on subsequent submission (i.e., second Enter triggers idempotent response). Might need to stub `/api/profile` to return `idempotent: true` on second submission.
- **Helper usage**: consider augmenting `profileSelectors` with dedicated locators (e.g., `statusRegion`, `statusMessage`) to make assertions cleaner.

### 5. Verification + hardening

- **Unit tests**: run targeted Vitest suites for profile form/hooks. MUST ensure new assertions pass (`pnpm vitest reserve/tests/profile/ProfileManageForm.test.tsx` etc.).
- **E2E**: run `pnpm playwright test tests/e2e/profile/avatar-upload.spec.ts`. On failure, iterate until green.
- **Manual sanity**: optionally run app locally (if feasible) to quickly smoke-check mobile viewport (narrow devtools) ensuring text wraps gracefully and focus outline remains visible.

## Alternatives Considered / Risks

- **Alternative message**: could keep generic “Already up to date” copy. Rejected because TODO explicitly calls out duplicate messaging improvements.
- **`aria-live` per-status override**: leaving existing `setStatus` calls with manual `live` values risks future inconsistencies; helper approach reduces drift.
- **Playwright duplication**: adding a new spec vs. extending existing ones. Opting to extend to reduce runtime while still covering new assertions. Risk: tests may become brittle if copy changes often—mitigate by centralizing selectors and using regex for variable fragments (e.g., dynamic field list).

## Outstanding Questions for Later

- Should we surface which fields triggered idempotency using analytics payload? (Out of scope for now—UI will infer from draft keys.)
- Do we need toast copy changes to match inline message? Currently toasts come from hook (`Profile updated` vs. `Profile already up to date`). We will leave as is unless QA flags mismatch.
