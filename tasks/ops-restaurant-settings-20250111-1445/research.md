# Research: Restaurant Settings Page for Operational Configuration

**Task**: Create a new `/ops/restaurant-settings` page for managing daily operational configuration (hours, service periods, capacity rules).

## Current State Analysis

### What Already Exists ✅

#### 1. Backend Server Functions

**Operating Hours** (`server/restaurants/operatingHours.ts`)

- ✅ `getOperatingHours(restaurantId)` - Returns weekly schedule + overrides
- ✅ `updateOperatingHours(restaurantId, payload)` - Saves hours (replaces all)
- **Features**:
  - Weekly schedule (7 days: Sun-Sat)
  - Open/close times (HH:MM format)
  - Closed days
  - Holiday/special date overrides
  - Notes per entry
  - Validation (time format, open < close, etc.)

**Service Periods** (`server/restaurants/servicePeriods.ts`)

- ✅ `getServicePeriods(restaurantId)` - Returns all periods
- ✅ `updateServicePeriods(restaurantId, periods)` - Saves periods (replaces all)
- **Features**:
  - Named periods (e.g., "Lunch", "Dinner", "Happy Hour")
  - Day-specific or all days
  - Start/end time
  - Booking type: `lunch`, `dinner`, `drinks`
  - Overlap detection and validation
  - Auto-sorting by day and time

**Restaurant Details** (`server/restaurants/details.ts`)

- ✅ `getRestaurantDetails(restaurantId)` - Basic info
- ✅ `updateRestaurantDetails(restaurantId, input)` - Update info
- **Fields**: name, timezone, capacity, contact email, contact phone

#### 2. API Routes

- ✅ `/api/owner/restaurants/[id]/hours` - GET, PUT
- ✅ `/api/owner/restaurants/[id]/service-periods` - GET, PUT
- ✅ `/api/owner/restaurants/[id]/details` - GET, PUT
- All have tests and follow consistent patterns

#### 3. React Hooks

**Operating Hours** (`hooks/owner/useOperatingHours.ts`)

- ✅ `useOperatingHours(restaurantId)` - Query hook
- ✅ `useUpdateOperatingHours(restaurantId)` - Mutation hook

**Service Periods** (`hooks/owner/useServicePeriods.ts`)

- ✅ `useServicePeriods(restaurantId)` - Query hook
- ✅ `useUpdateServicePeriods(restaurantId)` - Mutation hook

**Restaurant Details** (`hooks/owner/useRestaurantDetails.ts`)

- ✅ `useRestaurantDetails(restaurantId)` - Query hook
- ✅ `useUpdateRestaurantDetails(restaurantId)` - Mutation hook

All hooks use React Query and follow consistent patterns.

#### 4. Database Schema

**`restaurant_operating_hours`**

```sql
- id (uuid, PK)
- restaurant_id (uuid, FK)
- day_of_week (smallint) - 0-6 for weekly, NULL for overrides
- effective_date (date) - NULL for weekly, specific date for overrides
- opens_at (time)
- closes_at (time)
- is_closed (boolean)
- notes (text)
- created_at, updated_at
```

**`restaurant_service_periods`**

```sql
- id (uuid, PK)
- restaurant_id (uuid, FK)
- name (text) - e.g., "Lunch", "Dinner"
- day_of_week (smallint) - NULL for all days, 0-6 for specific day
- start_time (time)
- end_time (time)
- booking_option (enum: 'breakfast', 'lunch', 'dinner', 'drinks')
- created_at, updated_at
```

**`restaurant_capacity_rules`** (Exists but NO server functions yet)

```sql
- id (uuid, PK)
- restaurant_id (uuid, FK)
- service_period_id (uuid, FK, nullable)
- day_of_week (smallint, nullable)
- effective_date (date, nullable)
- max_covers (integer, nullable)
- max_parties (integer, nullable)
- notes (text)
- created_at, updated_at
```

### What's Missing ❌

