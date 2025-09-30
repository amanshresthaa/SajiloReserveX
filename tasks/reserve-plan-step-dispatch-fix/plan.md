# Implementation Plan

1. **Align booking flow props with wizard steps**
   - In `components/reserve/booking-flow/index.tsx`, derive a memoized `actions` object from the local reducer `dispatch` that mirrors the subset of `WizardActions` required by the shared step components (`goToStep`, `updateDetails`, plus helpers already used internally).
   - Import `WizardActions` (type) from `@features/reservations/wizard/model/store` so the object satisfies the expected shape.

2. **Update step invocations**
   - Pass the new `actions` object to `PlanStep`, `DetailsStep`, and `ReviewStep` instead of the raw `dispatch`.
   - Provide the missing `onClose` handler when rendering `ConfirmationStep`.

3. **Implement Next.js-compatible close handler**
   - Add a `handleClose` callback that routes to the thank-you screen using Next.js `useRouter`, mirroring the UX in the reserve app.
   - Ensure the callback resets sticky actions if necessary and keeps existing state transitions intact.

4. **Verification**
   - Run `npm run build` to confirm the TypeScript error is resolved and the build succeeds.
   - Spot-check for additional type mismatches reported by the compiler.
