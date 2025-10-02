# Implementation TODO

- [x] Update root `playwright.config.ts` to new multi-project config and point to `tests/e2e`.
- [x] Create Playwright scaffolding directories (`tests/e2e`, `tests/fixtures`, `tests/helpers`, etc.) and add placeholder README if needed.
- [x] Migrate existing `reserve/tests/e2e` specs into new structure with updated imports.
- [x] Add global setup/teardown + shared fixtures.
- [x] Add helper modules (selectors, a11y, visual, perf) with initial implementations.
- [x] Provide example specs for auth redirect, reservation wizard smoke, avatar upload stub, payments stub, file download stub, iframe stub, service worker offline stub, WebSocket stub, feature flag toggle.
- [x] Add Playwright component testing config scaffolding file.
- [x] Update `package.json` scripts for new Playwright commands.
- [x] Document new structure in `tests/README.md` (if exists) or create README stub.
