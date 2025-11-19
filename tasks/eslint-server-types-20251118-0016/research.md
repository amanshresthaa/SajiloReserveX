---
task: eslint-server-types
timestamp_utc: 2025-11-18T00:16:47Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Research: Fix ESLint type warnings in server modules

## Requirements

- Functional: resolve `@typescript-eslint/no-explicit-any` and `@typescript-eslint/no-unused-vars` warnings blocking pre-commit in `server/capacity/manual-session.ts` and `server/occasions/catalog.ts` while preserving runtime behavior.
- Non-functional: maintain existing API/behavior; keep strict typing aligned with Supabase and shared types; avoid introducing `any` or suppressing lint rules.

## Existing Patterns & Reuse

- `server/capacity` modules use the generated Supabase `Database` types and related helper types (`ManualAssignmentSession`, `ManualSessionSelection`).
- Supabase clients elsewhere are typed with `SupabaseClient<Database, "public">` rather than `any` generics.
- Error handling uses custom errors (`SessionConflictError`, `ManualSessionDisabledError`); type guards for Supabase errors are already present.

## External Resources

- ESLint rules `@typescript-eslint/no-explicit-any` and `@typescript-eslint/no-unused-vars` guide strongly typed signatures; no external docs required beyond existing type definitions in repo.

## Constraints & Risks

- Must not change business logic for manual assignment sessions or occasions catalog.
- Avoid loosening typing through `as any` where possible; prefer existing shared types.
- Supabase interaction types should align with `Database` definitions to prevent runtime shape mismatches.

## Open Questions (owner, due)

- None identified; scope limited to typing corrections.

## Recommended Direction (with rationale)

- Replace `SupabaseClient<any, "public">` with `SupabaseClient<Database, "public">` and introduce explicit row/patch types derived from `Database` for manual sessions to avoid `any` patches.
- Define narrow helper types for hold rows and version contexts instead of using `any` indexing.
- Remove unused variables (e.g., `updated`) cleanly.
