# Implementation Plan: Fix build error - Supabase import

## Objective

Ensure the project builds successfully by correcting the Supabase client import in `scripts/debug-single-assignment.ts`.

## Success Criteria

- [ ] `npm run build` completes without TypeScript errors.
- [ ] No changes outside the failing script unless required.

## Architecture & Components

- Script: `scripts/debug-single-assignment.ts` uses server-side Supabase client helper.

## Data Flow & API Contracts

- Use `getServiceSupabaseClient()` exported from `@/server/supabase` to obtain a server-side client.

## UI/UX States

- N/A

## Edge Cases

- If the script relied on a different auth context, ensure `getServiceSupabaseClient` is suitable for server context.

## Testing Strategy

- Build verification via `npm run build`.

## Rollout

- Direct commit; no flags needed.
