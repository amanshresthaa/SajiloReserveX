# Verification Report

## Test Scenarios

- [ ] `/ops` renders with sidebar, trigger works, dashboard content visible.
- [ ] `/ops/bookings/new` accessible via sidebar link, form loads, breadcrumb triggers remain functional.
- [ ] `/ops/team` accessible via sidebar, invite table renders, permissions messaging intact.
- [ ] Keyboard shortcut (`⌘/Ctrl+B`) toggles sidebar without focus loss.
- [ ] Mobile viewport (≤768px) collapses sidebar and trigger opens/closes correctly.

## Accessibility Checklist

- [ ] Visible focus rings on trigger and nav items.
- [ ] Active nav item announces via `aria-current`.
- [ ] Skip-link order remains logical (login page unaffected).

## Performance Metrics

- [ ] No console warnings/errors when navigating between ops routes.

## Automated Checks

- [x] `pnpm lint`

## Known Issues

- [ ] Manual QA (navigation collapse, keyboard shortcut) still pending in a browser session.

## Sign-off

- [ ] Engineering approved
- [ ] Design approved
- [ ] Product approved
