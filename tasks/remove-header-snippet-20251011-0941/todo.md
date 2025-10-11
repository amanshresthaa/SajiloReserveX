# Implementation Checklist

## Ops Header Removal

- [x] Remove sticky `<header>` JSX from `components/ops/OpsAppShell.tsx`.
- [x] Delete associated variables that become unused.
- [x] Adjust surrounding layout spacing if necessary.

## Global Navbar Adjustment

- [x] Update `components/LayoutClient.tsx` to suppress `CustomerNavbar` on `/ops` routes.
- [x] Verify no other components depend on the navbar within Ops flows.

## Cleanup

- [ ] Run type check or lint (if applicable) to ensure no unused imports or errors remain.

## Questions/Blockers

- `npm run typecheck` fails due to pre-existing issues in test files and `.next/types` artifacts; not addressed within this task.
