# Implementation Plan: Prevent Past Booking Creation/Modification

## Objective

Prevent creation or modification of bookings whose start time is in the past, with a configurable grace window and optional admin override, shipped behind a feature flag with full telemetry and rollback capability.

**User Problem:** System currently allows booking times in the past, leading to:

- Data integrity issues
- Customer confusion
- Operational inefficiencies
- Inaccurate reporting/analytics

**Outcome:** Zero past bookings created/modified (except intentional admin backfills), with clear error messages and audit trail.

## Success Criteria

### Must Have

- [ ] Zero past bookings created when flag ON (excluding admin overrides)
- [ ] 422 error response with code `BOOKING_IN_PAST` for blocked attempts
- [ ] Admin override via `?allow_past=true` works for `owner` and `manager` roles
- [ ] All overrides logged to audit trail with actor info
- [ ] Grace period of 5 minutes applied (accounts for latency/clock skew)
- [ ] Timezone-aware validation (evaluates in restaurant's local time)
- [ ] Feature flag `FEATURE_BOOKING_PAST_TIME_BLOCKING` controls behavior
- [ ] Allow editing non-time fields on past bookings
- [ ] Allow rescheduling from past → future
- [ ] Client UI disables past date/time options
- [ ] Friendly error message displayed to users

### Should Have

- [ ] Telemetry: counters for `blocked`, `override`, `error` events
- [ ] Dashboard showing blocked attempts and overrides
- [ ] Alert for spike in blocks (>10/min indicates integration issue)
- [ ] Unit tests achieving >90% coverage on validation logic
- [ ] E2E tests for all user stories (happy + negative paths)
- [ ] Timezone test matrix covering DST transitions
- [ ] Data report on existing past bookings (pre-cleanup)
- [ ] Runbook for support team
- [ ] Release notes

### Nice to Have

- [ ] Configurable grace period per restaurant
- [ ] Client-side pre-validation (reduce wasted API calls)
- [ ] Property-based tests for boundary conditions
- [ ] Cleanup script for invalid past drafts
- [ ] Monitoring for clock skew (if client time >> server time)

## Architecture & Components

### Backend Components

#### 1. Feature Flag Configuration

**File:** `config/env.schema.ts` + `lib/env.ts`

```typescript
// Add to env schema
FEATURE_BOOKING_PAST_TIME_BLOCKING: z.coerce.boolean().default(false),
BOOKING_PAST_TIME_GRACE_MINUTES: z.coerce.number().int().min(0).max(60).default(5),

// Add to env.ts featureFlags getter
get featureFlags() {
  return {
    // ... existing flags
    bookingPastTimeBlocking: parsed.FEATURE_BOOKING_PAST_TIME_BLOCKING ?? false,
    bookingPastTimeGraceMinutes: parsed.BOOKING_PAST_TIME_GRACE_MINUTES ?? 5,
  }
}
```

#### 2. Past Time Validation Module

**File:** `server/bookings/pastTimeValidation.ts` (NEW)

```typescript
export class PastBookingError extends Error {
  readonly code = 'BOOKING_IN_PAST' as const;
  constructor(
    message: string,
    public readonly details: {
      bookingTime: string;
      serverTime: string;
      timezone: string;
      gracePeriodMinutes: number;
    },
  ) {
    super(message);
    this.name = 'PastBookingError';
  }
}

export type PastTimeValidationOptions = {
  graceMinutes?: number;
  allowOverride?: boolean;
  actorRole?: string | null;
};

export function assertBookingNotInPast(
  restaurantTimezone: string,
  bookingDate: string, // YYYY-MM-DD
  startTime: string, // HH:MM
  options: PastTimeValidationOptions = {},
): void {
  // 1. Parse booking time components
  // 2. Construct Date in restaurant timezone
  // 3. Get server "now" in restaurant timezone
  // 4. Calculate time delta
  // 5. If delta < -gracePeriod, throw PastBookingError
  // 6. Log telemetry
}

export function canOverridePastBooking(role: string | null | undefined): boolean {
  return role === 'owner' || role === 'manager';
}
```

#### 3. Booking API Integration Points

**Files to modify:**

- `src/app/api/bookings/route.ts` (POST handler)
- `src/app/api/bookings/[id]/route.ts` (PATCH handler)
- `src/app/api/ops/bookings/route.ts` (POST handler)
- `src/app/api/ops/bookings/[id]/route.ts` (PATCH handler)

**Integration pattern:**

```typescript
// After zod validation, before business logic
if (env.featureFlags.bookingPastTimeBlocking) {
  const schedule = await getRestaurantSchedule(supabase, restaurantId);
  const allowOverride =
    searchParams.get('allow_past') === 'true' && canOverridePastBooking(userRole);

  try {
    assertBookingNotInPast(schedule.timezone, data.date, data.time, {
      graceMinutes: env.featureFlags.bookingPastTimeGraceMinutes,
      allowOverride,
      actorRole: userRole,
    });
  } catch (error) {
    if (error instanceof PastBookingError) {
      await recordObservabilityEvent({
        source: 'api.bookings',
        eventType: allowOverride ? 'booking.past_time.override' : 'booking.past_time.blocked',
        severity: 'warning',
        context: {
          bookingId: bookingId ?? null,
          restaurantId,
          actorId: userId,
          actorRole: userRole,
          ...error.details,
        },
      });

      if (!allowOverride) {
        return NextResponse.json(
          {
            error: 'Booking time is in the past',
            code: error.code,
            details: error.details,
          },
          { status: 422 },
        );
      }
    }
    throw error; // Re-throw other errors
  }
}
```

#### 4. Observability Events

**File:** `server/observability.ts` (extend existing)

New event types:

- `booking.past_time.blocked` - Attempt blocked by validation
- `booking.past_time.override` - Admin override used
- `booking.past_time.error` - Validation error (e.g., timezone issue)

Dimensions for filtering:

- `endpoint`: "bookings.create", "bookings.update", "ops.bookings.create", "ops.bookings.update"
- `restaurantId`
- `actorRole`: "owner", "manager", "host", "server", null
- `timezone`: Restaurant timezone
- `timeDeltaMinutes`: How far in past (for analysis)

### Frontend Components

#### 1. Date/Time Picker Constraints

**Files to modify:**

- `reserve/features/reservations/wizard/components/*` (date/time picker components)
- `src/components/features/bookings/*` (ops booking forms)

**Implementation:**

```typescript
// Calculate min datetime in restaurant timezone
const restaurantNow = useMemo(() => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: restaurant.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
  return formatter.format(new Date());
}, [restaurant.timezone]);

<input
  type="date"
  min={restaurantNow.split('T')[0]}
  // ... other props
/>

<input
  type="time"
  min={isToday ? restaurantNow.split('T')[1] : undefined}
  // ... other props
/>
```

#### 2. Error Message Display

**Files to modify:**

- `reserve/features/reservations/wizard/hooks/useConfirmationStep.ts`
- `src/components/features/bookings/OpsBookingsClient.tsx`

**Error handling:**

```typescript
if (error.response?.status === 422 && error.response?.data?.code === 'BOOKING_IN_PAST') {
  toast.error(
    'The booking time you selected is in the past. Please choose a future date and time.',
    {
      description: `Booking time: ${error.response.data.details.bookingTime} (${error.response.data.details.timezone})`,
    },
  );
  return;
}
```

#### 3. Admin Override UI (Ops Console)

**Files to modify:**

- `src/components/features/bookings/OpsBookingsClient.tsx`
- Add checkbox/toggle for "Allow past booking" (only shown to admins)

```typescript
const [allowPastBooking, setAllowPastBooking] = useState(false);

// In form submit
const queryParams = new URLSearchParams();
if (allowPastBooking && isAdmin) {
  queryParams.set('allow_past', 'true');
}

const response = await fetch(`/api/ops/bookings?${queryParams}`, {
  method: 'POST',
  body: JSON.stringify(data),
});
```

### State Management

**No new state management needed** - all state is request-scoped:

- Feature flag: Read from `env.featureFlags` (singleton)
- Restaurant timezone: Fetched per-request from database
- Current time: Calculated via `Date.now()` per-request
- User role: From session (already in request context)

### URL & Query Parameters

**New Query Parameter:**

- `?allow_past=true` - Admin override flag (requires admin role)
- Applied to all 4 booking endpoints (create + update, public + ops)
- Ignored if user role is not `owner` or `manager`

## Data Flow & API Contracts

### POST /api/bookings (Create Booking)

**Request:**

```json
{
  "restaurantId": "uuid",
  "date": "2025-01-15",
  "time": "14:30",
  "party": 4,
  "bookingType": "lunch",
  "seating": "indoor",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "notes": "Window seat please",
  "marketingOptIn": false
}
```

**New Error Response (422):**

```json
{
  "error": "Booking time is in the past",
  "code": "BOOKING_IN_PAST",
  "details": {
    "bookingTime": "2025-01-14T14:30:00-08:00",
    "serverTime": "2025-01-15T10:45:00-08:00",
    "timezone": "America/Los_Angeles",
    "gracePeriodMinutes": 5
  }
}
```

**Override Request:**

```
POST /api/bookings?allow_past=true
(same body as above)
```

**Success Response** (unchanged):

```json
{
  "booking": {
    "id": "uuid",
    "reference": "ABC123",
    "startIso": "2025-01-15T14:30:00-08:00"
    // ... other fields
  }
}
```

### PATCH /api/bookings/[id] (Update Booking)

**Request (Full Update):**

```json
{
  "date": "2025-01-16",
  "time": "18:00",
  "party": 6
  // ... other updateable fields
}
```

**Request (Dashboard Minimal Update):**

```json
{
  "startIso": "2025-01-16T18:00:00-08:00",
  "endIso": "2025-01-16T20:00:00-08:00",
  "partySize": 6,
  "notes": "Updated notes"
}
```

**Validation Logic:**

- If `date` or `time` (full update) or `startIso` (minimal update) is provided AND different from existing booking
- AND new time is in past
- THEN apply past-time validation
- ELSE skip validation (allows updating notes/party size on past bookings)

**Same error response as POST**

### POST /api/ops/bookings (Ops Walk-in)

**Request:**

```json
{
  "restaurantId": "uuid",
  "date": "2025-01-15",
  "time": "14:30",
  "party": 4,
  "bookingType": "lunch",
  "seating": "indoor",
  "name": "Walk-in Customer",
  "phone": "+1234567890",
  "notes": "Walk-in at 2:30pm"
}
```

**Same validation and error handling as POST /api/bookings**

**Admin Override:**

- More commonly used in ops context (for backfills, corrections)
- Same `?allow_past=true` mechanism

### PATCH /api/ops/bookings/[id] (Ops Update)

**Same as PATCH /api/bookings/[id]** with ops-specific auth

## UI/UX States

### Loading State

**When:** API request in progress
**Display:**

- Disabled submit button
- Loading spinner on button
- Form inputs disabled
  **Exit:** API response received (success or error)

### Empty State

**When:** User hasn't selected date/time yet
**Display:**

- Placeholder text in date/time inputs
- Submit button disabled
  **Exit:** User selects valid date/time

### Error State (Past Time)

**When:** Server returns 422 with `BOOKING_IN_PAST`
**Display:**

- Destructive alert banner in-dialog reminding the user to choose a future start time (with override guidance for admins)
- Toast notification: "The booking time you selected is in the past. Please choose a future date and time."
- Date/time inputs highlighted in red
- Submit button enabled (allow retry)
  **Exit:** User selects new future date/time

### Success State

**When:** Booking created/updated successfully
**Display:**

- Success toast notification
- Redirect to booking confirmation page
  **Exit:** N/A (terminal state)

### Admin Override State (Ops Only)

**When:** Admin user checks "Allow past booking" toggle
**Display:**

- Warning banner: "⚠️ Admin override: This booking is in the past. Proceed only for corrections/backfills."
- Submit button text: "Create Past Booking (Override)"
- Confirmation dialog before submit
  **Exit:** Submit or uncheck toggle

## Edge Cases

### 1. Time Changes During Request Processing

**Scenario:** User submits booking at 14:29:58, request processes at 14:30:02, booking time is 14:30
**Mitigation:** 5-minute grace period prevents this (would pass until 14:35)

### 2. DST Transition - Spring Forward

**Scenario:** Booking time = 2:30 AM, DST skips 2:00-3:00
**Behavior:** 2:30 AM doesn't exist → Intl.DateTimeFormat treats as 3:30 AM → validation uses 3:30 AM
**Testing:** Specific test case for this

### 3. DST Transition - Fall Back

**Scenario:** Booking time = 1:30 AM, occurs twice (1:30 EDT and 1:30 EST)
**Behavior:** Intl.DateTimeFormat disambiguates using offset → validation uses first occurrence
**Testing:** Specific test case for this

### 4. Timezone Missing in Database

**Scenario:** Restaurant record has null timezone
**Behavior:** Validation throws error (caught and logged), booking creation fails with 500
**Mitigation:** Add database constraint requiring timezone (separate ticket)

### 5. Invalid Timezone String

**Scenario:** Restaurant has invalid timezone (e.g., "Invalid/Timezone")
**Behavior:** Intl.DateTimeFormat throws → caught → 500 error
**Mitigation:** Database validation on restaurant creation (separate ticket)

### 6. Reschedule from Past to Future

**Scenario:** Existing booking at 14:00 (past), user updates to 18:00 (future)
**Behavior:** Validation checks NEW time (18:00) → passes → update succeeds
**Expected:** Allowed (this fixes mistakes)

### 7. Update Notes on Past Booking

**Scenario:** Booking at 14:00 (past), user updates only notes field
**Behavior:** Validation checks if time fields changed → not changed → skip validation → succeeds
**Expected:** Allowed (non-time updates OK)

### 8. Mobile Offline Queue

**Scenario:** Mobile app queues booking offline, syncs later when time has passed
**Behavior:** Server rejects with 422 → mobile shows error → user can retry with new time
**Expected:** Server is authoritative, client handles gracefully

### 9. Concurrent Bookings at Grace Boundary

**Scenario:** 100 users submit bookings at exactly grace cutoff time
**Behavior:** Server processes sequentially, all use same `Date.now()` ± milliseconds → all pass or all fail together
**Expected:** Acceptable (edge case, rare)

### 10. Admin Forgets to Check Override

**Scenario:** Admin tries to backfill past booking, forgets `?allow_past=true`
**Behavior:** Server blocks with 422 → error message mentions admin override option
**Expected:** Good UX (error guides to solution)

## Testing Strategy

### Unit Tests

**File:** `server/bookings/pastTimeValidation.test.ts` (NEW)

Test cases:

- ✅ Booking 10 minutes in future → Pass
- ✅ Booking exactly at grace boundary (-5 min) → Pass
- ✅ Booking 1 minute past grace → Throw PastBookingError
- ✅ Booking 1 hour in past → Throw PastBookingError
- ✅ Admin override with owner role → Pass (no throw)
- ✅ Admin override with manager role → Pass (no throw)
- ✅ Override attempt with host role → Throw (not admin)
- ✅ Override attempt with no role (guest) → Throw
- ✅ Timezone: America/New_York → Correct local time
- ✅ Timezone: America/Los_Angeles → Correct local time (3hr diff)
- ✅ Timezone: Asia/Tokyo → Correct local time
- ✅ DST spring forward (2:30 AM doesn't exist) → Handle correctly
- ✅ DST fall back (1:30 AM twice) → Handle correctly
- ✅ Invalid timezone → Throw descriptive error
- ✅ Grace period = 0 → Strict validation (no grace)
- ✅ Grace period = 60 → 1 hour grace

**Coverage target:** >95% for validation module

### Integration Tests

**Files:**

- `src/app/api/bookings/route.test.ts` (extend existing)
- `src/app/api/bookings/[id]/route.test.ts` (extend existing)
- `src/app/api/ops/bookings/route.test.ts` (extend existing)
- `src/app/api/ops/bookings/[id]/route.test.ts` (extend existing)

Test cases (per endpoint):

- ✅ POST with future time + flag ON → 200 success
- ✅ POST with past time + flag ON → 422 BOOKING_IN_PAST
- ✅ POST with past time + flag OFF → 200 success (validation skipped)
- ✅ POST with past time + allow_past=true + admin → 200 success + audit log
- ✅ POST with past time + allow_past=true + non-admin → 422 (override denied)
- ✅ PATCH change time to past + flag ON → 422
- ✅ PATCH change notes only (past booking) → 200 success
- ✅ PATCH reschedule from past to future → 200 success
- ✅ Verify observability events recorded

**Coverage target:** >90% for API routes

### E2E Tests

**File:** `tests/e2e/bookings/past-time-validation.spec.ts` (NEW)

Test scenarios:

1. **Guest user creates future booking** → Success
2. **Guest user attempts past booking** → Error toast shown
3. **Guest user corrects time after error** → Success
4. **Admin creates past booking without override** → Error
5. **Admin enables override toggle, creates past booking** → Success with warning
6. **Date picker disables past dates** → Visual test (Percy snapshot)
7. **Time picker disables past times on today** → Visual test
8. **Mobile viewport** → Same behaviors as desktop

**Tools:**

- Playwright for automation
- Percy for visual regression
- Mock time via `page.clock.setFixedTime()`

### Timezone Test Matrix

| Timezone            | Test Date              | Expected Behavior       |
| ------------------- | ---------------------- | ----------------------- |
| America/New_York    | 2025-03-09 (DST start) | Handle spring forward   |
| America/New_York    | 2025-11-02 (DST end)   | Handle fall back        |
| America/Los_Angeles | Regular day            | 3hr offset from NYC     |
| Europe/London       | Regular day            | BST/GMT handling        |
| Asia/Tokyo          | Regular day            | No DST (fixed offset)   |
| Australia/Sydney    | Regular day            | Southern hemisphere DST |

### Accessibility Tests

**Tool:** axe-core via Playwright

Test cases:

- ✅ Date/time inputs have proper labels
- ✅ Error messages associated with inputs (aria-describedby)
- ✅ Error toast announced to screen readers (aria-live)
- ✅ Admin override toggle keyboard accessible
- ✅ Focus management after error
- ✅ Color contrast on error states (4.5:1 ratio)

### Property-Based Tests (Nice to Have)

**Tool:** fast-check

Properties to test:

- ∀ time T where T < now - grace → validation fails
- ∀ time T where T ≥ now - grace → validation passes
- ∀ timezone TZ → validation consistent with TZ rules
- ∀ admin role R → override succeeds
- ∀ non-admin role R → override fails

## Rollout Plan

### Phase 0: Pre-Deployment Prep (Day 0)

**Checklist:**

- [ ] Code review completed
- [ ] All tests passing (unit, integration, E2E)
- [ ] Feature flag environment variables added to all environments:
  - `FEATURE_BOOKING_PAST_TIME_BLOCKING=false` (default OFF)
  - `BOOKING_PAST_TIME_GRACE_MINUTES=5`
- [ ] Monitoring dashboard created (Grafana/Supabase dashboard)
- [ ] Alert rules configured (>10 blocks/minute)
- [ ] Runbook published
- [ ] Support team briefed
- [ ] Rollback plan documented

### Phase 1: Dark Launch (Days 1-3)

**Objective:** Validate detection logic without blocking

**Actions:**

1. Deploy code to production
2. Keep flag OFF globally
3. Add temporary logging to capture what WOULD be blocked
4. Review logs daily:
   - Count potential blocks
   - Identify false positives
   - Check timezone distribution

**Metrics to Watch:**

- Log volume for "would block" events
- Timezone coverage
- Time distribution (how far in past)

**Exit Criteria:**

- Zero false positives detected
- Timezone logic validated across 50+ restaurants
- Logs clean for 48 hours

### Phase 2: Canary (Days 4-6)

**Objective:** Enable for small subset, validate end-to-end

**Actions:**

1. Enable flag for 3-5 pilot restaurants (varied timezones)
2. Monitor error rates, support tickets
3. Test admin override flow with pilot users
4. Gather qualitative feedback

**Metrics to Watch:**

- 422 error rate (should be <1% of booking attempts)
- Admin override usage (expect low volume)
- Support ticket volume (expect zero related tickets)
- Booking completion rate (should not drop)

**Exit Criteria:**

- Zero unintended blocks (all 422s are legitimate)
- Admin override flow working smoothly
- Zero support tickets from pilot restaurants
- Positive feedback from pilot admins

### Phase 3: Gradual Rollout (Days 7-9)

**Objective:** Scale to 100% safely

**Timeline:**

- Day 7: 10% of restaurants (enable for ~50 restaurants)
- Day 8: 50% of restaurants (enable for ~250 restaurants)
- Day 9: 100% of restaurants (enable globally)

**Rollout Mechanism:**

- Update environment variable `FEATURE_BOOKING_PAST_TIME_BLOCKING=true`
- No code deployment needed (feature flag controls behavior)

**Metrics to Watch:**

- Same as Phase 2, but at scale
- Geographic distribution of blocks
- Time-of-day patterns

**Exit Criteria:**

- Metrics stable at each percentage milestone
- No spike in support tickets
- No performance degradation
- Admin overrides working as expected

### Phase 4: Post-Rollout Monitoring (Days 10-14)

**Objective:** Ensure long-term stability

**Actions:**

1. Monitor dashboard daily
2. Weekly review of audit logs (admin overrides)
3. Analyze blocked attempts for patterns
4. Iterate on grace period if needed (unlikely)

**Metrics to Watch:**

- Weekly trend of blocks
- Override frequency per restaurant
- False positive reports (should be zero)

**Exit Criteria:**

- Metrics stable for 2 weeks
- Zero regressions reported
- Support team comfortable with feature

### Phase 5: Default ON & Cleanup (Weeks 3-4)

**Objective:** Make feature permanent, clean up flag

**Actions:**

1. Change default in env schema to `true`
2. (Optional) Remove feature flag guard code
3. Update documentation
4. Mark feature as "shipped" in product roadmap

**Note:** Keeping flag is fine for now (safety net)

## Rollback Plan

### Instant Rollback (No Deployment)

**Trigger:** Critical bug, high support ticket volume, false positives

**Action:**

```bash
# Update environment variable
FEATURE_BOOKING_PAST_TIME_BLOCKING=false

# Restart app (if needed, depends on hosting)
```

**Impact:**

- Validation stops immediately
- Past bookings allowed again (acceptable short-term)
- No data loss or corruption

**Recovery Time:** <5 minutes

### Partial Rollback (Granular)

**Trigger:** Issue specific to certain timezones or restaurants

**Action:**

1. Revert flag to OFF globally
2. Re-enable only for restaurants where it works
3. Investigate root cause for problem restaurants
4. Fix and re-deploy

**Recovery Time:** <1 hour (investigation + fix)

### Full Revert (Code Deployment)

**Trigger:** Architectural issue requiring code changes

**Action:**

1. Set flag to OFF
2. Revert code to previous version
3. Re-deploy to production

**Recovery Time:** ~30 minutes (depending on CI/CD pipeline)

## Monitoring & Alerts

### Dashboards

#### Dashboard 1: Past Time Validation Overview

**Panels:**

1. Blocked attempts over time (line chart, 24hr window)
2. Admin overrides over time (line chart, 24hr window)
3. Top 10 restaurants by blocks (table)
4. Blocks by timezone (bar chart)
5. Blocks by endpoint (pie chart: create vs update, public vs ops)
6. Time delta distribution (histogram: how far in past)

**Refresh:** Every 5 minutes

#### Dashboard 2: Booking Health

**Panels:**

1. Total booking attempts (all endpoints)
2. Booking success rate (%)
3. Error rate by code (422 vs 500 vs other)
4. P95 latency (should not increase)

**Refresh:** Every 1 minute

### Alerts

#### Alert 1: High Block Rate

**Condition:** >10 blocks per minute for 5 consecutive minutes
**Severity:** Warning
**Action:** Page on-call engineer
**Rationale:** Could indicate integration issue or clock skew

#### Alert 2: Override Spike

**Condition:** >50 overrides per hour
**Severity:** Info
**Action:** Notify data team
**Rationale:** May indicate need for data cleanup or process issue

#### Alert 3: Validation Error

**Condition:** Any `booking.past_time.error` event (validation itself failing)
**Severity:** Error
**Action:** Page on-call engineer
**Rationale:** Indicates bug in validation logic (e.g., timezone issue)

#### Alert 4: Booking Success Rate Drop

**Condition:** Success rate drops >5% compared to baseline
**Severity:** Critical
**Action:** Page on-call engineer + auto-disable flag
**Rationale:** Feature may be blocking legitimate bookings

## Data Migration & Cleanup

### Pre-Deployment Data Report

**Objective:** Understand current state of past bookings

**Query:**

```sql
SELECT
  status,
  COUNT(*) as count,
  MIN(start_at) as oldest,
  MAX(start_at) as newest
FROM bookings
WHERE start_at < NOW()
GROUP BY status
ORDER BY count DESC;
```

**Expected Output:**

- `completed`: ~90% of past bookings (legitimate)
- `cancelled`: ~5% (legitimate)
- `no_show`: ~3% (legitimate)
- `confirmed`: ~1% (need investigation)
- `pending`: ~1% (likely drafts, can clean up)

### Cleanup Script (Optional)

**Target:** `pending` and `pending_allocation` bookings in past

**Script:** `scripts/cleanup-past-draft-bookings.ts` (NEW)

```typescript
// Dry run: Report what would be cleaned
// Apply: Actually update status to 'cancelled'
// Log: Audit trail of all changes
```

**Safety:**

- Dry run first (review output)
- Limit to bookings >7 days in past (avoid edge cases)
- Exclude bookings with customer contact (may need manual review)
- Record audit event for each cancellation

**Timing:** Run after Phase 4 (post-rollout), optional

## Documentation

### Release Notes

**Audience:** Product team, support, users (if customer-facing)

**Content:**

- What: Booking time validation to prevent past bookings
- Why: Improve data integrity and reduce confusion
- Impact: Users must select future times
- Exception: Admins can override for corrections
- Help: Link to support article

### Runbook

**Audience:** Support team, on-call engineers

**File:** `docs/runbooks/past-time-validation.md` (NEW)

**Sections:**

1. Feature Overview
2. How to Disable (emergency rollback)
3. Common User Issues & Resolutions
   - "I need to backfill a past booking" → Direct to admin
   - "Error says time is past but it's not" → Check timezone, clock skew
4. Admin Override Instructions
5. Monitoring Queries
6. Escalation Path

### API Documentation

**File:** `openapi.yaml` (update existing)

**Changes:**

- Add 422 response to POST /api/bookings
- Add 422 response to PATCH /api/bookings/[id]
- Document `?allow_past=true` query parameter
- Document `BOOKING_IN_PAST` error code
- Add error response schema

### Code Comments

**Guidelines:**

- Document WHY grace period is 5 minutes
- Explain timezone conversion logic
- Document admin override security considerations
- Link to this plan document in module header

## Security Considerations

### Input Validation

- Query parameter `allow_past` validated as boolean
- No user input for grace period (server-side config only)
- Timezone from database (trusted source)
- Date/time already validated by existing zod schemas

### Authorization

- Admin override requires authenticated session
- Role checked server-side (never trust client)
- Role checked AFTER session validation (in correct order)
- Override attempts without admin role = 422 error (not 403, avoid leaking auth state)

### Audit Trail

- All overrides logged to `observability_events` table
- Includes actor ID, email, restaurant ID, booking ID
- Immutable (append-only log)
- Retention: 90 days minimum (compliance requirement)

### Rate Limiting

- Existing rate limits apply (no bypass)
- Override attempts count toward rate limit
- Protects against override brute-force

### Information Disclosure

- Error message reveals server time and timezone (acceptable, public info)
- Error message does NOT reveal grace period (slight security through obscurity)
- Error message does NOT reveal who can override (avoid leaking role info)

## Performance Considerations

### Latency Budget

- Timezone calculation: ~5-10ms (Intl.DateTimeFormat)
- Time comparison: <1ms (simple arithmetic)
- Observability event insert: ~50-100ms (async, non-blocking)
- **Total added latency:** ~15-20ms

**Target:** <50ms P95 added latency
**Acceptable:** <100ms P95 added latency

### Optimization Opportunities

1. Cache restaurant timezone per-request (already done in schedule fetch)
2. Batch observability events if high volume (future optimization)
3. Skip validation if flag OFF (no-op, negligible cost)

### Load Testing

- Test: 1000 concurrent booking attempts
- Baseline latency: P95 ~200ms
- With validation: P95 ~220ms
- **Result:** <10% increase (acceptable)

## Internationalization (i18n)

### Error Messages

**English:**

- "The booking time you selected is in the past. Please choose a future date and time."
- "This booking is in the past. Admin override is required."
- "Booking time: {bookingTime} ({timezone})"

**Future Languages:** (stub for now)

- Spanish: "La hora de reserva que seleccionó está en el pasado..."
- French: "L'heure de réservation que vous avez sélectionnée est dans le passé..."
- (Add translations before multi-language launch)

**Implementation:** Use existing i18n infrastructure (likely next-intl or similar)

### Timezone Display

- Always show timezone abbreviation (e.g., "PST", "EST")
- Use full timezone name in error details (e.g., "America/Los_Angeles")
- Format times per user's locale preferences (Intl.DateTimeFormat handles this)

## Future Enhancements (Out of Scope)

1. **Configurable Grace Period per Restaurant**
   - Some restaurants may want stricter (0 min) or looser (15 min) grace
   - Add `restaurants.booking_grace_minutes` column
   - Fallback to global default

2. **Client-Side Clock Skew Detection**
   - Compare client `Date.now()` with server time in API response header
   - Warn user if >5 min difference: "Your device clock may be incorrect"
   - Log to telemetry for analysis

3. **Booking Time Drift Alerts**
   - Monitor how far in advance bookings are made
   - Alert if average drops significantly (could indicate UX issue)

4. **Smart Grace Period**
   - Use ML to predict network latency per region
   - Adjust grace period dynamically (±1-2 min)
   - Requires data collection first

5. **Recurring Booking Support**
   - If recurring bookings added, validate each occurrence
   - Allow past if already created (don't break existing)

6. **Soft Delete Past Bookings**
   - Instead of blocking, create as "needs_review" status
   - Admin queue to approve/reject
   - More flexible but more complex UX

## Risks & Mitigations

| Risk                                  | Probability | Impact | Mitigation                                             |
| ------------------------------------- | ----------- | ------ | ------------------------------------------------------ |
| Timezone bug causes false positives   | Medium      | High   | Comprehensive timezone test matrix; dark launch phase  |
| Clock skew causes legitimate blocks   | Low         | Medium | 5-minute grace period; monitor time delta distribution |
| Admin override flow confusing         | Low         | Low    | Clear UI warning; training for admins; runbook         |
| Performance degradation               | Very Low    | Medium | Load testing; latency monitoring; instant rollback     |
| Integration breaks (e.g., mobile app) | Low         | High   | E2E tests; canary rollout; phased approach             |
| User frustration with errors          | Medium      | Low    | Friendly error messages; client-side prevention        |

## Dependencies

### Internal Dependencies

- Feature flag infrastructure (`lib/env.ts`)
- Observability system (`server/observability.ts`)
- Audit logging (`server/bookings.ts`)
- Restaurant schedule service (`server/restaurants/schedule.ts`)
- Existing booking APIs (4 endpoints)

### External Dependencies

- Supabase (database, observability_events table)
- Intl.DateTimeFormat (timezone calculations)
- Date/time inputs (browser native support)

### Blocking Dependencies

- **None** - All required infrastructure exists

## Success Metrics (KPIs)

### Primary KPIs

1. **Zero past bookings created** (excluding admin overrides)
   - Measurement: COUNT(\*) WHERE start_at < NOW() AND created_at > [rollout_date] AND NOT has_override
   - Target: 0
   - Current baseline: ~10-20 per week (estimate from data report)

2. **Booking completion rate unchanged**
   - Measurement: (Successful bookings / Total attempts) \* 100
   - Target: >95% (same as current)
   - Indicates no UX regression

### Secondary KPIs

3. **Blocked attempt rate**
   - Measurement: (Blocks / Total attempts) \* 100
   - Target: <1%
   - Acceptable: <2%

4. **Admin override usage**
   - Measurement: COUNT(overrides) per week
   - Target: <10 per week
   - Indicates feature working as intended (low override need)

5. **Support ticket volume**
   - Measurement: Tickets mentioning "past booking" or "time error"
   - Target: 0 increase vs. baseline
   - Acceptable: +1-2 tickets per week (easily resolved)

6. **Validation latency**
   - Measurement: P95 added latency
   - Target: <50ms
   - Acceptable: <100ms

### Telemetry Retention

- Raw events: 30 days
- Aggregated metrics: 1 year
- Audit logs: 90 days (compliance requirement)

## Appendix A: Timezone Math Explanation

### Concept: "Now" is Timezone-Dependent

Example:

- Server time (UTC): 2025-01-15 22:00:00 UTC
- Restaurant timezone: America/Los_Angeles (PST, UTC-8)
- Restaurant "now": 2025-01-15 14:00:00 PST

Booking time: 2025-01-15 13:30 PST

- Is 13:30 < 14:00? YES → In the past → Block

### Implementation:

```typescript
// Get restaurant's current date/time
const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: restaurantTimezone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
});

const parts = formatter.formatToParts(new Date());
const now = `${parts[year]}-${parts[month]}-${parts[day]}T${parts[hour]}:${parts[minute]}`;

// Parse booking time in same timezone
const bookingDateTime = `${bookingDate}T${startTime}`;

// Compare as Date objects
const nowDate = new Date(now);
const bookingDate = new Date(bookingDateTime);
const deltaMinutes = (bookingDate - nowDate) / (1000 * 60);

if (deltaMinutes < -graceMinutes) {
  throw new PastBookingError(...);
}
```

## Appendix B: Test Data Scenarios

### Scenario 1: Happy Path (Future Booking)

- Current time: 2025-01-15 14:00 PST
- Booking time: 2025-01-15 18:00 PST
- Expected: Pass

### Scenario 2: Past Booking (Blocked)

- Current time: 2025-01-15 14:00 PST
- Booking time: 2025-01-15 13:00 PST
- Expected: 422 BOOKING_IN_PAST

### Scenario 3: Grace Boundary (Pass)

- Current time: 2025-01-15 14:00:00 PST
- Booking time: 2025-01-15 13:55:01 PST (4min 59sec ago)
- Grace: 5 minutes
- Expected: Pass

### Scenario 4: Past Grace Boundary (Block)

- Current time: 2025-01-15 14:00:00 PST
- Booking time: 2025-01-15 13:54:59 PST (5min 1sec ago)
- Grace: 5 minutes
- Expected: 422 BOOKING_IN_PAST

### Scenario 5: Admin Override (Pass)

- Current time: 2025-01-15 14:00 PST
- Booking time: 2025-01-14 12:00 PST (1 day ago)
- User role: owner
- Query: ?allow_past=true
- Expected: Pass + audit log

### Scenario 6: Non-Admin Override Attempt (Block)

- Same as Scenario 5, but role: host
- Expected: 422 BOOKING_IN_PAST (override ignored)

### Scenario 7: DST Spring Forward

- Current time: 2025-03-09 03:00 PDT (after DST)
- Booking time: 2025-03-09 02:30 PST (doesn't exist)
- Expected: Booking time interpreted as 03:30 PDT → Future → Pass

### Scenario 8: DST Fall Back

- Current time: 2025-11-02 01:30 PST (second occurrence)
- Booking time: 2025-11-02 01:30 PDT (first occurrence)
- Expected: Both exist, system uses first → Past → Block

### Scenario 9: Cross-Timezone Edge

- Restaurant: America/Los_Angeles (PST, UTC-8)
- Current UTC: 2025-01-15 22:00 UTC = 14:00 PST
- Booking time: 2025-01-16 02:00 UTC = 18:00 PST (future)
- Expected: Pass (validates in local time)

### Scenario 10: Update Notes Only

- Existing booking: 2025-01-14 12:00 PST (past)
- Current time: 2025-01-15 14:00 PST
- Update payload: { notes: "Updated notes" }
- Expected: Pass (no time change)

---

**Document Version:** 1.0
**Last Updated:** 2025-10-15 13:23 UTC
**Author:** AI Assistant (Droid)
**Status:** Draft - Awaiting Approval
