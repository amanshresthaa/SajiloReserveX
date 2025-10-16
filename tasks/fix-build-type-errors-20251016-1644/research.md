# Research: Fix Build Type Errors

## Existing Patterns & Reuse

- App route handlers currently annotate `context` as `{ params: Promise<...> }` (e.g. `src/app/api/ops/bookings/[id]/route.ts`), which worked before but is incompatible with Next.js 15's stricter `AppRouteHandlerContext` typing.
- Supabase access patterns typically rely on `Tables<...>` utility types (see `server/ops/bookings.ts`, `server/ops/vips.ts`), and other queries build dedicated narrowed types when selecting subsets (e.g. `server/ops/bookings.ts` later uses `Pick<Tables<\"bookings\">, \"booking_date\" | ...>`).

## External Resources

- [Next.js — Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) explains the expected `(request, { params })` signature without `Promise` wrappers.
- [Supabase JS — select](https://supabase.com/docs/reference/javascript/select) reminds that typed selects should match the projected shape; over-broad casts (e.g. `Tables<"bookings">`) trigger type errors.

## Constraints & Risks

- Updating the `context` shape means tests/stubs (many use `Promise.resolve(...)`) must be brought along to avoid breakage.
- Supabase query typings must reflect the actual select payload, otherwise we risk runtime assumptions about optional fields like `booking_table_assignments`.
- Need to ensure new helper types stay in sync with `TodayBooking` expectations so downstream logic remains type-safe.

## Open Questions (and answers if resolved)

- Q: Do we need to migrate every route handler away from `Promise`-based params in this task?
  A: Build currently fails on two files; we'll scope fixes to them while noting other handlers may need follow-ups if/when they surface as type errors.
- Q: Why is OpsDashboardClient now triggering a hooks order error?
  A: Newly added `useOpsTableAssignmentActions` hook is invoked only after several early returns (loading/error states). When those guard branches short-circuit, the hook is skipped on first render but executes on later renders—violating the Rules of Hooks.

## Recommended Direction (with rationale)

- Align the route handler signature with Next.js expectations by using synchronous `params` and adjusting usage/tests—unlocking the build without altering runtime behaviour.
- Define a dedicated Supabase row type (via `Pick<Tables<\"bookings\">, ...> & { booking_table_assignments: ... }`) that matches the selected columns so TypeScript can validate transformations without unsafe casts.
- Ensure `useOpsTableAssignmentActions` is invoked unconditionally, either by allowing nullable inputs or by supplying safe defaults, so OpsDashboardClient’s hook order never varies between renders.
