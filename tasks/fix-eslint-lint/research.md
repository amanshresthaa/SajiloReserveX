- Latest lint regression (test import order) resolved by moving the `react` import before `vitest` in `reserve/tests/profile/ProfileManageForm.test.tsx`.

# Research

## Build failure summary

- All lint-related build failures remain resolved.
- Hydration mismatch on `app/layout.tsx` stemmed from server rendering `<html lang="en-GB" style=...>` while the client rendered `<html lang="en" ...>` without that inline style (fixed by aligning config).
- Current blockers for `npm run build` (resolved):
  - Missing deps `@radix-ui/react-checkbox` and `@radix-ui/react-separator` installed via `pnpm`.
  - Removed duplicate `useFormField` export from `reserve/shared/ui/form.tsx`.
  - Normalized import ordering across wizard UI files and shared primitives; fixed lingering lint issues (`jsx-a11y/heading-has-content` in `card.tsx`, `no-empty-object-type` via type aliases).

## Existing patterns

- Root layouts in Next.js should keep locale attributes consistent between server and client to avoid hydration warnings.
- The app already formats dates/times via `en-GB`, so aligning the document language to the same locale improves accessibility.
- `nextjs-toploader` primes the `<html>` element with `transition-property: none` and `margin-right: 0px` on the server render; mirroring that style in the React tree keeps hydration stable.
- UI primitives live under `reserve/shared/ui/`; other Radix primitives (e.g., `@radix-ui/react-dialog`) are already dependencies. Expect to add missing Radix packages for checkbox and separator.
- `useFormField` helper likely appears both inside the component factory and as a named export—need to inspect file for duplicate declarations.

## Constraints

- Must eliminate the hydration warning without regressing theming or analytics setup.
- Maintain compliance with accessibility guidelines (language tag should reflect actual locale).
- Avoid introducing client-only conditionals in server components; prefer static values or pass required data via props.
