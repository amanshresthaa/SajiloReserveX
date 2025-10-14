# Research: Ops Console Enhancements

## Objective

Enhance the Ops console dashboard with four key capabilities:

1. Service load vs capacity visualization
2. High-value guest highlighting (VIPs)
3. Booking change feed/audit trail
4. Richer guest context in booking cards

## Existing Patterns & Reuse Opportunities

### Database Schema

**Service Periods & Capacity** (types/supabase.ts):

- `restaurant_service_periods` (lines 712-741): Contains shift windows with `start_time`, `end_time`, `day_of_week`, `name`, `booking_option`
- `restaurant_capacity_rules` (lines 756-810): Linked to service periods via `service_period_id`, contains `max_covers`, `max_parties`, `day_of_week`, `effective_date`

**Loyalty & Customer Data**:

- `loyalty_points` (lines 421-447): Contains `customer_id`, `tier`, `total_points`
- `loyalty_point_events` (lines 361-420): Event log with `event_type`, `points_change`, `metadata`
- `customer_profiles` (lines 251-280): Contains `notes`, `preferences` (JSON), `marketing_opt_in`, booking history

**Booking Audit Trail**:

- `booking_versions` (lines 101-150): Captures every edit with `change_type`, `new_data`, `old_data` (JSON), `changed_by`, `changed_at`

### Existing Server Queries

**Booking Summary** (server/ops/bookings.ts:57-150):

- `getTodayBookingsSummary()`: Already fetches bookings with `details` JSON and basic totals
- Returns `OpsTodayBookingsSummary` with `bookings[]` and `totals`
- Currently groups only by status, not by service period

**Existing Loyalty Logic** (server/loyalty.ts):

- Complete loyalty program implementation with tier calculation
- Functions: `getCustomerLoyaltySnapshot()`, `computeCurrentTier()`
- Already handles tier thresholds (bronze: 0, silver: 100, gold: 500, platinum: 1500)

**Service Periods** (server/restaurants/servicePeriods.ts):

- `listServicePeriods()`: Fetch all periods for a restaurant
- Data normalization for `startTime`, `endTime`, `dayOfWeek`

### UI Components Available

**SHADCN Components** (components/ui/):

- `Progress`: Radix UI progress bar with value/max props (components/ui/progress.tsx)
- `Badge`: Variants available (default, secondary, destructive, outline) (components/ui/badge.tsx)
- `Card`, `CardHeader`, `CardContent`: Already used throughout dashboard
- `Alert`, `AlertTitle`, `AlertDescription`: For warnings/notifications

**Existing Dashboard Components**:

- `SummaryMetrics` (src/components/features/dashboard/SummaryMetrics.tsx): Grid layout for metric cards
- `DashboardSummaryCard` (src/components/features/dashboard/DashboardSummaryCard.tsx): Main container with heatmap section
- `BookingsList` (src/components/features/dashboard/BookingsList.tsx): Currently shows basic booking info with "Notes available" hint
- `BookingDetailsDialog` (src/components/features/dashboard/BookingDetailsDialog.tsx): Modal with booking details, currently shows notes but not full guest context

**Layout Patterns**:

- Mobile-first responsive grids (`grid gap-4 sm:grid-cols-2 lg:grid-cols-4`)
- Section spacing with `space-y-6` or `space-y-8`
- Muted backgrounds: `bg-muted/10`, `border-border/60`

### Existing Type Definitions

**Ops Types** (src/types/ops.ts):

- `OpsTodayBooking`: Contains `details` (Record<string, unknown> | null) - already fetched but underutilized
- `OpsTodayBookingsSummary`: Main summary structure
- `OpsTodayTotals`: Current aggregations (total, confirmed, completed, etc.)

## External Resources

None required - all data sources are internal (Supabase tables).

## Constraints & Risks

### Technical Constraints

1. **Remote Supabase Only** (per AGENTS.md): All queries must target remote instance
2. **No Additional Database Migrations**: Use existing schema as-is
3. **Mobile-First**: All new UI must work on small screens first
4. **Performance**: Dashboard already loads heatmap + bookings; additional queries must be efficient

### Data Considerations

1. **Service Period Matching**: Bookings have `start_time` but no direct `service_period_id` - need time-based matching
2. **Capacity Rules Complexity**: Can vary by `day_of_week` and `effective_date` - need to resolve the correct rule
3. **Loyalty Data Availability**: Loyalty program may not be active for all restaurants (feature flag: `isLoyaltyPilotRestaurant`)
4. **Booking Versions Volume**: Could be large for busy restaurants - need pagination or time window

### UX Risks

1. **Information Overload**: Adding 4 new sections could clutter the dashboard
2. **Loading States**: Multiple new queries need proper skeleton states
3. **Error Handling**: Each query can fail independently; need graceful degradation

## Open Questions & Answers

**Q: Should capacity visualization block/warn when over capacity?**
A: Yes - use Alert component with warning/destructive variants for overbooked services.

