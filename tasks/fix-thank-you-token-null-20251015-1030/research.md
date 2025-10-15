# Research: Fix Thank You Page Token Handling

## Existing Patterns & Reuse

- `src/components/features/dashboard/OpsDashboardClient.tsx` and other client components wrap `useSearchParams()` usage with optional chaining (`searchParams?.toString()`) before transforming the URL params. We can mirror this pattern to stay consistent.
- No shared utility exists for accessing search params defensively; localized guards are the current approach.

## External Resources

- [Next.js 15 `useSearchParams` docs](https://nextjs.org/docs/app/api-reference/functions/use-search-params) – notes that the hook can return `null` during the first render, which aligns with the TypeScript type.

## Constraints & Risks

- Component is client-side only; any solution must avoid server-only APIs.
- Thank-you page behavior relies on the `token` query parameter; guarding must not break the loading sequence when the token is present.
- Build must pass strict TypeScript checks, so we need an explicit null guard or fallback.
- Next.js 15 enforces wrapping `useSearchParams()` calls with `Suspense`; we'll need to update the component accordingly to avoid build-time errors.

## Open Questions (and answers if resolved)

- Q: Do other parts of the thank-you page assume `token` exists synchronously?
  A: The `useEffect` already aborts when `token` is falsy, so guarding earlier leaves downstream logic intact.

## Recommended Direction (with rationale)

- Guard `useSearchParams()` with optional chaining and safely derive `token` (e.g., `const token = searchParams?.get('token') ?? null;`). This matches existing patterns, satisfies the TypeScript contract, and keeps runtime behavior unchanged when the token exists.
- Wrap the component that consumes `useSearchParams()` in `Suspense`, factoring existing loading UI into a shared fallback so prerendering can proceed.