1. **No capacity rules server functions** - Need to create these
2. **No capacity rules API routes** - Need to create these
3. **No capacity rules hooks** - Need to create these
4. **No unified settings page** - Main deliverable
5. **No restaurant selector component** - Need dropdown to select restaurant

### What Was Deleted

The old `ManageRestaurantShell` component had UI for:

- Weekly operating hours table with inline editing
- Overrides/holidays table with add/remove
- Service periods table with add/remove
- Restaurant details form
- Restaurant selector dropdown
- Form validation and dirty state tracking
- Unsaved changes warning

**Why deleted**: Mixed CRUD concerns with operational settings in one page.

## Architecture Decision

### Approach: New Dedicated Page

**URL**: `/ops/restaurant-settings`

**Purpose**: Day-to-day operational configuration for a single restaurant

**Features**:

1. **Restaurant Selector** - Dropdown to pick which restaurant to configure
2. **Operating Hours Section** - Weekly schedule + overrides
3. **Service Periods Section** - Meal/bar time slots
4. **Capacity Rules Section** (Optional MVP) - Max covers/parties

**Navigation**: Add to ops sidebar as "Restaurant Settings" or "Settings"

### Page Structure

```
┌─────────────────────────────────────────────────────────┐
│ Restaurant Settings                                      │
│ Configure hours, service periods, and capacity          │
│                                                          │
│ Restaurant: [Select Restaurant ▼]                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ┌───────────────────────────────────────────────────┐  │
│ │ Operating Hours                                    │  │
│ │ Weekly schedule and holiday overrides              │  │
│ │                                                     │  │
│ │ [Weekly hours table]                               │  │
│ │ [Overrides table with add/remove]                  │  │
│ │                                       [Save Hours]  │  │
│ └───────────────────────────────────────────────────┘  │
│                                                          │
│ ┌───────────────────────────────────────────────────┐  │
│ │ Service Periods                                    │  │
│ │ Define lunch, dinner, and drinks service times     │  │
│ │                                                     │  │
│ │ [Service periods table with add/remove]            │  │
│ │                                    [Save Periods]   │  │
│ └───────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Setup

- Create task directory ✅
- Document research ✅
- Create implementation plan

### Phase 2: Capacity Rules (Optional for MVP)

- Server functions for capacity rules
- API routes for capacity rules
- React hooks for capacity rules

### Phase 3: UI Components

- RestaurantSelector component
- OperatingHoursEditor component
- ServicePeriodsEditor component
- CapacityRulesEditor component (if doing Phase 2)

### Phase 4: Main Page

- Create `/ops/restaurant-settings/page.tsx`
- Server component with auth check
- Prefetch data for default restaurant
- Hydrate client components

### Phase 5: Integration

- Add to sidebar navigation
- Update route permissions if needed
- Test end-to-end

## Existing Code to Reuse

### From Deleted ManageRestaurantShell

**Good patterns to keep**:

- Restaurant selector dropdown with role display
- Inline table editing for weekly hours
- Add/remove rows for overrides and service periods
- Dirty state tracking with unsaved changes warning
- Validation with inline error messages
- Skeleton loaders for initial load
- Card-based layout with sections
- Save/reset button patterns

**What to improve**:

- Separate sections into independent components
- Better mobile responsiveness
- Clearer error messages
- More intuitive UX for adding/removing rows
- Better accessibility (ARIA labels)

### Component Structure

```
RestaurantSettingsPage (Server Component)
  └─ RestaurantSettingsClient (Client Component)
      ├─ RestaurantSelector
      ├─ OperatingHoursSection
      │   ├─ WeeklyHoursTable
      │   └─ HolidayOverridesTable
      ├─ ServicePeriodsSection
      │   └─ ServicePeriodsTable
      └─ CapacityRulesSection (Optional)
          └─ CapacityRulesTable
