# Implementation Plan: Ops dashboard build failure

## Objective

Ensure the Ops dashboard page remains a valid client component by keeping the `"use client"` directive only at the top so that `pnpm run build` succeeds again.

## Success Criteria

- [ ] `next build` completes without the Turbopack directive error.
- [ ] `pnpm lint` (Next's lint script) passes, confirming no lint regressions.
- [ ] UI behavior unchanged (sidebar + breadcrumb render as before).
- [ ] Supabase RPC typings include `release_hold_and_emit` and `sync_confirmed_assignment_windows`, so the capacity modules compile without casting.

## Architecture & Components

- `src/app/(ops)/ops/(app)/dashboard/page.tsx`: remove the stray directive literal at the end of the file.
- `types/supabase.ts`: declare the `release_hold_and_emit` + `sync_confirmed_assignment_windows` RPCs (Args + Returns) to keep the new SQL functions typed.
- `server/capacity/table-assignment/assignment.ts`: treat the optional `AbortSignal` as part of `AssignmentSyncParams` and pass it through to the RPC helper so TypeScript stops flagging `signal` as undefined.

## Data Flow & API Contracts

- No data-layer changes.

## UI/UX States

- Unchanged; the fix is purely build tooling compliance.

## Edge Cases

- Ensure no additional whitespace / statements precede the directive.
- Confirm no other stray directives exist in related files (spot-check while editing).

## Testing Strategy

- Run `pnpm lint` (acts as lint verification per repo scripts).
- Run `pnpm run build` if time allows; primary requirement is lint per bug-fix instructions, but we plan to rerun build to validate success criteria.

## Rollout

- No feature flags; direct patch to page component.
