# Research — Profile schema alignment

## Sources consulted

- `database/database.sql`
- `current.sql`
- `types/supabase.ts`

## Findings

- `public.profiles` table already exists with columns `id uuid PRIMARY KEY`, `name text`, `email public.email_address`, `image text`, `customer_id text`, `price_id text`, `has_access boolean DEFAULT false`, plus `created_at`/`updated_at` with UTC defaults ([database/database.sql](../../database/database.sql)).
- Row Level Security policies `Users read/insert/update own profile` are already defined for `public.profiles`, gating all operations to `auth.uid() = id`.
- `current.sql` mirrors the same table definition, confirming Supabase state includes `name` and `image`.
- Generated Supabase types in `types/supabase.ts` lack `name` and `image` in the `profiles` table shape (`Row`, `Insert`, `Update`). This mismatch suggests `supabase gen types` has not been rerun since the schema change or the schema file used for generation predates those columns.
- Booking flow files reference booking contact data (`name`, `email`, `phone`) but no code currently reads `public.profiles.name/image`, so API/UI work will rely on the DB columns being available.

## Open questions / uncertainties

- Whether we must enforce immutability of `email` at the database layer (currently unrestricted by schema/policies).
- Whether any downstream consumers rely on `profiles.email` being nullable or mutable.

## Conclusion

- Schema already satisfies upcoming profile management requirements for `name` and `image`; no `database.sql` change is presently needed.
- Action item shifts to regenerating/updating Supabase types so `name` and `image` appear in generated TypeScript definitions.
