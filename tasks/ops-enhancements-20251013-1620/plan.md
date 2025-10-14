# Implementation Plan: Ops Console Enhancements

## Objective

Enable FOH staff and managers to make better operational decisions by surfacing capacity utilization, VIP guests, booking change history, and detailed guest context directly in the Ops dashboard.

## Success Criteria

- [ ] Service period capacity is visible with color-coded utilization bars
- [ ] Overbooked periods trigger visible alerts before service
- [ ] Today's VIP arrivals (loyalty members) are highlighted with tier badges
- [ ] Booking change history is accessible via expandable panel
- [ ] Guest allergies, preferences, and loyalty status display in booking cards and details
- [ ] All features work on mobile (≥375px), tablet, and desktop
- [ ] Dashboard load time increases by <200ms
- [ ] Graceful degradation when data is unavailable or features are disabled
- [ ] Full keyboard navigation and screen reader support

## Architecture & Components

### Backend Extensions

#### 1. server/ops/bookings.ts

**Extend `getTodayBookingsSummary`**:

- Add optional joins to `loyalty_points` and `customer_profiles`
- Calculate period utilization by matching bookings to service periods
- Return enhanced booking data with loyalty tier, profile notes, preferences

**New function: `getTodayBookingChanges`**:

- Query `booking_versions` for today's changes
- Join with `bookings` for customer names
- Return sorted list of changes with diff data

#### 2. server/ops/capacity.ts (NEW)

**New file for capacity calculations**:

- `getServicePeriodsWithCapacity(restaurantId, date)`: Fetch periods + rules
- `matchBookingToPeriod(booking, periods)`: Time-based matching logic
- `calculateUtilization(periods, bookings)`: Aggregate covers by period

#### 3. server/ops/vips.ts (NEW)

**New file for VIP queries**:

- `getTodayVIPs(restaurantId, date)`: Join bookings with loyalty_points
- Filter for today's arrivals with tier data
- Sort by tier priority (platinum > gold > silver > bronze)

### Frontend Components

#### 1. CapacityVisualization.tsx (NEW)

**Location**: `src/components/features/dashboard/CapacityVisualization.tsx`

**Props**:

```typescript
type CapacityVisualizationProps = {
  periods: PeriodUtilization[];
  loading?: boolean;
};
```

**Layout**:

- Grid of period cards (responsive: stacked mobile, 2-col tablet, 4-col desktop)
- Each card shows: period name, time window, covers booked/max, progress bar
- Progress bar color: green (<80%), yellow (80-99%), red (≥100%)
- Alert banner at top if any period is overbooked

**Accessibility**:

- Progress bars have `aria-label` with percentage
- Alert uses `role="alert"` for screen readers
- Keyboard focusable for any interactive elements

#### 2. VIPGuestsModule.tsx (NEW)

**Location**: `src/components/features/dashboard/VIPGuestsModule.tsx`

**Props**:

```typescript
type VIPGuestsModuleProps = {
  vips: VIPGuest[];
  loading?: boolean;
};
```

**Layout**:

- Compact card with list of VIP arrivals
- Each item: tier badge, name, arrival time, party size
- Max 10 visible, scroll if more
- Empty state: "No VIP arrivals today"

**Badge Colors**:

- Platinum: `bg-purple-500 text-white`
- Gold: `bg-yellow-500 text-black`
- Silver: `bg-gray-400 text-white`
- Bronze: `bg-amber-700 text-white`

#### 3. BookingChangeFeed.tsx (NEW)

**Location**: `src/components/features/dashboard/BookingChangeFeed.tsx`

**Props**:

```typescript
type BookingChangeFeedProps = {
  changes: BookingChange[];
  loading?: boolean;
};
```

**Layout**:

- Collapsible panel (default: collapsed)
- Header: "Recent Changes (15)" with chevron icon
- List items: timestamp, customer name, change type badge, expand button
- Expanded: show diff in two columns (before/after)

**Change Type Badges**:

- Created: green
- Updated: blue
- Cancelled: red
- Status Changed: yellow

#### 4. Enhanced BookingsList.tsx (MODIFY)

**Changes**:

- Add loyalty tier badge next to customer name (if available)
- Add small icons for: allergies (AlertTriangle), preferences (Settings), notes (FileText)
- Pass enhanced booking data from parent

#### 5. Enhanced BookingDetailsDialog.tsx (MODIFY)

**Changes**:

- New section: "Guest Profile" (after existing sections)
- Display: loyalty tier + points, allergies (highlighted with warning), preferences, dietary restrictions
- Show: marketing opt-in status, total bookings count
- Layout: nested card or definition list

