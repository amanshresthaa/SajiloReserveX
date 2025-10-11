# Implementation Checklist

## Sidebar Account Data

- [x] Update `components/ops/OpsAppShell.tsx` to accept an optional `account` prop and pass it to `AppSidebar`.
- [x] Fetch user + membership info in `app/(ops)/ops/(app)/layout.tsx` and build the `account` payload.

## Sidebar UI & Logout

- [x] Extend `components/ops/AppSidebar.tsx` to render the account card using provided data.
- [x] Add “Log out” button with disabled/loading state and Supabase sign-out.
- [x] Map restaurant roles to human-readable labels.

## Cleanup

- [x] Adjust `components/LayoutClient.tsx` to safely handle `pathname` null checks after earlier change.
- [x] Run typecheck (acknowledging existing unrelated failures) and document results.

## Questions/Blockers

- None currently.
