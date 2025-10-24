# Implementation Plan: Remove Existing Edit Feature (My Booking)

## Objective

Remove current customer-facing booking edit feature to prepare for a fresh rebuild aligned with create logic.

## Success Criteria

- [ ] No UI paths expose “Edit” for My Booking.
- [ ] No client code references removed edit handlers/routes.
- [ ] Build passes; navigation works without console errors.

## Architecture & Components

- Identify components: pages/routes, modals/forms, hooks/services handling booking edit.
- Remove or stub as necessary; keep create intact.

## Data Flow & API Contracts

- Remove client calls to edit endpoints; leave server routes as-is only if required by other parts (to be confirmed).

## UI/UX States

- Remove edit buttons/links from My Booking views.
- Ensure empty/error states unaffected.

## Edge Cases

- Bookings list/detail should not break if edit controls are gone.

## Testing Strategy

- Manual QA via Chrome DevTools MCP.
- Basic smoke on pages referencing My Booking.

## Rollout

- Single change behind removal; no flag needed.
