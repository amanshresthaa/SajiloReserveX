# Research: Ops dashboard build failure

## Requirements

- Functional: Restore `next build` success by ensuring the Ops dashboard page obeys Next.js client component rules.
- Non-functional (a11y, perf, security, privacy, i18n): No regressions; the page should remain a client component so interactive sidebar controls work. Build tooling (Next/Turbopack) must pass without warnings.

## Existing Patterns & Reuse

- Other Ops app client components (e.g., `src/app/(ops)/ops/(app)/bookings/page.tsx`) place the `"use client"` directive at the top of the file followed only by imports. We'll mirror that pattern.

## External Resources

- [Next.js App Router Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components) – reiterates `"use client"` must be the first statement.

## Constraints & Risks

- Directive must be the very first statement; any stray directive later in the file causes Turbopack to fail (`page.tsx:55` error observed).
- Avoid modifying component behavior—only clean the errant directive.
- Supabase RPC typings lag behind migrations: `release_hold_and_emit` and `sync_confirmed_assignment_windows` exist in SQL but not in `types/supabase.ts`, so `supabase.rpc` rejects the calls at build time.
- `synchronizeAssignments` references an `AbortSignal` named `signal` without accepting it in `AssignmentSyncParams`; TypeScript rightfully flags `signal` as undefined when compiling.

## Open Questions (owner, due)

- None. Single-file fix is clear.

## Recommended Direction (with rationale)

- Remove the stray `"use client"` literal appended at the bottom of `src/app/(ops)/ops/(app)/dashboard/page.tsx`. The file already declares the directive correctly at the top; the trailing literal violates the compiler rule and is the build blocker. After removal, rerun lint/build to confirm the environment is healthy.
- Extend our generated Supabase types (`types/supabase.ts`) with the `release_hold_and_emit` and `sync_confirmed_assignment_windows` RPC definitions so the capacity services can compile; this keeps the runtime calls typed and avoids casting to `any`.
- Thread the optional `signal` through `AssignmentSyncParams` and its call sites so the RPC helper can optionally honor abort controllers without introducing undefined identifiers.
