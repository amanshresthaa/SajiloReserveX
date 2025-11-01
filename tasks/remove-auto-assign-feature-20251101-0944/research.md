# Research: Remove Auto Assign Feature

## Requirements

- Functional:
  - Eliminate the auto-assign tables action from the ops dashboard UI (`OpsDashboardClient` button and supporting hook).
  - Remove the client-side service contract (`BookingService.autoAssignTables`) and any consumers/tests that assume the endpoint exists.
  - Delete the Next.js API route at `POST /api/ops/dashboard/assign-tables` and associated server logic that invokes the capacity engine.
  - Excise the capacity-layer implementation (`server/capacity/tables.ts` exports `autoAssignTablesForDate` / `autoAssignTables`, telemetry capture, log persistence) plus related exports and types.
  - Remove auto-assign specific assets (benchmarks, Vitest suites, log fixtures under `logs/auto-assign`).
  - Ensure the Supabase schema has no auto-assign specific artifacts left in migrations or generated schema files.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Preserve manual table assignment flows (`assignTable`, `unassignTable`, manual hold/quote) and their telemetry.
  - Avoid breaking other ops dashboard functionality or introducing dead imports/build errors.
  - Keep file-system cleanup idempotent so CI does not fail due to missing log directories.

## Existing Patterns & Reuse

- Manual assignment actions already flow through `useOpsTableAssignmentActions` (`assignTable`/`unassignTable`) and should remain; we can model removal by slimming this hook down.
- API-layer access control for ops endpoints is standardized in `requireMembershipForRestaurant`; removal should follow patterns used when endpoint disappears (e.g., other retired routes simply removed with tests updated).
- Capacity engine exports live in `server/capacity/index.ts`; we should align with how other deprecated exports were removed to avoid breaking import barrels.
- Booking service mocks in tests follow the helper `createBookingServiceStub` pattern; we should update the stub rather than recreating new helpers.

## External Resources

- None identified; feature is self-contained within this repo.

## Constraints & Risks

- Removing the API route without updating every consumer (React hooks, services, tests) will cause runtime failures or type errors.
- Capacity engine code is heavily shared; need to ensure that deleting auto-assign logic does not remove utilities needed by manual validation, quoting, or telemetry (verify actual call sites before pruning shared helpers).
- Supabase migrations reference assignment RPCs used by manual workflows; we must not drop those inadvertently while eliminating auto-assign-only schema/log artifacts.
- Large deletion touches many files; must keep commits coherent and ensure lint/tests still run without the removed code paths.

## Open Questions (owner, due)

- Q: Do any background jobs or cron tasks still invoke auto-assign outside the dashboard? (owner: us, due before implementation)
  A: Pending confirmation via repo-wide search for `autoAssignTables` / `/assign-tables` (initial scan shows no external callers, will double-check during planning).

## Recommended Direction (with rationale)

- Perform a top-down removal: start at the UI (button + hook) so the UX no longer exposes the feature, then prune the client service contract and associated tests to prevent type drift.
- Delete the API route and server capacity exports, ensuring manual assignment utilities remain intact; update the capacity module barrel plus telemetry helpers to remove unused logic.
- Clean up filesystem artifacts and Supabase schema references that exist solely for auto assign (logs directory, generated schema comments if needed) to meet the "no trace" requirement.
- Finalize by updating/adding regression coverage (ensuring dashboard renders without the action, manual assignment tests still pass) and running the relevant test suites.
