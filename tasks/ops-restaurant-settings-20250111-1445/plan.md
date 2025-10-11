# Implementation Plan: Restaurant Settings Page

## Objective

Create a dedicated `/ops/restaurant-settings` page for managing daily operational configuration of restaurants, including operating hours and service periods.

## Success Criteria

- [ ] Users can select any restaurant they have access to
- [ ] Users can view and edit weekly operating hours (Mon-Sun)
- [ ] Users can add/edit/remove holiday overrides
- [ ] Users can view and edit service periods (lunch, dinner, drinks)
- [ ] All changes save correctly to database
- [ ] Form validation provides clear feedback
- [ ] UI is mobile-responsive
- [ ] Full keyboard navigation works
- [ ] No console errors or accessibility violations

## MVP Scope

### ✅ Include

- Operating hours management (weekly + overrides)
- Service periods management (with booking options)
- Restaurant selector dropdown
- Form validation and error handling
- Mobile-responsive design
- Accessibility features
- Dirty state warnings

### ❌ Defer to Phase 2

- Capacity rules management
- Bulk operations
- Copy settings between restaurants
- Settings templates
- Analytics/usage stats

## Architecture

### Page Structure

```
app/(ops)/ops/(app)/restaurant-settings/
  └── page.tsx (Server Component)

components/ops/restaurant-settings/
  ├── RestaurantSettingsClient.tsx (Main orchestrator)
  ├── RestaurantSelector.tsx (Dropdown)
  ├── OperatingHoursSection.tsx (Hours + overrides)
  ├── ServicePeriodsSection.tsx (Periods management)
  └── types.ts (Shared types)
```

### Data Flow

1. **Page Load**:
   - Server: Auth check, fetch user memberships
   - Server: Prefetch first restaurant's data
   - Client: Hydrate with prefetched data

2. **Restaurant Selection**:
   - User selects different restaurant from dropdown
   - All sections refetch data for new restaurant

3. **Editing**:
   - User edits in-memory state (local component state)
   - Dirty flag tracks unsaved changes
   - Save button becomes enabled

4. **Saving**:
   - Click save → Validate → Mutate → Refetch
   - Optimistic update for better UX
   - Toast notification on success/error

## Component Breakdown

### 1. RestaurantSettingsPage (Server Component)

**Responsibilities**:

- Authentication check
- Fetch user memberships
- Prefetch data for first restaurant
- Redirect if not authenticated

**Prefetch**:

- Operating hours
- Service periods
- Restaurant details (for timezone)

### 2. RestaurantSettingsClient

**Props**:

- `memberships`: Array of user's restaurant memberships
- `defaultRestaurantId`: ID of pre-selected restaurant

**State**:

- `selectedRestaurantId`: Currently selected restaurant
- Dialog/modal states (if needed)

**Layout**:

```tsx
<div>
  <header>
    <h1>Restaurant Settings</h1>
    <p>Configure operational hours and service periods</p>
  </header>

  <RestaurantSelector
    restaurants={restaurants}
    value={selectedRestaurantId}
    onChange={setSelectedRestaurantId}
  />

  <OperatingHoursSection restaurantId={selectedRestaurantId} />
  <ServicePeriodsSection restaurantId={selectedRestaurantId} />
</div>
```

### 3. RestaurantSelector

**Props**:

- `restaurants`: Array of { id, name, role }
- `value`: Selected restaurant ID
- `onChange`: Callback

**UI**:

```
Restaurant: [The Happy Pub (Owner) ▼]
```

Shows restaurant name with role badge.

### 4. OperatingHoursSection

**Props**:

- `restaurantId`: Selected restaurant

**Hooks**:

- `useOperatingHours(restaurantId)` - Fetch data
- `useUpdateOperatingHours(restaurantId)` - Save mutation

**State**:

- `weeklyRows`: Array of 7 day entries
- `overrideRows`: Array of date-specific entries
- `weeklyErrors`: Validation errors for weekly
- `overrideErrors`: Validation errors for overrides
- `isDirty`: Has unsaved changes

**UI Sections**:

1. **Weekly Schedule**:

```
┌────────────────────────────────────────────────────────┐
│ Weekly Operating Hours                                  │
│                                                         │
│ Day       Open    Close   Closed  Notes                │
│ ──────────────────────────────────────────────────────│
│ Monday    12:00   23:00   [ ]     Standard hours       │
│ Tuesday   12:00   23:00   [ ]                          │
│ Wednesday [    ]  [    ]  [✓]     Closed for cleaning  │
│ ...                                                     │
│                                                         │
│                              [Reset] [Save Hours]       │
└────────────────────────────────────────────────────────┘
```

2. **Holiday Overrides**:

