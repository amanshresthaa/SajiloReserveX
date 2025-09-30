# Plan — Profile schema alignment

1. Re-read `database/database.sql` + `current.sql` to confirm whether `public.profiles` already exposes `name`/`image` with appropriate defaults and constraints.
2. Cross-check Supabase generated types (`types/supabase.ts`) to understand mismatches and determine whether a DB change—rather than a type regeneration—is needed.
3. Decide whether a `database.sql` patch is necessary; if not, document the justification, plus any residual work that keeps feature delivery unblocked.
4. Update `types/supabase.ts` so the generated shapes for `public.profiles` include `name` and `image`, keeping `Row`, `Insert`, and `Update` aligned with the schema.
