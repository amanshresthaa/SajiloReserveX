# Execution Checklist

- [x] Update Vitest specs for `ProfileManageForm` to assert new duplicate copy, aria-live behavior, and focus handling.
- [x] Extend Playwright profile tests to validate avatar error aria-live + keyboard focus/idempotent messaging.
- [x] Implement `ProfileManageForm` helper + duplicate message formatter and aria-live tweaks.
- [x] Run `pnpm vitest reserve/tests/profile/ProfileManageForm.test.tsx` (and related) until green.
- [x] Run `pnpm playwright test tests/e2e/profile/avatar-upload.spec.ts` (fails to bootstrap auth without dev server; documented).
