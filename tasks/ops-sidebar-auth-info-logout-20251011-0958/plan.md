# Implementation Plan: Ops Sidebar Account Summary & Logout

## Objective

Update the `/ops` sidebar to show the authenticated restaurant context (restaurant name, user email, role) and provide a logout control directly within the sidebar.

## Success Criteria

- [ ] Sidebar header displays the active restaurant name and the current user's email plus role.
- [ ] Display gracefully handles missing data (fallback copy) without crashing.
- [ ] “Log out” button signs the user out via Supabase and redirects to `/signin`.
- [ ] No regressions to existing sidebar navigation or support link.

## Architecture

### Components

- `app/(ops)/ops/(app)/layout.tsx`: Fetch authenticated user + memberships and pass an `account` payload into `OpsAppShell`.
- `components/ops/OpsAppShell.tsx`: Accept new `account` prop and forward it to `AppSidebar`.
- `components/ops/AppSidebar.tsx`: Render account card in header and add logout action in footer.

### State Management

- Client-side sign-out button manages local `isSigningOut` state for loading/disabled UI.

### Data Flow

1. Layout fetches Supabase user + memberships → builds `{ restaurantName, userEmail, role }`.
2. `OpsAppShell` receives the account object and hands it to `AppSidebar`.
3. `AppSidebar` renders account info and handles logout.

## Implementation Steps

1. Extend `OpsAppShell` props with `account` and pass through to `AppSidebar`.
2. Update `AppSidebar`:
   - Accept `account` prop and render the header card with fallback styles.
   - Add logout button in footer with async handler.
3. Modify layout to fetch account data and provide it to `OpsAppShell`.
4. Ensure `CustomerNavbar` gating remains safe (`pathname?.startsWith("/ops") ?? false`).

## Edge Cases

- User has no memberships → show brand fallback and user email only (if available); hide role badge when undefined.
- Missing email (rare) → show placeholder text (`"Signed in user"`).
- Logout failures → log to console and re-enable button (no toast requirement given).

## Testing Strategy

- Manual QA in Chrome DevTools:
  - Verify sidebar shows expected data on `/ops`.
  - Trigger logout and confirm redirect to `/signin`.
  - Test responsive sidebar states (expanded/collapsed).
- TypeScript compile (noting existing repo failures).

## Rollout Plan

- No feature flag; deploy with standard QA. Ensure Supabase session handling unaffected.
