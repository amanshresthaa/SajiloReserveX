# Implementation Plan: Restaurant Management

## Objective

Deliver a `/manage-restaurant` experience where authenticated restaurant staff (admin roles) can review and edit their venue's operating schedule (weekly hours, service periods, date overrides) and key restaurant metadata (timezone, capacity, contact info) without developer intervention.

## Success Criteria

- [ ] Authenticated staff visiting `/manage-restaurant` can select one of their restaurants (or see an access message if none).
- [ ] The page loads the current operating schedule (weekly hours, service periods, overrides) and metadata from Supabase and reflects them accurately in the UI.
- [ ] Staff can update daily open/close times, mark closures, adjust service periods, manage date-specific overrides, and persist changes with validation feedback.
- [ ] Staff can review and edit restaurant metadata (timezone, capacity, phone/email/contact) within the same flow.
- [ ] Forms honor accessibility requirements (keyboard navigation, focus management) and provide inline error messaging.

## Architecture

### Components

- `app/(authed)/manage-restaurant/page.tsx`: server component ensuring sign-in, fetching memberships, hydrating initial data, and enforcing authorization.
- `components/owner/ManageRestaurantClient.tsx`: client orchestrator handling restaurant selection, data fetching via React Query, dirty-state management, and cross-section submission.
- `components/owner/hours/WeeklyHoursForm.tsx`: reusable form for 7-day schedule with open/close inputs, closed toggle, and validation hints.
- `components/owner/hours/ServicePeriodsForm.tsx`: editor for named service periods (e.g., lunch/dinner) backed by `restaurant_service_periods`.
- `components/owner/hours/OverridesTable.tsx`: list + editor for specific-date overrides with calendar picker, notes, and closure toggles.
- `components/owner/details/RestaurantDetailsForm.tsx`: metadata section (timezone selector, capacity input, contact fields, optional display name editing).

### State Management

- React Query hooks (`useRestaurantMemberships`, plus new `useOperatingHours`, `useServicePeriods`, `useOperatingOverrides`, `useRestaurantDetails`, and their mutation counterparts) manage remote data. Extend `queryKeys` with `ownerRestaurants.hours/servicePeriods/overrides/details` namespaces.
- Local component state tracks the active restaurant ID and unsaved changes. Use `react-hook-form` (scoped per section or via a shared form provider) to handle validation, dirty flags, and submission guards (warn on navigation if unsaved changes exist).

### API Integration

**Endpoint**: `GET /api/owner/restaurants/[id]/hours`

- Response: `{ restaurantId: string, timezone: string, weekly: Array<{ dayOfWeek: number, opensAt: string | null, closesAt: string | null, isClosed: boolean }>, overrides: Array<{ id: string, effectiveDate: string, opensAt: string | null, closesAt: string | null, isClosed: boolean, notes?: string | null }> }`

**Endpoint**: `PUT /api/owner/restaurants/[id]/hours`

- Request: `{ weekly: [...], overrides: [...] }`
- Response: Updated payload (same shape as GET).

**Endpoint**: `GET /api/owner/restaurants/[id]/service-periods`

- Response: `{ restaurantId: string, periods: Array<{ id: string, name: string, dayOfWeek: number | null, startTime: string, endTime: string }> }`

**Endpoint**: `PUT /api/owner/restaurants/[id]/service-periods`

- Request: `{ periods: [...] }`

**Endpoint**: `PUT /api/owner/restaurants/[id]/details`

- Request: `{ name?: string, timezone: string, capacity?: number | null, phone?: string | null, email?: string | null }`
- Response: `{ restaurantId: string, name: string, timezone: string, capacity: number | null, phone: string | null, email: string | null }`

All routes rely on `getRouteHandlerSupabaseClient` for session auth, `requireMembershipForRestaurant` for authorization, and the Supabase service client for batched operations on `restaurant_operating_hours`, `restaurant_service_periods`, and `restaurants`. Validation is handled with Zod schemas, enforcing open < close, non-overlapping service periods, and proper date formats.

## Implementation Steps

1. **Data layer**: add server helpers (`server/restaurants/operatingHours.ts`, `servicePeriods.ts`, `details.ts`) to load and upsert schedule data, encapsulating DB ↔ DTO transformations and validation utilities (e.g., overlap detection).
2. **API routes**: implement REST handlers (`app/api/owner/restaurants/[id]/hours`, `/service-periods`, `/details`) with GET/PUT methods, using helpers + Zod to validate input and returning normalized payloads.
3. **Query keys & hooks**: extend `lib/query/keys.ts` with `ownerRestaurants` namespaces; create React Query hooks (`useOperatingHours`, `useUpdateOperatingHours`, etc.) with appropriate cache invalidation/optimistic updates.
4. **Client UI**: build form components for weekly hours, service periods (add/remove rows, per-day controls), overrides (table with add/edit modals, calendar picker), and metadata (timezone select, contact inputs). Ensure forms surface validation, disable submit until dirty, and integrate toasts for success/error.
5. **Page assembly**: compose `/manage-restaurant` with server-side hydration of the default restaurant’s data, restaurant switcher that triggers refetch + form resets, and loading placeholders/skeletons.
6. **UX polish**: implement dirty-state guards (before unload + route changes), keyboard-accessible controls, responsive layout (mobile-first), and confirmation flows for destructive actions (e.g., deleting overrides or service periods).

## Edge Cases

- Restaurants without existing schedule rows should render sensible defaults (e.g., closed days) and allow creation without errors.
- Validation rules: close time must be after open (unless closed); service periods must have start < end and avoid overlaps per day; overrides can represent closures (null opens/closes) but must respect effective-date uniqueness.
- Multi-restaurant owners must not leak data—switching restaurants should cancel outstanding queries, reset forms, and refetch new data.
- Timezone awareness: display the restaurant’s timezone in the UI; ensure times are stored in HH:MM local format and highlight DST considerations.

## Testing

- Vitest route tests for each endpoint covering authentication failures, membership denial, schema validation (weekly hours, overrides, service periods, metadata), and happy paths.
- Unit tests for helper utilities (conversion, normalization, overlap detection, validation) ensuring deterministic behavior.
- Manual QA script: verify keyboard navigation and screen reader labels, edit each section (hours, service periods, overrides, metadata), confirm updates persist and reflect in subsequent fetches.

## Rollout

- Ship behind standard auth; no feature flag planned. Update ops runbooks to include manual QA of hours, overrides, service periods, and metadata before release.
- Monitor Supabase `restaurant_operating_hours` and `restaurant_service_periods` tables post-deploy; log API mutations via `logAuditEvent` for traceability.

## Open Questions

- None for now; scope is locked to the existing schema with weekly hours, service periods, overrides, and metadata edits.
