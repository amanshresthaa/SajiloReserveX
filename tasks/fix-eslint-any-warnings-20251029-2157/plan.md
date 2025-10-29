# Implementation Plan: Fix ESLint `any` Warnings

## Objective

We will replace lingering `any` typings in capacity and feature-flag server modules so that the lint-staged `eslint --max-warnings=0` hook passes without warnings.

## Success Criteria

- [ ] `pnpm lint` (or the repo’s eslint task) runs clean with zero warnings.
- [ ] No behavioural changes in capacity hold creation/confirmation or feature flag overrides (covered by existing tests/telemetry).

## Architecture & Components

- `server/capacity/holds.ts`: tighten Supabase client alias, add typed helpers for `table_hold_members` joins and RPC assignment rows.
- `server/capacity/transaction.ts`: leverage `BookingRecord` typing with a runtime guard to eliminate `as any` usage.
- `server/feature-flags-overrides.ts`: align Supabase client typing with project standard.

## Data Flow & API Contracts

- Supabase RPC `assign_tables_atomic_v2` → validate returned row shape `{ table_id, start_at, end_at, merge_group_id }` before mapping to `ConfirmedAssignment`.
- Capacity booking RPC result → treat `booking` as `BookingRecord` when structure matches; otherwise omit while logging remains untouched.

## UI/UX States

- Not applicable (server-only change).

## Edge Cases

- RPC returning malformed rows should now be filtered instead of causing undefined property access.
- Booking payloads that are missing required identifiers will be treated as absent, avoiding false assumptions while keeping success responses intact.

## Testing Strategy

- Static analysis: `pnpm lint` (or targeted `pnpm eslint server/capacity server/feature-flags-overrides.ts`).
- Rely on existing unit/integration coverage for capacity flows (no new runtime logic added).

## Rollout

- No feature flags or rollout steps required; change is type-safety only.
