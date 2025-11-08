# Implementation Plan: Restaurant logoUrl schema regression

## Objective

Unblock the Ops build by restoring the optional semantics of the `logoUrl` field so that clients can omit it unless explicitly set, while retaining strict URL validation when present.

## Success Criteria

- [ ] `pnpm run build` completes the TypeScript phase without `logoUrl` related errors.
- [ ] `pnpm run lint` passes, confirming schema updates comply with repo standards.

## Architecture & Components

- `src/app/api/ops/restaurants/schema.ts`: define a dedicated helper (e.g., `optionalLogoUrlSchema`) and apply it to both create/update schemas.
- Ensure any future consumers can reuse the helper for consistency (consider exporting if needed within the module scope).

## Data Flow & API Contracts

- The helper should return `string | null | undefined` so request payloads can omit the field, but when provided the API contract still enforces an absolute URL (trimmed input stored as string, empty => null).
- Downstream server modules (`server/restaurants/*`) continue to receive `logoUrl?: string | null`, matching their current expectations.

## UI/UX States

- No UI components are modified directly; form behavior remains unchanged.

## Edge Cases

- Empty strings or whitespace-only values should coerce to `null`.
- Invalid URLs must still trigger validation errors.
- Explicit `null` from clients should remain valid and stored as `null`.

## Testing Strategy

- Run `pnpm run lint` to cover TypeScript + ESLint rules on the modified files.
- Run `pnpm run build` to ensure the Next.js + TS compile passes.

## Rollout

- No feature flagging required; schema change is backward-compatible and deployable immediately.
