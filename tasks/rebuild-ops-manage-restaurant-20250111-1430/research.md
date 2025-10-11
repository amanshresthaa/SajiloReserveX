# Research: Rebuild /ops/manage-restaurant with Full CRUD

**Task**: Delete existing `/ops/manage-restaurant` and rebuild from scratch with complete CRUD functionality based on database schema.

## Current Implementation Analysis

### Existing Files

- **Page**: `app/(ops)/ops/(app)/manage-restaurant/page.tsx`
- **Component**: `components/ops/manage/ManageRestaurantShell.tsx`
- **Sidebar Reference**: `components/ops/AppSidebar.tsx`
- **Server Functions**: `server/restaurants/details.ts`, `operatingHours.ts`, `servicePeriods.ts`

### Current Functionality

The existing manage-restaurant page provides:

1. Operating hours management (weekly + overrides)
2. Service periods configuration
3. Basic restaurant details update (name, timezone, capacity, contact info)
4. **NOT** full CRUD - only updates details for selected restaurant

### Limitations

- No restaurant listing/table view
- No create new restaurant functionality
- No delete restaurant functionality
- Limited to updating selected restaurant from dropdown
- Focused more on operational settings than restaurant management

## Database Schema

### `restaurants` Table

```sql
CREATE TABLE "public"."restaurants" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" text NOT NULL,
    "slug" text NOT NULL UNIQUE,
    "timezone" text DEFAULT 'Europe/London' NOT NULL,
    "capacity" integer CHECK (capacity IS NULL OR capacity > 0),
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "contact_email" text,
    "contact_phone" text,
    "address" text,
    "booking_policy" text,
    CONSTRAINT "restaurants_slug_check" CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
```

**Indexes**:

- Primary key on `id`
- Unique constraint on `slug`
- Index on `slug`

**Triggers**:

- `restaurants_updated_at` - automatically updates `updated_at` timestamp

**RLS Policies**:

- `anon_read_all` - anonymous users can read all restaurants
- `authenticated_read_all` - authenticated users can read all restaurants
- `authenticated_can_create` - authenticated users can create restaurants
- `owners_admins_can_update` - only owners/admins can update
- `owners_can_delete` - only owners can delete
- `service_role_all_access` - service role has full access

### Related Tables

- `restaurant_memberships` - links users to restaurants with roles (owner/admin/staff/viewer)
- `restaurant_operating_hours` - weekly and override hours
- `restaurant_service_periods` - lunch/dinner/drinks periods
- `restaurant_capacity_rules` - capacity management

## Existing Patterns in Codebase

### API Route Pattern (from `/api/ops/customers/route.ts`)

```typescript
export async function GET(req: NextRequest) {
  // 1. Get authenticated user
  const supabase = await getRouteHandlerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // 2. Validate authentication
  if (authError || !user) {
    return NextResponse.json({ error: '...' }, { status: 401 });
  }

  // 3. Parse and validate query params with zod
  const parsed = schema.safeParse(rawParams);

  // 4. Check user memberships
  const memberships = await fetchUserMemberships(user.id, supabase);

  // 5. Verify access to requested restaurant
  if (!membershipIds.includes(targetRestaurantId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 6. Execute query with service client
  const serviceSupabase = getServiceSupabaseClient();
  const result = await serverFunction({ client: serviceSupabase });

  // 7. Return response
  return NextResponse.json(response);
}
```

### Server Function Pattern (from `/server/restaurants/details.ts`)

```typescript
export async function getRestaurantDetails(
  restaurantId: string,
  client: DbClient = getServiceSupabaseClient(),
): Promise<RestaurantDetails> {
  const { data, error } = await client
    .from('restaurants')
    .select('...')
    .eq('id', restaurantId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Restaurant not found');

  return { ... };
}

export async function updateRestaurantDetails(
  restaurantId: string,
  input: UpdateInput,
  client: DbClient = getServiceSupabaseClient(),
): Promise<RestaurantDetails> {
  const validated = validateInput(input);

  const { error } = await client
    .from('restaurants')
    .update({ ... })
    .eq('id', restaurantId);

  if (error) throw error;

  return getRestaurantDetails(restaurantId, client);
}
```

