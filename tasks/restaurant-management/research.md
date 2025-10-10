# Research: Restaurant Management

## Existing Patterns

- `useRestaurantMemberships` (`hooks/owner/useRestaurantMemberships.ts`) fetches the authenticated user’s restaurant memberships via `/api/owner/team/memberships`, giving us restaurant IDs, names, and roles. `TeamManagementClient` already uses this hook to drive a restaurant selector and enforce admin-only actions.
- Ops-facing management screens (e.g., `/ops/bookings` and `/ops/team`) live under `app/(ops)/ops/(app)/` and pair a server component that resolves auth + memberships with a client component wired to React Query hooks. They rely on helper utilities like `fetchUserMemberships` (`server/team/access.ts`) for authorization.
- Configuration such as reservation opening hours currently flows from `reserve/shared/config/reservations.ts`, which reads defaults plus optional overrides from runtime variables. There is no UI yet for restaurant-specific overrides, but Supabase already exposes a `restaurant_operating_hours` table (see `types/supabase.ts:662`) with `day_of_week`, `opens_at`, `closes_at`, and `is_closed` fields scoped per restaurant.
- API routes follow a pattern of colocating owner/ops capabilities under `app/api/ops/*` or `app/api/owner/*`, using `getRouteHandlerSupabaseClient` for session-aware queries and deferring authorization to `requireMembershipForRestaurant`.

## External Resources

- Supabase schema defined in `supabase/migrations/20251006170446_remote_schema.sql` documents `restaurant_operating_hours` (day-specific hours, optional effective date, staff RLS policy).
- Shadcn UI components (buttons, forms, dialogs) and existing date/time pickers provide building blocks for the management UI.

## Technical Constraints

- RLS on `restaurant_operating_hours` allows authenticated users only when their membership matches the restaurant (`user_restaurants()` policy). APIs must therefore ensure the session user has the restaurant in their membership list before mutating data.
- Time fields are stored as strings (`HH:MM`)—client-side inputs must validate format and enforce open < close to satisfy table constraints.
- Operations must accommodate both recurring weekly hours (`day_of_week`) and ad-hoc effective-date overrides, per schema.
- The app enforces accessibility (keyboard flows, focus management) and prefers mobile-first responsive layouts; any new form needs to follow these standards.

## Open Questions

- _Resolved_: We must operate within the current schema (e.g., `restaurant_operating_hours`, `restaurant_service_periods`, `restaurants`), only extending it if we discover a hard blocker.
- _Resolved_: MVP includes specific-date overrides (closures/holiday hours) alongside weekly recurrence.
- _Resolved_: Screen should also surface other restaurant attributes (timezone, capacity, contact details) for review/edit.

## Recommendations

- Build `/manage-restaurant` as an authenticated owner/ops surface that reuses membership checks to select a target restaurant. Seed the UI with a selector similar to `TeamManagementClient` for users tied to multiple restaurants.
- Expose a dedicated REST API namespace (e.g., `/api/owner/restaurants/[id]/hours`) to list and mutate operating hours (weekly + overrides) using existing tables (`restaurant_operating_hours`, `restaurant_service_periods`) and authorization via `requireMembershipForRestaurant`. Extend payloads to include basic restaurant metadata updates when needed.
- Represent weekly hours in the client with a structured form (7-day grid) plus grouped service-period editors (lunch/dinner) that map directly to the current schema. Add a second editor for date-based overrides with calendar/date picker controls.
- Include ancillary restaurant fields (timezone selection, capacity, contact info) in a separate form section so admins can review and adjust them alongside hours.
