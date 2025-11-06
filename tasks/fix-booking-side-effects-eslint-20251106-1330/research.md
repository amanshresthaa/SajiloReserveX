# Research: Fix Booking Side-Effects ESLint Warnings

## Requirements

- Functional: keep the booking side-effect tests behaviorally identical while removing `any` casts that violate the lint policy.
- Non-functional (a11y, perf, security, privacy, i18n): ensure eslint passes with zero warnings; avoid altering production code paths; no new dependencies.

## Existing Patterns & Reuse

- `processBooking*SideEffects` helpers already accept an optional Supabase-like client and fall back to the mocked `getServiceSupabaseClient`; we can rely on that instead of injecting a dummy object.
- Prior lint fixes in `tasks/fix-eslint-any-warnings-*` removed `any` by refining test/helpers usage – we can mirror that approach by favoring stricter typing or omitting unnecessary overrides.

## External Resources

- N/A

## Constraints & Risks

- Removing the explicit Supabase stub must not cause the tests to reach real infrastructure – relies on the module mock staying intact.
- Tests must remain deterministic; we should avoid introducing new async behavior or unmocked imports.

## Open Questions (owner, due)

- None at this time.

## Recommended Direction (with rationale)

- Stop passing `{} as any` into the side-effect processors and enqueue helpers; allow the mocked `getServiceSupabaseClient` to supply the fallback instead, which eliminates the explicit `any` usage without changing runtime behavior.
