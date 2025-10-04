# Verification

Date: 2025-10-04

## Checks

- Created versioned wrappers under `app/api/v1/**` that re-export existing handlers.
- Added middleware deprecation headers for unversioned `/api/*` routes (with `Sunset` window).
- Added shared utilities: `lib/api/list-params.ts`, `lib/api/errors.ts`.
- Added docs: `docs/routes.md` and `openapi.yaml` initial spec.
- Added unit test to validate v1 alias: `reserve/tests/unit/api-v1-alias.test.ts`.

## Test Run

- Ran `pnpm test` (Vitest). All tests passed:
  - 29 test files, 88 tests, 0 failures.
  - New test confirmed `GET` and `POST` on `/api/v1/events` behave as expected.

## Notes / Next Steps

- As we incrementally refactor, adopt `lib/api/list-params.ts` and `lib/api/errors.ts` in more handlers to standardize behavior.
- Consider exposing Swagger UI in non-prod (e.g., `/api/docs`) using the `openapi.yaml`.