### Client Component Pattern (from `/components/ops/customers/OpsCustomersClient.tsx`)

```typescript
export function Component({ restaurants, defaultRestaurantId }) {
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(defaultRestaurantId);
  const [page, setPage] = useState(1);

  const filters = selectedRestaurantId ? { restaurantId, page, pageSize } : null;
  const { data, error, isLoading, isFetching, refetch } = useHook(filters);

  // Render restaurant selector, table, pagination
  return (
    <section>
      {/* Restaurant selector dropdown */}
      {/* Error alert with retry */}
      {/* Data table */}
      {/* Pagination */}
    </section>
  );
}
```

### UI Components

- **SHADCN UI** components are used throughout:
  - `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
  - `Button`, `Input`, `Label`, `Alert`, `Skeleton`
  - `Table` components for data display
- **Form patterns**:
  - Inline validation with error messages
  - Dirty state tracking
  - Confirm before navigation with unsaved changes
  - Loading states on buttons ("Saving…")
  - Disabled states during mutations

## Existing Server Functions

### Available Functions (from `server/restaurants/`)

1. `listRestaurants(filters)` - lists restaurants with search/filter
2. `getRestaurantBySlug(slug)` - gets restaurant by slug
3. `getRestaurantDetails(restaurantId)` - gets basic details
4. `updateRestaurantDetails(restaurantId, input)` - updates details
5. `getOperatingHours(restaurantId)` - gets hours
6. `updateOperatingHours(restaurantId, input)` - updates hours
7. `getServicePeriods(restaurantId)` - gets service periods
8. `updateServicePeriods(restaurantId, input)` - updates service periods

### Missing Functions Needed

1. `createRestaurant(input)` - create new restaurant
2. `deleteRestaurant(restaurantId)` - delete restaurant
3. `listRestaurantsForUser(userId)` - list restaurants with pagination for ops interface

## Access Control

### Roles (from `restaurant_memberships`)

- `owner` - full access, can delete
- `admin` - can update settings
- `staff` - limited access
- `viewer` - read-only

### Permission Checks

- Use `fetchUserMemberships(userId, supabase)` to get user's restaurants
- Verify user has appropriate role for operation:
  - CREATE: any authenticated user (membership created during creation)
  - READ: any member of restaurant
  - UPDATE: owner or admin
  - DELETE: owner only

## UI/UX Considerations

### Mobile-First Design

- Responsive tables that collapse on mobile
- Touch-friendly buttons (min 44px target size)
- Proper form input font-size (≥16px on mobile)

### States to Handle

- **Empty state**: No restaurants to manage
- **Loading state**: Skeleton loaders
- **Error state**: Alert with retry option
- **Success state**: Toast notifications
- **Dirty state**: Warn before navigation

### Keyboard & Accessibility

- Full keyboard navigation
- Focus management in modals
- Visible focus rings
- ARIA labels on all interactive elements
- Screen reader announcements for actions

### Form Validation

- Required fields: name, slug, timezone
- Slug format: lowercase alphanumeric with hyphens
- Slug uniqueness check
- Email format validation (if provided)
- Capacity must be positive integer
- Inline error messages
- Submit button enabled until request starts

## Implementation Approach

### 1. Delete Existing Implementation

- Remove `app/(ops)/ops/(app)/manage-restaurant/` directory
- Remove `components/ops/manage/ManageRestaurantShell.tsx`
- Keep server functions in `server/restaurants/` (will extend)
- Keep hooks in `hooks/owner/` (will extend)

### 2. Create New API Routes

- `app/api/ops/restaurants/route.ts` - GET (list), POST (create)
- `app/api/ops/restaurants/[id]/route.ts` - GET (read), PATCH (update), DELETE (delete)
- `app/api/ops/restaurants/schema.ts` - Zod schemas for validation

### 3. Extend Server Functions

- Add `createRestaurant(input, client)` to `server/restaurants/create.ts`
- Add `deleteRestaurant(restaurantId, client)` to `server/restaurants/delete.ts`
- Add `listRestaurantsForOps(userId, filters, client)` to `server/restaurants/list.ts`

### 4. Create React Query Hooks

- `hooks/ops/useRestaurants.ts` - list restaurants
- `hooks/ops/useCreateRestaurant.ts` - create restaurant
- `hooks/ops/useUpdateRestaurant.ts` - update restaurant
- `hooks/ops/useDeleteRestaurant.ts` - delete restaurant

### 5. Build UI Components

- `components/ops/restaurants/RestaurantsClient.tsx` - main client component
- `components/ops/restaurants/RestaurantsTable.tsx` - data table
- `components/ops/restaurants/CreateRestaurantDialog.tsx` - create modal
- `components/ops/restaurants/EditRestaurantDialog.tsx` - edit modal
- `components/ops/restaurants/DeleteRestaurantDialog.tsx` - delete confirmation

### 6. Create Page

- `app/(ops)/ops/(app)/manage-restaurant/page.tsx` - server component with prefetch

## Testing Strategy

### Manual QA with Chrome DevTools (MANDATORY)

- Inspect DOM structure
- Test responsive layouts (mobile, tablet, desktop)
- Check console for errors/warnings
- Profile performance
- Verify accessibility (Lighthouse)
- Test keyboard navigation
- Verify focus management

### Test Scenarios

1. **List restaurants**: pagination, filtering, sorting
2. **Create restaurant**: validation, success, error handling
3. **Update restaurant**: partial updates, validation, optimistic updates
4. **Delete restaurant**: confirmation, cascade behavior, error handling
5. **Permissions**: verify role-based access control
6. **Edge cases**: empty state, network errors, concurrent edits

## External Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [React Query Documentation](https://tanstack.com/query/latest)
- [SHADCN UI Components](https://ui.shadcn.com/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/patterns/)

## Technical Constraints

1. **Supabase REMOTE**: All database operations target remote instance (never local)
2. **Service Role**: Use service role client for privileged operations
3. **RLS Policies**: Respect existing row-level security policies
4. **Slug Generation**: Auto-generate slug from name if not provided
5. **Cascade Deletes**: Deleting restaurant cascades to related tables (handled by DB)

## Recommendations

1. **Phased Implementation**:
   - Phase 1: List + Create + Update (essential CRUD)
   - Phase 2: Delete with confirmation (destructive operation)
   - Phase 3: Advanced features (bulk operations, search, filters)

2. **Slug Handling**:
   - Auto-generate from name: `slugify(name)`
   - Allow manual override
   - Validate uniqueness before submit
   - Show validation errors inline

3. **Optimistic Updates**:
   - Use optimistic updates for edit operations
   - Rollback on error
   - Show loading states appropriately

4. **Error Handling**:
   - Distinguish between validation errors and server errors
   - Provide actionable error messages
   - Allow retry for transient errors

5. **Navigation**:
   - Warn before leaving page with unsaved changes
   - Redirect to list after successful create/delete
   - Stay on edit form after successful update

## Open Questions (Resolved)

1. **Q**: Should we keep operating hours/service periods management?
   **A**: No. This rebuild focuses on restaurant CRUD. Operating hours management should be a separate page/feature if needed.

2. **Q**: Should we allow creating restaurants without memberships?
   **A**: No. Creating user should automatically become owner (insert into restaurant_memberships).

3. **Q**: What happens to related data when deleting restaurant?
   **A**: Database has CASCADE delete constraints, so all related records are automatically deleted.

## Summary

This rebuild will:

1. **DELETE** the current manage-restaurant page focused on operational settings
2. **CREATE** a new manage-restaurant page with full CRUD for the restaurants table
3. Follow established patterns from ops/customers implementation
4. Use SHADCN UI components consistently
5. Implement proper access control based on restaurant_memberships
6. Handle all database fields from restaurants table
7. Provide excellent mobile-first UX with full accessibility support

The new implementation will be a proper restaurant management interface suitable for ops/admin users who need to create, list, update, and delete restaurants in the system.
