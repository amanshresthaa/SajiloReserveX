## Automated scan summary (generated 2025-10-06)

- Parsed Supabase schema (`types/supabase.ts`) to extract 19 public tables.
- Ran repository-wide scan (excluding tests/build artefacts) for:
  - `supabase.from('<table>')` chains to infer operations (`select`, `insert`, `update`, `delete`).
  - Raw SQL statements containing `FROM`, `JOIN`, `INSERT INTO`, `UPDATE`, `DELETE FROM` with table names.
- Stored raw findings (counts, file hits, sample contexts) in `tasks/db-table-usage-audit-20251006-083051/table_usage_raw.json` for traceability.
