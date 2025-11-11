# Implementation Plan: Versioned Guest APIs

## Objective

Point all guest-facing clients and defaults to `/api/v1` endpoints so that we can deprecate legacy `/api` routes safely.

## Success Criteria

- [ ] Reserve env fallback emits `/api/v1` instead of `/api`.
- [ ] `lib/env` mirrors the same default.
- [ ] Guest runtime code (analytics emitter, profile hooks, restaurant fetcher, thank-you page) uses `/api/v1/*` paths.
- [ ] Related unit tests updated accordingly.
- [ ] `pnpm lint` passes.

## Steps

1. Update `reserve/shared/config/env.ts` fallback/base URL + dev warning message.
2. Update `lib/env.ts` reserve getter default.
3. Change guest modules to reference `/api/v1` equivalents.
4. Adjust reserve unit test(s) that assert the old path.
5. Run lint.
