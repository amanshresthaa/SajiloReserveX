# Research: Ops restaurant logo column fix

## Requirements

- Functional:
  - Ensure `/api/ops/restaurants/[id]` and other restaurant reads/writes stop crashing when the backing database does not yet expose the new `logo_url` column.
  - Preserve support for the logo field when the column does exist so downstream email/rendering flows keep receiving the branding metadata.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Maintain backwards compatibility for existing Supabase environments (staging/prod) without requiring an immediate migration.
  - Keep the new compatibility layer localized and logged for observability while avoiding unbounded retries.

## Existing Patterns & Reuse

- Restaurant service modules (`server/restaurants/{create,update,list,details}.ts`) centralize most DB access; API routes and email utilities call into them or duplicate the select/update lists.
- Queries currently project the full restaurant column list inline; we can reuse a helper that emits the canonical select list to avoid drift.
- Errors bubble up from Supabase/Postgres with `code: '42703'` (`undefined_column`) when `logo_url` is referenced before the migration lands.

## External Resources

- [PostgreSQL error codes appendix](https://www.postgresql.org/docs/current/errcodes-appendix.html) — documents `42703` (`undefined_column`), confirming the signal we can key off for fallbacks.

## Constraints & Risks

- Supabase migrations are applied remotely only; we cannot rely on this fix landing instantly in every environment, so application-side guards are required short-term.
- Every fallback path issues a second query/update, so we must scope it narrowly (only when we see `42703`).
- Need to ensure inserts/updates strip `logo_url` when unavailable; otherwise Postgres rejects the payload again.

## Open Questions (owner, due)

- Q: When will the remote Supabase migration adding `logo_url` be applied so we can remove the compatibility shim?
  A: Assumed to follow shortly after release; will leave a log message so platform can verify (owner: Platform, post-merge).

## Recommended Direction (with rationale)

- Introduce a shared compatibility helper that detects `logo_url` missing via error code `42703`, adds `logo_url: null` back into returned rows, and logs once per call site.
- Extract a canonical restaurant select column builder so the fallback can re-use the exact column set for all queries.
- Wrap every restaurant select/insert/update (service modules, email helpers, API routes, preview script) with the helper so they automatically retry without the `logo_url` column and default to `null` until the migration is deployed.
