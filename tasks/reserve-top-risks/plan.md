# Plan – reserve top risks

## Goal

Eliminate the three high-risk architecture issues in the reserve SPA: cross-app runtime coupling, environment drift between bundlers, and the monolithic reservation wizard state. The fixes must keep the wizard feature working end-to-end, avoid breaking the Next.js app, and add safety nets where they were missing.

## Steps

1. **Design shared runtime helpers for the SPA**
   - Introduce a single runtime utility that exposes `isDev`/`isTest` and retrieves env vars from `import.meta.env`, falling back to `process.env` if present.
   - Based on this helper, re-implement analytics + venue defaults within `reserve/shared` instead of importing from the Next.js app.
   - Update wizard imports (and other SPA references) to consume the new helpers; remove direct `process.env` usage in SPA code.

2. **Rebuild the SPA env loader with strict validation**
   - Update `reserve/shared/config/env.ts` to read from the new runtime helper, keep the Zod schema, and throw explicit errors when required values are missing.
   - Define Vite env typings (e.g. `reserve/vite-env.d.ts`) and document expected keys.
   - Adjust tests or configs that rely on env defaults to ensure they still pass.

3. **Modularize the wizard state management**
   - Extract the domain reducer + state builders into `model/store.ts` with clear domain vs UI slices; provide typed selectors and command helpers.
   - Break out local-storage hydration/persistence and draft-building into dedicated hooks/utilities under `features/reservations/wizard`.
   - Refactor `useReservationWizard` to orchestrate through the new store helpers, slimming it down and removing incidental responsibilities.
   - Add focused unit tests for the new store/actions to prevent regressions.

4. **Verification + cleanup**
   - Run unit tests (Vitest) for the reserve app.
   - Double-check imports to confirm no lingering `@/lib/*` references inside the SPA source.
   - Document the new runtime/env expectations where helpful.

## Open Questions / Risks

- Ensure the Next.js app keeps using the original analytics + venue helpers; decoupling must not break its build.
- Confirm environment defaults do not hide errors in production (consider logging guidance or failing fast).
- Validate that refactored wizard logic still drives the UI steps correctly (may require manual spot checks once tests pass).