### State Management

**No new global state** - use existing query hooks pattern:

- `useOpsCapacityUtilization(restaurantId, date)` → wraps new capacity query
- `useOpsTodayVIPs(restaurantId, date)` → wraps VIP query
- `useOpsBookingChanges(restaurantId, date)` → wraps change feed query

**Integration with existing**:

- Extend `useOpsTodaySummary` hook to include enhanced booking data
- Add optional fields to return type (backwards compatible)

### Database Schema (No Changes)

Use existing tables as-is:

- `restaurant_service_periods`
- `restaurant_capacity_rules`
- `loyalty_points`
- `loyalty_point_events`
- `customer_profiles`
- `booking_versions`
- `bookings`

## Data Flow & API Contracts

### 1. Capacity Utilization

**Query**: `getServicePeriodsWithCapacity(restaurantId, date)`

**Join Logic**:

```sql
SELECT
  sp.id, sp.name, sp.start_time, sp.end_time,
  cr.max_covers, cr.max_parties
FROM restaurant_service_periods sp
LEFT JOIN restaurant_capacity_rules cr
  ON cr.service_period_id = sp.id
  AND (cr.day_of_week IS NULL OR cr.day_of_week = <target_dow>)
  AND (cr.effective_date IS NULL OR cr.effective_date <= <target_date>)
WHERE sp.restaurant_id = <restaurant_id>
ORDER BY cr.effective_date DESC NULLS LAST
```

**Return Type**:

```typescript
type PeriodUtilization = {
  periodId: string;
  periodName: string;
  startTime: string; // HH:MM
  endTime: string;
  bookedCovers: number;
  bookedParties: number;
  maxCovers: number | null;
  maxParties: number | null;
  utilizationPercentage: number; // 0-100
  isOverbooked: boolean;
};

type CapacityUtilizationResponse = {
  date: string;
  periods: PeriodUtilization[];
  hasOverbooking: boolean;
};
```

**Booking Matching Logic**:

- Parse booking `start_time` (HH:MM format)
- Compare against each period's `start_time` and `end_time`
- Assign booking to period if `start_time` falls within period window
- Handle overlaps by assigning to earliest matching period

### 2. VIP Guests

**Query**: `getTodayVIPs(restaurantId, date)`

**Join Logic**:

```sql
SELECT
  b.id as booking_id,
  b.customer_name,
  b.start_time,
  b.party_size,
  lp.tier,
  lp.total_points,
  cp.marketing_opt_in
FROM bookings b
INNER JOIN loyalty_points lp ON b.customer_id = lp.customer_id
LEFT JOIN customer_profiles cp ON b.customer_id = cp.customer_id
WHERE b.restaurant_id = <restaurant_id>
  AND b.booking_date = <target_date>
  AND b.status NOT IN ('cancelled', 'no_show')
ORDER BY
  CASE lp.tier
    WHEN 'platinum' THEN 1
    WHEN 'gold' THEN 2
    WHEN 'silver' THEN 3
    WHEN 'bronze' THEN 4
  END,
  b.start_time ASC
```

**Return Type**:

```typescript
type VIPGuest = {
  bookingId: string;
  customerId: string;
  customerName: string;
  loyaltyTier: 'platinum' | 'gold' | 'silver' | 'bronze';
  totalPoints: number;
  startTime: string;
  partySize: number;
  marketingOptIn: boolean;
};

type VIPGuestsResponse = {
  date: string;
  vips: VIPGuest[];
  totalVipCovers: number;
};
```

### 3. Booking Change Feed

**Query**: `getTodayBookingChanges(restaurantId, date)`

**Join Logic**:

```sql
SELECT
  bv.version_id,
  bv.booking_id,
  bv.change_type,
  bv.changed_at,
  bv.changed_by,
  bv.new_data,
  bv.old_data,
  b.customer_name,
  b.reference
FROM booking_versions bv
INNER JOIN bookings b ON bv.booking_id = b.id
WHERE bv.restaurant_id = <restaurant_id>
  AND DATE(bv.changed_at AT TIME ZONE <tz>) = <target_date>
ORDER BY bv.changed_at DESC
LIMIT 50
```

**Return Type**:

```typescript
type BookingChange = {
  versionId: string;
  bookingId: string;
  bookingReference: string | null;
  customerName: string;
  changeType: 'created' | 'updated' | 'cancelled' | 'status_changed';
  changedAt: string; // ISO timestamp
  changedBy: string | null;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
};

type BookingChangeFeedResponse = {
  date: string;
  changes: BookingChange[];
  totalChanges: number;
};
```

