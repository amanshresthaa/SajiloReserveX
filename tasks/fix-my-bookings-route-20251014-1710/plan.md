# Implementation Plan: Fix my-bookings route import

## Objective

We will stop the Next.js type-checker from looking inside a non-existent `src/app` tree so the my-bookings route (and all other routes) are validated correctly and the production build succeeds.

## Success Criteria

- [ ] `pnpm run build` completes without `Cannot find module '../../src/app/.../page.js'` errors.
- [ ] Route validation continues to cover the existing `app/(...)` entries at the repository root.
- [ ] No regressions to aliases or imports that rely on the `/src` directory for non-app code.

## Architecture & Components

- `next.config.js`: opt out of the automatic `src` directory heuristic via `experimental.srcDir = false` while preserving current image domains and webpack aliases.
- Route modules under `app/(...)`: untouched; they should be discovered automatically once the config is corrected.
  State: N/A | Routing/URL state: `/my-bookings`

## Data Flow & API Contracts

Endpoint: N/A — the change is build-time configuration only.
Request: N/A
Response: N/A
Errors: Expect removal of the missing module error; no runtime API surface involved.

## UI/UX States

- Loading/Empty/Error/Success: unchanged; the goal is to ensure the page ships so these states can render as before.
- Manual QA: confirm `/my-bookings` still requires auth redirect behaviour after build.

## Edge Cases

- Ensure other tooling (tests, scripts) referencing `src/...` paths keep working after the config tweak.
- Watch for additional generated validator entries that might still point to `src`; adjust plan if the generator caches stale paths.
- Validate on case-sensitive filesystems (CI) even if macOS permits mixed casing locally.

## Testing Strategy

- Run `pnpm run build` locally to validate the type-checker and bundler succeed.
- If time allows, run an existing automated test covering `/my-bookings` (e.g., Vitest/Playwright) to sanity check routing.
- Document results and any follow-up QA needs in `verification.md`.

## Rollout

- No feature flag required.
- Merge via standard process once build passes.
- Monitor CI builds for similar errors on other branches; if discovered, recommend backporting the config fix.
