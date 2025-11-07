# Implementation Plan: Seed & Script Cleanup (Waterbeach Only)

## Objective

Ensure the repository only contains Waterbeach/White Horse-specific supabase seed scripts plus matching metadata so future resets cannot accidentally provision other venues.

## Success Criteria

- [ ] `supabase/seed.sql` seeds a single venue: White Horse Pub (Waterbeach) and still passes lint/format.
- [ ] All obsolete seed/script variants referencing other venues are removed (and no tooling references them).
- [ ] Supporting metadata (`restaurant.json`, docs) list only White Horse to avoid drift.

## Architecture & Components

- `supabase/seed.sql`: canonical entry point; keep structure but trim restaurant source data + any dependent fixtures so logic still works.
- `supabase/seeds/*`: remove everything except `cleanup-keep-only-waterbeach.sql` and `white-horse-service-periods.sql`; verify no remaining imports elsewhere.
- `supabase/utilities/*`: retain only `reset-for-waterbeach.sql` and `init-seeds-waterbeach.sql`; delete generic `init-seeds.sql` once references are clear.
- `restaurant.json`: shared metadata list consumed by docs/scripts; reduce to the Waterbeach entry.

## Data Flow & API Contracts

- Seed script still truncates/represents tables identically; only the dataset in Stage 4 (restaurants) and downstream loops shrink to one entry. No API contract changes expected.

## UI/UX States

- Not applicable (data-only change); still ensure admin UI works with reduced dataset via existing flows.

## Edge Cases

- Need to make sure removing other restaurants doesn’t break loops expecting >1 entry (e.g., any `SELECT ... FROM restaurants` used later). Keep code generalized.
- Deleting files must be reflected in docs to prevent dead references.

## Testing Strategy

- `pnpm lint` to ensure no lint errors after file deletions/refactors.
- (Optional) targeted tests/scripts referencing `restaurant.json` if any.

## Rollout

- No feature flag; once merged, repository only supports Waterbeach data.
- Documentation should clearly indicate this limitation to avoid confusion.
