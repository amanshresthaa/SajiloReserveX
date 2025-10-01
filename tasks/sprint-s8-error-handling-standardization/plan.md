# Sprint S8 — Error Handling Standardization: Plan

## Goal

Introduce a reusable error reporter + error-to-message helper, then consume them in the reservation wizard flow and reservation detail page to replace ad-hoc `console.*` logging.

## Steps

1. **Create shared error utilities**
   - Define `ErrorReporter` interface (`capture(error, context?)`) and default implementation logging via `console.error`.
   - Implement `mapErrorToMessage(error, fallback)` that converts unknown errors into safe strings.
   - Export from a shared module (e.g., `@reserve/shared/error`).

2. **Extend wizard DI**
   - Update `WizardDependencies` to include `errorReporter` with default reporter.
   - Adjust `WizardDependenciesProvider` to merge overrides for the new dependency.
   - Update `ReservationWizard` provider wiring if any custom overrides needed.

3. **Adopt reporter in wizard hooks**
   - `useReservationWizard`:
     - Use `mapErrorToMessage` for mutation failure message.
     - Route failure reporting through injected `errorReporter.capture` (including `buildReservationDraft` failures and mutation catches).
   - Evaluate other hooks (`useRememberedContacts`, `useConfirmationStep`) for inclusion—replace console usage with reporter (still using default dependency if DI not available).

4. **Standardize server route error handling**
   - Import shared reporter + mapping in `app/reserve/[reservationId]/page.tsx`.
   - Replace `console.error` with reporter captures, ensure consistent context info (e.g., `reservationId`).

5. **Cleanup & verification**
   - Remove obsolete `console.log` dev logs or guard them behind reporter (consider keeping under dev flag via reporter).
   - Update / add tests covering `mapErrorToMessage` and reporter injection (unit tests, adjust existing wizard tests if messages changed).
   - Run `pnpm test` and `pnpm lint`.

## Notes

- Maintain existing user-facing error strings unless the mapping helper dictates otherwise.
- Ensure reporter usage is SSR-safe (default reporter works both server/client).
- Leave TODOs for future expansion (e.g., hooking reporter into analytics) only if necessary.