### 4. Enhanced Booking Data

**Extend existing `getTodayBookingsSummary`**:

**Additional Joins**:

```sql
SELECT
  b.*,
  lp.tier as loyalty_tier,
  lp.total_points as loyalty_points,
  cp.notes as profile_notes,
  cp.preferences as preferences,
  cp.marketing_opt_in
FROM bookings b
LEFT JOIN loyalty_points lp
  ON b.customer_id = lp.customer_id
  AND lp.restaurant_id = b.restaurant_id
LEFT JOIN customer_profiles cp
  ON b.customer_id = cp.customer_id
WHERE b.restaurant_id = <restaurant_id>
  AND b.booking_date = <target_date>
ORDER BY b.start_time ASC
```

**Extended Type**:

```typescript
// Extend existing OpsTodayBooking
type OpsTodayBookingEnhanced = OpsTodayBooking & {
  loyaltyTier?: 'platinum' | 'gold' | 'silver' | 'bronze' | null;
  loyaltyPoints?: number | null;
  profileNotes?: string | null;
  allergies?: string[] | null;
  dietaryRestrictions?: string[] | null;
  seatingPreference?: string | null;
  marketingOptIn?: boolean;
};
```

**Preferences Parsing**:

```typescript
function parsePreferences(preferencesJson: unknown): {
  allergies: string[] | null;
  dietaryRestrictions: string[] | null;
  seatingPreference: string | null;
} {
  if (!preferencesJson || typeof preferencesJson !== 'object') {
    return { allergies: null, dietaryRestrictions: null, seatingPreference: null };
  }

  const prefs = preferencesJson as Record<string, unknown>;

  return {
    allergies: Array.isArray(prefs.allergies) ? prefs.allergies : null,
    dietaryRestrictions: Array.isArray(prefs.dietary_restrictions)
      ? prefs.dietary_restrictions
      : null,
    seatingPreference: typeof prefs.seating === 'string' ? prefs.seating : null,
  };
}
```

## UI/UX States

### Loading States

**Capacity Visualization**:

- Skeleton: 3-4 horizontal bars with shimmer
- Preserve layout to prevent CLS

**VIP Module**:

- Skeleton: 3-5 list items with avatar placeholders

**Change Feed**:

- Skeleton: Collapsed header with spinner icon

**Enhanced Booking Data**:

- Use existing BookingsList skeleton
- Additional fields appear progressively

### Empty States

**Capacity Visualization**:

- "No service periods configured" with link to settings
- "Capacity rules not set up" info alert

**VIP Module**:

- "No VIP arrivals today" with friendly message
- Optional: "Set up loyalty program" CTA if not enabled

**Change Feed**:

- "No changes recorded today"

**Enhanced Guest Data**:

- Show booking without additional context if loyalty/profile data missing
- Use "--" or "Not provided" for missing fields

### Error States

**All new queries**:

- Use Alert component with "destructive" variant
- Provide retry button
- Don't block existing functionality

**Example**:

```tsx
{
  error && (
    <Alert variant="destructive">
      <AlertTitle>Unable to load VIP guests</AlertTitle>
      <AlertDescription>
        <Button variant="ghost" size="sm" onClick={retry}>
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  );
}
```

### Success States

**Capacity Visualization**:

- Green bars: All periods under capacity
- Yellow/Red bars: Approaching/exceeding capacity
- Alert banner: "2 services are overbooked" (if applicable)

**VIP Module**:

- List of VIPs with tier badges
- Subtle animation on initial load

**Change Feed**:

- Shows count in header: "Recent Changes (15)"
- Expandable items with smooth transitions

**Enhanced Booking Data**:

- Badges and icons appear inline
- Detailed profile section in dialog

## Edge Cases

### Capacity Calculation

- **No capacity rules**: Show periods without max capacity warning
- **Multiple rules for same period**: Use most recent effective date
- **Bookings spanning multiple periods**: Assign to first matching period only
- **Day-of-week mismatch**: Fall back to day-agnostic rules (day_of_week = NULL)

### VIP Guests

- **Loyalty not enabled**: Hide VIP module entirely (check feature flag)
- **No VIPs today**: Show empty state
- **VIP cancelled/no-show**: Exclude from list (filter by status)

### Change Feed

- **No changes**: Show empty state
- **Large volume (>50 changes)**: Limit to 50 most recent
- **Diff display**: Handle null old_data (creation) and null new_data (deletion)
- **Complex nested diffs**: Show JSON in formatted code blocks

### Guest Context

