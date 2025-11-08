# Implementation Plan: Limit party size edits to 12

## Objective

Ensure the dashboard edit dialog and backing API enforce the existing product limit of 12 guests per booking so larger parties cannot be saved through `/my-bookings`.

## Success Criteria

- [ ] Client-side validation blocks `partySize > 12` with the expected copy.
- [ ] Dashboard PATCH endpoint rejects payloads above 12.
- [ ] Existing reservation wizard continues to honor the same constant (magic numbers removed).
- [ ] Updated unit tests cover the new constraint.

## Architecture & Components

- `lib/bookings/partySize.ts`: new module exporting `MIN_ONLINE_PARTY_SIZE`, `MAX_ONLINE_PARTY_SIZE`, and shared `ONLINE_PARTY_SIZE_LIMIT_COPY`.
- `components/dashboard/EditBookingDialog.tsx`: import constants, update schema + input props.
- `src/app/api/bookings/[id]/route.ts`: import constants for `dashboardUpdateSchema`.
- `reserve/features/reservations/wizard/model/schemas.ts` & `reserve/features/reservations/wizard/hooks/usePlanStepForm.ts`: swap literal `12` for the shared constant.
- Tests: `reserve/tests/unit/EditBookingDialog.test.tsx` gains coverage for the validation path.

## Data Flow & API Contracts

- Dashboard edit mutation already posts `partySize`. Validation now clamps to `<=12` on both client and server. No schema shape changes, just stricter constraints.

## UI/UX States

- Error state: when entering >12, the inline helper text under the input should show `We can accommodate up to 12 guests online.` and prevent submit.

## Edge Cases

- Non-numeric input already handled by `z.coerce.number()`.
- Users pasting blank string: existing min validation remains.
- Server receives >12 via API tools: returns validation error via `INVALID_INPUT` (handled upstream).

## Testing Strategy

- Unit: extend `reserve/tests/unit/EditBookingDialog.test.tsx` to assert error UI and prevent submission when >12.
- Lint: run `pnpm lint` as required.
- Manual QA: after implementation, use Chrome DevTools MCP against `/my-bookings` flow to confirm UI behavior (per instructions).

## Rollout

- No feature flags needed; this is an enforcement fix.
- Deploy with existing release cadence.
