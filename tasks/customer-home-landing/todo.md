# Implementation Checklist

## Setup

- [ ] Confirm scope (hero + restaurant list only).
- [ ] Capture design inspiration / layout references if needed.

## Navbar

- [ ] Refactor `CustomerNavbar` with new structure and styling.
- [ ] Factor sign-out + auth state helpers.
- [ ] Update focus/aria semantics.

## Home Page

- [ ] Extract hero component with refreshed copy.
- [ ] Add supporting intro/stats if feasible.
- [ ] Integrate `RestaurantBrowser` with updated framing.

## Testing

- [ ] Update `CustomerNavbar` unit tests.
- [ ] Add/adjust tests for landing content.
- [ ] Run `pnpm run lint` and relevant test suites.

## Verification

- [ ] Manual desktop/mobile smoke (navbar actions, skip link, restaurant section).
- [ ] Validate hydration (no console warnings).