```
┌────────────────────────────────────────────────────────┐
│ Holiday & Special Hours                 [+ Add Date]    │
│                                                         │
│ Date         Open    Close   Closed  Notes    Actions  │
│ ──────────────────────────────────────────────────────│
│ 2024-12-25   [    ]  [    ]  [✓]     Christmas [Del]  │
│ 2024-12-31   17:00   02:00   [ ]     New Year  [Del]  │
└────────────────────────────────────────────────────────┘
```

**Features**:

- Checkbox for "Closed all day" (disables time inputs)
- Add/remove override rows
- Inline validation errors
- Mobile: Cards instead of table

### 5. ServicePeriodsSection

**Props**:

- `restaurantId`: Selected restaurant

**Hooks**:

- `useServicePeriods(restaurantId)` - Fetch data
- `useUpdateServicePeriods(restaurantId)` - Save mutation

**State**:

- `periodRows`: Array of service period entries
- `errors`: Validation errors per row
- `isDirty`: Has unsaved changes

**UI**:

```
┌────────────────────────────────────────────────────────┐
│ Service Periods                         [+ Add Period]  │
│                                                         │
│ Name         Day        Time         Type      Actions  │
│ ──────────────────────────────────────────────────────│
│ Lunch        Mon-Fri    12:00-15:00  Lunch     [Del]   │
│ Dinner       All days   18:00-22:00  Dinner    [Del]   │
│ Happy Hour   Mon-Fri    17:00-19:00  Drinks    [Del]   │
│                                                         │
│                              [Reset] [Save Periods]     │
└────────────────────────────────────────────────────────┘
```

**Features**:

- Name input (free text)
- Day selector (All days, or specific day)
- Start/end time pickers
- Booking type dropdown (Lunch, Dinner, Drinks)
- Add/remove rows
- Overlap detection and validation
- Mobile: Cards with all fields stacked

## Data Types

### Operating Hours

```typescript
type WeeklyRow = {
  dayOfWeek: number; // 0-6
  opensAt: string; // HH:MM
  closesAt: string; // HH:MM
  isClosed: boolean;
  notes: string;
};

type OverrideRow = {
  id?: string; // UUID for existing, undefined for new
  effectiveDate: string; // YYYY-MM-DD
  opensAt: string;
  closesAt: string;
  isClosed: boolean;
  notes: string;
};
```

### Service Periods

```typescript
type ServicePeriodRow = {
  id?: string; // UUID for existing, undefined for new
  name: string; // e.g., "Lunch", "Dinner"
  dayOfWeek: number | null; // null = all days, 0-6 = specific day
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  bookingOption: 'lunch' | 'dinner' | 'drinks';
};
```

## Validation Rules

### Operating Hours

**Weekly**:

- ✅ All 7 days must be present
- ✅ If not closed: `opensAt` and `closesAt` required
- ✅ If not closed: `opensAt` < `closesAt`
- ✅ Times must be in HH:MM format (00:00 to 23:59)

**Overrides**:

- ✅ `effectiveDate` required and valid date format (YYYY-MM-DD)
- ✅ No duplicate dates
- ✅ If not closed: `opensAt` and `closesAt` required
- ✅ If not closed: `opensAt` < `closesAt`

### Service Periods

- ✅ `name` required (non-empty string)
- ✅ `startTime` required (HH:MM format)
- ✅ `endTime` required (HH:MM format)
- ✅ `startTime` < `endTime`
- ✅ `bookingOption` required (lunch/dinner/drinks)
- ✅ No overlapping periods on same day

## UI/UX Details

### Desktop Layout

