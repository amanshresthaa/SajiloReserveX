# Implementation Plan: Migrations & Patch Registry

## Objective

Create a canonical reference that catalogues every Supabase migration and pnpm patch in chronological order with maintenance guidance.

## Success Criteria

- [x] Document lists all files in `supabase/migrations/` with timestamp, name, summary, and notes.
- [x] Document includes every entry in `patches/` with description.
- [x] File explains how to keep the registry up to date.
- [x] Existing SQL/patch files remain untouched.
- [x] Provide consolidated SQL entry point that replays baseline schema plus incremental migrations.

## Architecture

- Artifact: `docs/database/migrations-and-patches.md`.
- Structure: overview, migration timeline table, seed references, pnpm patch table, one-step provisioning instructions, maintenance checklist.
- Data sources: migration comment headers, `package.json` patched dependencies, existing seeds.

## Implementation Steps

1. Draft markdown skeleton with context and maintenance notes.
2. Populate migration table (oldest -> newest) with summaries/links.
3. Include seed file references.
4. Document pnpm patches with rationale and mapping.
5. Mention consolidated SQL script and usage snippet.
6. Proofread and ensure links resolve.

## Edge Cases

- Historical migrations must not change; call out superseding relationships in notes.
- If information missing in SQL, infer from code and mark accordingly.

## Testing & Verification

- Manual preview to confirm formatting and links.
- Confirm file paths exist.

## Rollout

- Internal documentation only; share path with team post-merge.