```

## Database Considerations

### Operating Hours Pattern

**Weekly hours**: `day_of_week` = 0-6, `effective_date` = NULL
**Overrides**: `day_of_week` = NULL, `effective_date` = specific date

### Service Periods Pattern

**All days**: `day_of_week` = NULL
**Specific day**: `day_of_week` = 0-6

### Capacity Rules Pattern (Not yet implemented)

**Restaurant-wide**: All fields NULL except `max_covers`/`max_parties`
**Day-specific**: `day_of_week` set
**Date-specific**: `effective_date` set
**Period-specific**: `service_period_id` set

Can combine: e.g., specific period on specific day

## Access Control

### Existing Permissions

- **Hours API**: Uses owner namespace `/api/owner/...`
- **Service Periods API**: Uses owner namespace
- **Details API**: Uses owner namespace
- **RLS Policy**: `Staff can manage operating hours/service periods`

**Current behavior**: Any staff member can edit operational settings

### Recommended for Settings Page

Keep same permissions:

- Any authenticated user with membership can view
- Any staff member can edit (owner/admin/staff)
- Only difference from manage-restaurant: no delete operation

## UI/UX Considerations

### Mobile-First Design

- **Desktop**: Side-by-side tables
- **Tablet**: Stacked sections
- **Mobile**: Accordion sections with expand/collapse

### Form Patterns

- **Weekly hours**: Table with 7 rows (one per day)
- **Overrides**: Dynamic list with add/remove buttons
- **Service periods**: Dynamic list with add/remove buttons
- **Time inputs**: Use HTML `<input type="time">` (native picker)
- **Date inputs**: Use HTML `<input type="date">` (native picker)

### Validation

- **Client-side**: Immediate feedback on blur
- **Server-side**: Final validation before save
- **Inline errors**: Show next to field with issue
- **Summary errors**: Show at top of section

### Loading States

- **Initial load**: Skeleton loaders for all sections
- **Save operation**: Disable form + show spinner on button
- **Success**: Toast notification
- **Error**: Alert with retry option

### Accessibility

- **Keyboard nav**: Tab through all inputs
- **Screen readers**: Proper labels and ARIA
- **Focus management**: Focus first error on validation fail
- **Color independence**: Don't rely only on color for status

## Testing Strategy

### Manual Testing

1. **Restaurant selector**: Switch between restaurants, data updates
2. **Operating hours**: Edit weekly, add/remove overrides, save
3. **Service periods**: Add/remove periods, detect overlaps, save
4. **Validation**: Try invalid times, overlaps, empty fields
5. **Dirty state**: Navigate away with unsaved changes
6. **Mobile**: Test on narrow viewports
7. **Keyboard**: Navigate without mouse

### Edge Cases

- **No restaurants**: Show empty state
- **Closed all week**: All days marked closed
- **24-hour operation**: Handle midnight crossing
- **Overlapping periods**: Show validation error
- **Duplicate override dates**: Show validation error
- **Network errors**: Show retry option

## Timeline Estimate

- **Research & Planning**: 30 min ✅
- **Capacity Rules Backend** (optional): 1 hour
- **UI Components**: 3 hours
- **Main Page Integration**: 1 hour
- **Testing & Refinement**: 1 hour

**Total**: ~6 hours (or ~5 hours without capacity rules)

## Decision: MVP Scope

For initial MVP, I recommend:

✅ **Include**:

- Operating hours (weekly + overrides)
- Service periods (with booking options)
- Restaurant selector
- Full validation and error handling
- Mobile responsive design
- Accessibility features

❌ **Defer** (Phase 2):

- Capacity rules (more complex, less frequently used)
- Bulk operations
- Copy settings from another restaurant
- Settings templates

## Recommendation

Build the settings page **without capacity rules** for MVP. This gives us:

- All the essential operational configuration
- Reuses existing, tested backend code
- Simpler UI that's easier to use
- Faster time to completion

Can add capacity rules later based on user feedback.

**Proceed with MVP build?** Yes - using existing backend infrastructure.