```
┌─────────────────────────────────────────────────────────┐
│ Restaurant Settings                                      │
│ Configure hours and service periods                      │
│                                                          │
│ Restaurant: [Select ▼]                                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ [Operating Hours Card]                                   │
│   - Weekly schedule table                                │
│   - Overrides table                                      │
│   - Save/Reset buttons                                   │
│                                                          │
│ [Service Periods Card]                                   │
│   - Periods table                                        │
│   - Add period button                                    │
│   - Save/Reset buttons                                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Mobile Layout

```
┌───────────────────────┐
│ Restaurant Settings    │
│                       │
│ Restaurant:           │
│ [Select ▼]            │
├───────────────────────┤
│                       │
│ [Operating Hours]     │
│   Accordion/Card      │
│   - Day cards         │
│   - Override cards    │
│                       │
│ [Service Periods]     │
│   Accordion/Card      │
│   - Period cards      │
│                       │
└───────────────────────┘
```

### Loading States

- **Initial load**: Skeleton loaders for all sections
- **Restaurant switch**: Show loading overlay on sections
- **Save**: Disable form + spinner on save button
- **Success**: Toast notification + re-enable form
- **Error**: Alert banner + re-enable form

### Error States

- **Network error**: Alert with retry button at top
- **Validation error**: Inline errors next to fields
- **Permission error**: Show message, disable editing

### Empty States

- **No overrides**: "No holiday hours set. Click 'Add Date' to create one."
- **No service periods**: "No service periods defined. Click 'Add Period' to create one."

## Accessibility

### Keyboard Navigation

- ✅ Tab through all inputs in logical order
- ✅ Enter to save form
- ✅ Escape to cancel/reset (with confirmation if dirty)
- ✅ Arrow keys in dropdowns

### ARIA Labels

- ✅ All inputs have associated labels
- ✅ Error messages linked with `aria-describedby`
- ✅ Loading states announced with `aria-busy`
- ✅ Success/error toasts are `aria-live="polite"`

### Focus Management

- ✅ Focus first error on validation fail
- ✅ Focus stays in section after save
- ✅ Visible focus indicators on all interactive elements

### Screen Readers

- ✅ Table headers with `scope` attributes
- ✅ Button labels describe action (not just "Delete")
- ✅ Status messages announced

## Implementation Steps

### Step 1: Component Skeleton

1. Create component files
2. Define TypeScript types
3. Set up basic layout
4. Add restaurant selector

### Step 2: Operating Hours Section

1. Create `OperatingHoursSection` component
2. Weekly hours table with inputs
3. Overrides table with add/remove
4. Form state management
5. Validation logic
6. Save/reset handlers
7. Mobile responsive styles

### Step 3: Service Periods Section

1. Create `ServicePeriodsSection` component
2. Periods table with inputs
3. Add/remove period functionality
4. Form state management
5. Validation (including overlap detection)
6. Save/reset handlers
7. Mobile responsive styles

### Step 4: Main Integration

1. Create `RestaurantSettingsClient` component
2. Integrate selector + sections
3. Handle restaurant switching
4. Unsaved changes warning

### Step 5: Page Setup

1. Create `/ops/restaurant-settings/page.tsx`
2. Auth check and membership fetch
3. Prefetch data
4. Hydration boundary

### Step 6: Navigation

1. Add to ops sidebar
2. Update any relevant navigation

### Step 7: Testing

1. Manual testing all features
2. Mobile responsive testing
3. Keyboard navigation testing
4. Validation testing
5. Chrome DevTools QA

## Edge Cases to Handle

1. **No restaurants**: Show empty state with helpful message
2. **Read-only user**: Show data but disable editing
3. **Concurrent edits**: Last write wins (no conflict resolution in MVP)
4. **Network offline**: Show error, allow retry
5. **Long restaurant names**: Truncate in selector
6. **Many overrides**: Paginate or scroll
7. **24-hour restaurant**: Support times spanning midnight
8. **Timezone changes**: Show warning if editing hours after timezone change

## Testing Checklist

### Functional Tests

- [ ] Select restaurant - data loads
- [ ] Edit weekly hours - saves correctly
- [ ] Add override - persists
- [ ] Remove override - deletes
- [ ] Edit service period - saves correctly
- [ ] Add service period - persists
- [ ] Remove service period - deletes
- [ ] Validation errors show inline
- [ ] Save button disabled until changes made
- [ ] Reset button reverts changes
- [ ] Unsaved changes warning on navigate

### Responsive Tests

- [ ] Desktop (1920px) - full tables
- [ ] Tablet (768px) - adapted layout
- [ ] Mobile (375px) - cards/stacked

### Accessibility Tests

- [ ] Keyboard navigate entire form
- [ ] Screen reader announces changes
- [ ] Focus visible on all elements
- [ ] ARIA labels correct
- [ ] Error messages linked to inputs

### Browser Tests

- [ ] Chrome - works
- [ ] Firefox - works
- [ ] Safari - works
- [ ] Mobile browsers - works

## Performance Considerations

- **Prefetch**: First restaurant data on server
- **Debounce**: Validation checks (not on every keystroke)
- **Memoization**: Expensive calculations
- **Pagination**: If > 20 overrides
- **Virtualization**: Not needed for MVP (< 50 total items)

## Timeline

- **Component Skeleton**: 30 min
- **Operating Hours Section**: 2 hours
- **Service Periods Section**: 1.5 hours
- **Main Integration**: 1 hour
- **Page Setup**: 30 min
- **Testing**: 1 hour

**Total**: ~6.5 hours

## Success Metrics

After implementation:

- ✅ Build passes with no errors
- ✅ Lint passes with no warnings
- ✅ All manual tests pass
- ✅ Lighthouse accessibility score: 100
- ✅ No console errors
- ✅ Mobile responsive
- ✅ Full keyboard navigation

## Future Enhancements (Post-MVP)

1. **Capacity Rules**: Add section for max covers/parties
2. **Bulk Operations**: Copy hours from one day to all days
3. **Templates**: Save and apply preset configurations
4. **History**: View previous changes
5. **Validation Preview**: Show booking availability based on current settings
6. **Smart Suggestions**: Recommend service periods based on hours

---

**Ready to implement**: Yes  
**Blockers**: None  
**Dependencies**: All backend code exists and is tested
