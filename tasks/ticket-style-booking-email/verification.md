# Verification

## Commands run

- `pnpm typecheck` _(fails: existing test fixtures under `reserve/` have type errors unrelated to these changes)_

## Manual checks

- Recommend hitting `POST /api/test-email` with the "booking confirmation" payload to preview the new ticket layout and ensure Resend renders as expected.