- **Missing profile data**: Show booking without enhancements
- **Malformed preferences JSON**: Gracefully parse and show what's available
- **Allergies in details vs preferences**: Check both sources and merge

## Testing Strategy

### Unit Tests

**Backend**:

- `matchBookingToPeriod`: Test edge cases (boundary times, overlaps)
- `calculateUtilization`: Test various scenarios (empty, partial, overbooked)
- `parsePreferences`: Test malformed JSON, missing fields
- Capacity rule resolution: Multiple rules, date/dow matching

**Frontend**:

- Badge color logic for tiers and utilization percentages
- Empty state rendering
- Diff formatting logic

### Integration Tests

**API Endpoints**:

- Capacity query with real service periods and bookings
- VIP query with loyalty data joins
- Change feed with booking versions
- Enhanced summary with all joins

**Component Integration**:

- CapacityVisualization renders correctly with various data
- VIPGuestsModule handles empty/loading/error states
- BookingChangeFeed expands/collapses correctly
- Enhanced booking cards display all fields

### E2E Tests (Playwright)

Critical flows:

1. Dashboard loads with capacity visualization showing overbooked alert
2. VIP module displays correct tier badges and names
3. Change feed expands to show recent edits
4. Booking detail dialog shows full guest profile
5. Mobile responsive: all components stack correctly
6. Keyboard navigation: can tab through all interactive elements

### Accessibility Checks

**Automated** (axe):

- Run on dashboard page with all new components
- Check for missing labels, color contrast, ARIA roles

**Manual** (keyboard + screen reader):

- Progress bars announce percentage
- Alerts announce immediately
- Focus visible on all interactive elements
- Expanded panels have proper ARIA attributes

## Rollout

### Phase 1: Enhanced Guest Context (Low Risk)

- Extend existing query with left joins
- Add optional fields to types
- Update BookingsList and BookingDetailsDialog
- Feature flag: `ops_enhanced_guest_context` (default: true)
- Rollout: 100% immediately (backwards compatible)

### Phase 2: Capacity Visualization (Medium Risk)

- Add capacity queries and component
- Integrate above SummaryMetrics
- Feature flag: `ops_capacity_visualization` (default: false)
- Rollout:
  - Internal testing: 1 week
  - Pilot restaurants: 2 weeks (10 restaurants)
  - General availability: 100%

### Phase 3: VIP Guests Module (Medium Risk)

- Add VIP query and component
- Check loyalty pilot flag before showing
- Feature flag: `ops_vip_module` (default: false)
- Rollout:
  - Loyalty pilot restaurants only: 2 weeks
  - Expand to all restaurants with loyalty: 4 weeks

### Phase 4: Booking Change Feed (Higher Risk)

- Add change feed query with pagination
- Collapsible panel component
- Feature flag: `ops_booking_change_feed` (default: false)
- Rollout:
  - Internal testing: 2 weeks (test with high-volume restaurants)
  - Beta opt-in: 4 weeks (restaurants request access)
  - General availability: Gradual (10% → 50% → 100%)

### Monitoring

**Key Metrics**:

- Dashboard load time (p50, p95)
- Query response times for new endpoints
- Error rates per query
- Feature adoption rates (clicks, expansions)

**Alerts**:

- Query timeout >5s
- Error rate >5%
- Dashboard load time regression >200ms

### Rollback Plan

Each feature flag can be toggled off independently:

- Disable flag in feature-flags.ts
- Component won't render
- Existing dashboard functionality unaffected

For data issues:

- Revert server-side query changes
- Frontend gracefully handles missing data

## Dependencies

**Existing**:

- SHADCN UI components (Progress, Badge, Alert, Card)
- React Query for data fetching
- Existing ops hooks pattern
- Supabase client

**New**:

- None - all dependencies already in place

## Open Questions

- [ ] Should capacity alerts trigger email/SMS notifications to managers?
- [ ] Should VIP module allow marking a guest for special attention?
- [ ] Should change feed allow filtering by change type?
- [ ] Should we add CSV export for any of these features?

## Timeline Estimate

- **Phase 1** (Guest Context): 2-3 days
- **Phase 2** (Capacity): 3-4 days
- **Phase 3** (VIPs): 2-3 days
- **Phase 4** (Change Feed): 3-4 days
- **Total**: 10-14 days (serial) or 6-8 days (with parallelization)

## Notes

- All features must respect existing `restaurantId` scoping and permissions
- Mobile-first development mandatory per AGENTS.md
- Chrome DevTools MCP manual QA required before PR
- Consider adding a "What's New" tour for first-time users