**Q: Which loyalty tiers qualify as "VIP"?**
A: All tiers (bronze/silver/gold/platinum) should be shown with badges; "VIP" designation can be gold+ or configurable.

**Q: How far back should the booking change feed go?**
A: Today's changes only (same date as dashboard) to keep it relevant and performant.

**Q: Should guest context show in the list or only in the dialog?**
A: Both - compact indicators (badges, icons) in the list; full details in the dialog.

**Q: What guest preferences/details should be surfaced?**
A: Priority order: allergies (critical), seating preferences, dietary restrictions, loyalty tier, marketing opt-in status.

## Recommended Direction

### 1. Capacity Visualization

**Approach**:

- Extend `getTodayBookingsSummary` to include a new `periodUtilization` field
- Query service periods and capacity rules for the target date
- Group bookings by matching time windows
- Calculate utilization percentage per period
- Render as new section above or beside `SummaryMetrics`

**Component Design**:

- Horizontal bars using `Progress` component
- Color-coded: green (<80%), yellow (80-99%), red (≥100%)
- Show "Lunch: 45/50 covers (90%)" with progress bar
- Alert banner for overbooked periods

**Query Strategy**:

```typescript
// Extend getTodayBookingsSummary return type
type PeriodUtilization = {
  periodId: string;
  periodName: string;
  startTime: string;
  endTime: string;
  bookedCovers: number;
  maxCovers: number;
  utilization: number; // 0-1 or percentage
};
```

### 2. VIP Guests Module

**Approach**:

- New query: `getTodayVIPs(restaurantId, date)` in `server/ops/customers.ts`
- Join bookings with `loyalty_points` and `customer_profiles`
- Filter for today's arrivals with loyalty tier data
- Return sorted by tier (platinum → bronze)

**Component Design**:

- Compact card beside `SummaryMetrics` or as separate section
- Shows: customer name, tier badge, arrival time, party size
- Badge colors: platinum (purple), gold (yellow), silver (gray), bronze (brown)
- Optional: marketing opt-in indicator (envelope icon)

**Data Shape**:

```typescript
type VIPGuest = {
  customerId: string;
  customerName: string;
  loyaltyTier: 'platinum' | 'gold' | 'silver' | 'bronze';
  totalPoints: number;
  bookingId: string;
  startTime: string;
  partySize: number;
  marketingOptIn: boolean;
};
```

### 3. Booking Change Feed

**Approach**:

- New query: `getTodayBookingChanges(restaurantId, date)` in `server/ops/bookings.ts`
- Query `booking_versions` filtered by `changed_at` date and restaurant
- Join with bookings to get customer names
- Sort by `changed_at` DESC (most recent first)
- Limit to 20-50 recent changes

**Component Design**:

- Collapsible panel within existing heatmap section (to save vertical space)
- List items show: time, booking reference, change type, actor (if available)
- Click to expand and see diff (new_data vs old_data)
- Use `Badge` for change_type (created, updated, cancelled, status_changed)

**Data Shape**:

```typescript
type BookingChange = {
  versionId: string;
  bookingId: string;
  customerName: string;
  changeType: 'created' | 'updated' | 'cancelled' | 'status_changed';
  changedAt: string;
  changedBy: string | null;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
};
```

### 4. Richer Guest Context

**Approach**:

- Extend existing booking data with customer profile join
- Modify `getTodayBookingsSummary` to include loyalty tier and preferences
- Parse `details` JSON and `customer_profiles.preferences` for key fields
- No new queries needed - just enhance existing data

**Component Changes**:

_BookingsList_:

- Add loyalty tier badge next to customer name
- Add small icons for: allergies (warning), preferences (settings), notes (sticky note)
- Keep layout compact

_BookingDetailsDialog_:

- New section: "Guest Profile"
- Show: loyalty tier + points, allergies (highlighted), seating prefs, dietary restrictions
- Show: marketing opt-in status, total bookings history
- Use nested cards or definition lists

**Data Enhancement**:

```typescript
// Extend OpsTodayBooking type
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

## Implementation Sequence

1. **Start with #4 (Richer Guest Context)**: Lowest complexity, extends existing queries
2. **Then #1 (Capacity Visualization)**: Requires new aggregation logic but well-defined
3. **Then #2 (VIP Module)**: New query + component but straightforward
4. **Finally #3 (Change Feed)**: Most complex (diffing, versioning UX)

## Success Criteria

- FOH staff can identify overbooked services at a glance
- VIP guests are highlighted before service begins
- Managers can audit booking changes without leaving the dashboard
- Guest allergies and preferences are visible during service
- All features gracefully degrade if data is missing or features are disabled
- Mobile-responsive and accessible (keyboard navigation, screen readers)
- No performance regression on dashboard load

## Notes

- All enhancements should respect the existing feature flag system (e.g., loyalty checks `isLoyaltyPilotRestaurant`)
- Consider adding feature flags for each new enhancement to allow gradual rollout
- Existing dashboard already handles date selection and filtering - new features should integrate seamlessly
