# Research: Fix build error - Supabase import

## Requirements

- Functional: Restore successful `next build` by resolving TypeScript error about missing export `createServerSupabaseClient` from `@/server/supabase`.
- Non‑functional: Follow repo AGENTS.md SDLC; minimal, targeted change; no secrets.

## Existing Patterns & Reuse

- `@/server/supabase` exports `getServiceSupabaseClient` (per TS error hint). Prefer existing exported helper.

## External Resources

- N/A (internal helper function replacement).

## Constraints & Risks

- Script `scripts/debug-single-assignment.ts` must compile; ensure runtime semantics remain equivalent using service client.
- Avoid changing shared server client API unless necessary.

## Open Questions (owner, due)

- Q: Is `scripts/debug-single-assignment.ts` intended only for local debugging?  
  A: Treat as part of build; keep compiling.

## Recommended Direction (with rationale)

- Replace `createServerSupabaseClient` import with the exported `getServiceSupabaseClient` and adjust usage in `scripts/debug-single-assignment.ts`. Search for other occurrences to prevent similar failures.
