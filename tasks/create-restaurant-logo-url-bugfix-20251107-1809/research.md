# Research: Create Restaurant Logo URL Bugfix

## Requirements

- Functional:
  - Restore `pnpm run build` by ensuring `CreateRestaurantDialog` creates a `CreateRestaurantInput` object that satisfies the schema (i.e., includes `logoUrl`).
- Non-functional (a11y, perf, security, privacy, i18n):
  - Preserve current UX (no new fields or interactions).
  - Keep type safety aligned with the shared API schema.

## Existing Patterns & Reuse

- `components/ops/restaurants/CreateRestaurantDialog.tsx` builds the `CreateRestaurantInput` payload passed to `useCreateRestaurant`.
- `src/app/api/ops/restaurants/schema.ts` defines `CreateRestaurantInput`; the Zod schema now always emits a `logoUrl` key (nullable) due to the `.transform` chain.

## External Resources

- None required; all context is within the repository.

## Constraints & Risks

- The dialog currently has no UI for logo uploads, so we must default `logoUrl` in code.
- Any change should avoid diverging from the shared schema definition to prevent runtime mismatch in API routes and server handlers.

## Open Questions (owner, due)

- None identified; requirement is clear from the build failure.

## Recommended Direction (with rationale)

- Update `CreateRestaurantDialog` to include `logoUrl: null` when constructing `CreateRestaurantInput`. This satisfies the schema without altering UX and keeps the payload in sync with server expectations.
