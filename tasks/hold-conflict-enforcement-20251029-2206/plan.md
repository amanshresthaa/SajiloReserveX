# Implementation Plan: Hold Conflict Enforcement

## Objective

We will unblock the production build by aligning the generated Supabase TypeScript definitions with the new RPC `set_hold_conflict_enforcement`, so the capacity holds module compiles cleanly.

## Success Criteria

- [ ] `pnpm run build` completes without TypeScript errors.
- [ ] No unintended changes outside the Supabase types file.

## Architecture & Components

- `types/supabase.ts`: extend `Database["public"]["Functions"]` with the new RPC signature so `client.rpc("set_hold_conflict_enforcement", ...)` passes type checking. Also add the `table_hold_windows` and `feature_flag_overrides` table definitions so corresponding queries compile. State & URL: not applicable.

## Data Flow & API Contracts

- RPC: `set_hold_conflict_enforcement`
  - Args: `{ enabled: boolean }`
  - Returns: `boolean`
  - Errors: surfaced via Supabase RPC error handling already implemented in `server/capacity/holds.ts`.

## UI/UX States

- Not applicable (build-time fix only).

## Edge Cases

- Ensure there are no typos in the function name or argument shape.
- Confirm no other RPC definitions from the migration are required in TypeScript to avoid future build breaks.

## Testing Strategy

- Unit: Not needed (types change only).
- Integration: Run `pnpm run build` to exercise the TypeScript compiler.
- E2E: Not applicable.
- Accessibility: Not applicable.

## Rollout

- Feature flag: N/A.
- Exposure: Immediate once merged; types file is consumed by the entire app.
- Monitoring: None required.
- Kill-switch: Revert commit if unexpected issues arise.
