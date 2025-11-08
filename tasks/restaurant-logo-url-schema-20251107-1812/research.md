# Research: Restaurant logoUrl schema regression

## Requirements

- Functional:
  - Restore `pnpm run build` by ensuring TypeScript no longer requires `logoUrl` on every `CreateRestaurantInput`/`UpdateRestaurantInput` payload when the UI is not providing that field.
  - Preserve the existing runtime validation that any provided logo URL is trimmed and must be an absolute URL.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Maintain backwards compatibility for API consumers (Ops + Owner apps) without forcing UI updates.
  - Keep schema-level sanitation so no unsafe/blank URLs are persisted.

## Existing Patterns & Reuse

- `src/app/api/ops/restaurants/schema.ts` defines both create/update Zod schemas; other layers import the inferred types for strict typing.
- `components/ops/restaurants/CreateRestaurantDialog.tsx` and `RestaurantDetailsForm.tsx` construct the payloads; earlier task already patched the create dialog to send `logoUrl: null` manually.
- `src/services/ops/restaurants.ts` and hooks such as `useOpsRestaurantDetails` expect `logoUrl` to be optional/null, matching the server implementations in `server/restaurants/{create,update}.ts`.

## External Resources

- [Zod `preprocess` docs](https://zod.dev/?id=preprocess) – demonstrates how to sanitize optional fields while preserving optional typing.

## Constraints & Risks

- The `.transform()` call inside the schema currently strips the optional flag, so TypeScript thinks the field is required—leading to compile failures wherever the UI does not include the property.
- Adjusting the schema must keep whitespace trimming and allow `null`/`undefined`/empty strings to coerce to `null` to avoid persisting invalid URLs.
- Need to ensure owner API schemas (if any) stay in sync if they rely on a shared helper.

## Open Questions (owner, due)

- None – regression scope is clear from the build errors.

## Recommended Direction (with rationale)

- Introduce a reusable `optionalLogoUrlSchema` helper built with `z.preprocess` that trims strings, validates URLs when provided, and keeps the property optional (`string | null | undefined`).
- Reuse the helper for both `createRestaurantSchema` and `updateRestaurantSchema` so their inferred types align with the server-side expectations without forcing UI payload changes.
- After schema fix, rerun `pnpm run build`/`pnpm run lint` to verify type safety and linting.
