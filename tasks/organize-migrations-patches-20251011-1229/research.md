# Research: Organize Supabase Migrations & Patch Files

## Initial Requirements

- Reduce cognitive load when auditing numerous SQL migrations and pnpm patch files.
- Provide a canonical reference summarising order, purpose, and status of each migration/patch.
- Preserve compatibility with existing remote Supabase workflow and pnpm patched dependencies.

## Existing Patterns

- Supabase migrations live in `supabase/migrations/*.sql` with timestamp prefixes (e.g. `supabase/migrations/20251006170446_remote_schema.sql`).
- Later migrations incrementally extend schema and policies; chronological ordering is already relied upon by tooling.
- `DoneList.md` outlines expectations: sequential migrations, remote-only execution, never modify historical files.
- pnpm uses `patch-package` overrides stored under `patches/`, referenced via `pnpm.patchedDependencies` in `package.json`.

## External Resources

- `agents.md` emphasises remote Supabase usage and warns against modifying existing migrations.
- No consolidated registry currently exists in `docs/`; creating one complements existing documentation.

## Technical Constraints

- Cannot squash or edit existing migrations (production already applied).
- Any reorganisation must keep migrations under `supabase/migrations/` for Supabase CLI compatibility.
- Patch filenames must remain aligned with `pnpm.patchedDependencies`.
- Remote database scripts expect current directory layout.

## Open Questions

- Deliverable form: markdown registry summarising migrations & patches?
- Should seed files be referenced alongside migrations?
- Capture additional metadata (owner/task links)?

## Recommendations

- Create documentation file listing migrations with timestamp, summary, notes, and include patch details.
- Mention relevant seed files for completeness.
- Outline maintenance procedure so additions remain consistent.
