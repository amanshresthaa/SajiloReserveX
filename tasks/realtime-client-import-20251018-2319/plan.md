# Implementation Plan: Fix Build Failure From Missing Supabase Realtime Client

## Objective

We will enable the build pipeline to succeed by resolving the missing module import so that Next.js production builds complete without errors.

## Success Criteria

- [x] `pnpm run build` completes without module resolution errors.
- [ ] No regressions in areas importing the Supabase realtime client.

## Architecture & Components

- `lib/supabase/realtime-client.ts`: Houses the browser-only singleton factory for the Supabase realtime client. Relocate file here to align with alias expectations.
- `src/hooks/ops/useBookingRealtime.ts`: Continues to import `getRealtimeSupabaseClient` via `@/lib/supabase/realtime-client`; no code change expected once relocation is complete.

## Data Flow & API Contracts

Endpoint: _N/A_
Request: _N/A_
Response: _N/A_
Errors: _N/A_

## UI/UX States

- _N/A_

## Edge Cases

- Ensure the file retains `"use client"` only if required (current implementation does not include the directive, consistent with reuse).
- Verify tree-shaking or bundler configuration does not require an index barrel update; confirm by inspecting `lib/supabase/index` (none today).
- Confirm no lingering empty directory under `src/lib/supabase` causes confusion; remove directory if it becomes unused.

## Testing Strategy

- Run `pnpm run build` to ensure Next.js can resolve the alias and produce a production build.
- Optionally run targeted lint/type checks if available (e.g., `pnpm lint`) to reaffirm path alignment.

## Rollout

- No feature flags; change effective immediately after merge.
- Monitor CI build pipeline; no runtime migration needed.
