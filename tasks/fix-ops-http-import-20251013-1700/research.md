# Research: Fix Ops Hooks HTTP Import

## Existing Patterns & Reuse

- `lib/http/fetchJson.ts` provides the `fetchJson` helper used across the app.
- Path aliases in `tsconfig.json` map `@/*` to the repo root (and `src`), so `@/lib/...` resolves into the top-level `lib` directory.
- Other areas appear to import the helper directly from `@/lib/http/fetchJson` rather than a `client` module.

## External Resources

- [Next.js Module Not Found docs](https://nextjs.org/docs/messages/module-not-found) – confirms the build failure cause.

## Constraints & Risks

- Only three Ops hooks import from `@/lib/http/client`; updating the path should not impact other modules.
- Need to ensure no other modules rely on a missing `client` re-export to avoid regressions.

## Open Questions (and answers if resolved)

- Q: Does a `lib/http/client.ts` file exist elsewhere in the repo or in history?
  A: Current tree only has `lib/http/errors.ts` and `lib/http/fetchJson.ts`; no `client.ts` present.

## Recommended Direction (with rationale)

- Update the Ops hooks to import `fetchJson` from `@/lib/http/fetchJson`, matching the existing helper location. This removes the broken alias and aligns with the rest of the codebase.
