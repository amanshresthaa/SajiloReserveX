# Implementation Plan: Ops Bookings Recent Default

## Objective

Make the Ops bookings dashboard load the "Recent" status view by default (without needing `filter=recent`), while keeping other filters functional and URL syncing intact.

## Success Criteria

- [ ] Visiting `/ops/bookings` with no `filter` query shows the Recent tab highlighted and data scoped to recent bookings.
- [ ] Adding `filter=upcoming` (or any other valid value) still works and the query param reflects the selection.
- [ ] Default filter is omitted from the query string to keep URLs clean.

## Architecture & Components

- `src/components/features/bookings/OpsBookingsClient.tsx`: change `DEFAULT_FILTER` to `'recent'`. No other code paths need alteration because the constant is used everywhere (initial state, URL syncing, resets).
- No server/API changes required.

## Data Flow & API Contracts

- None; only client-side state defaults change.

## UI/UX States

- Tabs already handle selection; simply ensure the default tab is now Recent.

## Edge Cases

- If someone manually navigates with `filter=upcoming`, ensure the behavior matches pre-change (it should because parse + state remain unchanged).
- When clearing filters (setting back to default), confirm the `filter` param is removed (existing logic handles this via comparison to `DEFAULT_FILTER`).

## Testing Strategy

- Unit/automated: rely on existing coverage; no direct tests identified.
- Manual: load `/ops/bookings` (blocked without ops credentials; document if access unavailable).
- Run `pnpm lint` (already quick) or targeted typecheck if necessary.

## Rollout

- No flags; simple default change.
