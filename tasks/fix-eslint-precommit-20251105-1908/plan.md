# Implementation Plan: Fix pre-commit ESLint errors

## Objective

Ensure `eslint --fix --max-warnings=0` passes by removing unnecessary escape characters and unused symbols in email templates.

## Success Criteria

- [ ] No ESLint errors or warnings in the pre-commit hook.

## Steps

- Update `escapeHtml` regex in `server/emails/base.ts` to avoid unnecessary escapes.
- Clean template literals in `server/emails/bookings.ts` where `\"` is used; switch to `"` or `"` → `"` as plain quotes as appropriate.
- Remove unused import `DEFAULT_VENUE`.
- Neutralize the `renderHtml` unused warning by exporting the function.

## Rollout

- Local verification: run ESLint via the pre-commit task or direct command.
