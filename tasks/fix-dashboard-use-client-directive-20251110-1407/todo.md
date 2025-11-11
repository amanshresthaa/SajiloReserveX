# Implementation Checklist

## Setup

- [x] Capture build failure details and confirm file path causing error.

## Core Fix

- [x] Remove stray `"use client"` literal at bottom of `src/app/(ops)/ops/(app)/dashboard/page.tsx`.
- [x] Verify no other directives misplaced in the file.

## Supabase Types

- [x] Add `release_hold_and_emit` definition to `types/supabase.ts`.
- [x] Add `sync_confirmed_assignment_windows` definition to `types/supabase.ts`.
- [x] Ensure `server/capacity/holds.ts` compiles without type assertions.

## Abort Signal Plumbing

- [x] Extend `AssignmentSyncParams` with an optional `signal` and destructure it in `synchronizeAssignments`.
- [x] Pass `signal` through each `synchronizeAssignments` call that already has access to one.

## Verification

- [x] Run `pnpm lint` to satisfy lint-verification requirement.
- [x] Run `pnpm run build` to ensure Turbopack completes without error.

## Notes

- Assumptions: No other files require changes since the directive already exists at the top.
- Deviations: None; earlier build blockers resolved by updating Supabase RPC typings and abort-signal plumbing.
