# Research: Presentation Layer for tables.ts

## Existing Patterns & Reuse

- `src/components/features/tables/TableInventoryClient.tsx` already implements the end-to-end UI for managing tables: querying data with React Query, rendering summary cards, listing tables, and exposing modals for CRUD.
- The service layer exported from `src/services/ops/tables.ts` provides the browser client used by the UI through the `OpsServicesProvider`. Any presentation work should keep reusing `useTableInventoryService()` from `@/contexts/ops-services`.
- Shared primitives (buttons, dialog, select, table, textarea, etc.) come from Shadcn UI components under `src/components/ui/`.
- Zone management UI leverages `ZoneService` from `@/services/ops/zones`; patterns for mutation handling mirror other ops modules (bookings, team, etc.).
- Query key patterns (`queryKeys.opsTables.*`) follow the centralized definitions in `@/lib/query/keys`.

## External Resources

- [Shadcn UI component docs](https://ui.shadcn.com/) – matches the primitives already used in the tables feature.
- React Query mutation/query patterns in TanStack docs – aligns with `useQuery`/`useMutation` usage already present.

## Constraints & Risks

- UI changes must satisfy accessibility requirements (labels, keyboard support, semantics); current implementation relies on shadcn components but needs verification if modified.
- Any new presentation logic must remain mobile-first and responsive; present layout uses responsive grid utilities, so adjustments should respect Tailwind conventions.
- React Query cache invalidation is critical: forgetting to invalidate the `['ops', 'tables']` key after mutations would leave UI stale.
- Deleting tables is guarded by role checks; presentation updates must not weaken admin-only protections.

## Open Questions (and answers if resolved)

- Q: Is the ask to modify or merely document the existing presentation layer around `TableInventoryClient`?
  A: _Pending clarification from maintainer._
- Q: Are there new UX requirements (e.g., floor plan visualization) beyond the current tabular view?
  A: _Pending clarification._

## Recommended Direction (with rationale)

- Pending clearer requirements; likely paths include (a) auditing the current presentation for gaps (responsiveness, toast messaging, skeletons) or (b) extending UI using existing `TableInventoryClient` patterns to meet any new specs once provided.
