# Research: Fix Loyalty Module ESLint Any Warnings

## Requirements

- Functional: eliminate `@typescript-eslint/no-explicit-any` violations in `server/loyalty.ts` without altering application behavior.
- Non-functional: maintain type safety, preserve lint zero-warning requirement, avoid touching unrelated modules.

## Existing Patterns & Reuse

- Other server modules (e.g., bookings) type Supabase clients using generated Database types with `"public"` schema generics. We can reuse that convention.
- Supabase helper code typically defines `SupabaseClient<Database, "public", Database["public"]>` to avoid `any`.

## External Resources

- N/A

## Constraints & Risks

- Must ensure the chosen schema generics align with the Supabase client usage; incorrect generics could break type inference.
- Avoid importing unused types or introducing circular dependencies.

## Open Questions (owner, due)

- None.

## Recommended Direction (with rationale)

- Replace the `SupabaseClient<Database, any, any>` alias with a concrete typed variant using the generated Database schema (`"public"`), mirroring patterns elsewhere so lint passes and type checking stays accurate.
