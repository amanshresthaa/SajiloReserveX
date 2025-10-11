# Research: Ops Sidebar Account & Logout

## Existing Patterns

- `components/ops/AppSidebar.tsx` currently renders a static brand card in the header plus navigation groups and a support link in the footer.
- `components/ops/OpsAppShell.tsx` wraps the `/ops` routes with `SidebarProvider` and mounts `AppSidebar` without props.
- `/ops` server pages (e.g. `app/(ops)/ops/(app)/page.tsx`) fetch the authenticated user via `getServerComponentSupabaseClient()` and `fetchUserMemberships()`, selecting the first membership as the active restaurant.
- `components/customer/navigation/CustomerNavbar.tsx` implements a client-side `useSignOut` hook leveraging `signOutFromSupabase()` and `useRouter()` to redirect after logout.
- `lib/supabase/signOut.ts` exposes a `signOutFromSupabase()` helper for client components.

## External Resources

- No third-party APIs required; all data comes from Supabase via existing server utilities.

## Technical Constraints

- `AppSidebar` is a client component, so account data must be fetched on the server (layout) and passed as props.
- Multiple restaurant memberships are possible; existing pages default to the first membership. We'll follow that convention for sidebar display.
- Sidebar styling relies on shadcn sidebar primitives (`SidebarHeader`, `SidebarGroup`, `SidebarMenuButton`, etc.), so new UI should reuse those components.
- Logout should provide feedback (disabled state) and redirect to `/signin`.

## Open Questions

- Should users be able to switch restaurants from the sidebar? (Out of scope—only display primary membership for now.)
- Confirm desired fallback when no membership or email is present (propose defaulting to brand label and “Operations” copy).

## Recommendations

- Extend `AppSidebar` to accept an `account` prop containing `restaurantName`, `userEmail`, and `role`.
- Update the header card to render the active restaurant name plus the authenticated user email and role label.
- Add a “Log out” action within the sidebar footer using `signOutFromSupabase()` and `useRouter()` for navigation.
- Fetch the account payload once in `app/(ops)/ops/(app)/layout.tsx` and pass it through `OpsAppShell` to `AppSidebar`.
