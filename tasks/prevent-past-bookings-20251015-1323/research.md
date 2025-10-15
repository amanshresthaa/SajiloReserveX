# Research: Prevent Past Booking Creation/Modification

## Executive Summary

This document outlines existing patterns and infrastructure in the SajiloReserveX codebase to support implementing validation that prevents creating or modifying bookings with start times in the past.

## Existing Patterns & Reuse Opportunities

### 1. Booking Data Model

**Key Fields:**

- `booking_date`: String (YYYY-MM-DD format)
- `start_time`: String (HH:MM format)
- `end_time`: String (HH:MM format)
- `start_at`: ISO timestamp (stored in UTC)
- `end_at`: ISO timestamp (stored in UTC)
- `restaurant_id`: UUID reference to restaurant
- `status`: Enum (pending, pending_allocation, confirmed, cancelled, completed, no_show)

**Source Files:**

- `src/types/ops.ts` - Type definitions for ops bookings
- `types/supabase.ts` - Generated Supabase types
- `server/bookings.ts` - Booking business logic

**Key Insight:** The system already maintains both local date/time strings AND UTC timestamps, which will be essential for timezone-aware validation.

### 2. Existing Booking APIs

**Creation Endpoints:**

1. `POST /api/bookings` - Public reservation creation
   - Source: `src/app/api/bookings/route.ts`
   - Uses: zod schema validation, idempotency keys
   - Current validation: Operating hours check via `assertBookingWithinOperatingWindow`

2. `POST /api/ops/bookings` - Ops walk-in booking creation
   - Source: `src/app/api/ops/bookings/route.ts`
   - Uses: Role-based auth, different validation path
   - Current validation: Similar operating hours validation

**Update Endpoints:**

1. `PATCH /api/bookings/[id]` - Guest-initiated updates
   - Source: `src/app/api/bookings/[id]/route.ts`
   - Supports two schemas: full update + dashboard minimal update
   - Current validation: Operating hours check

2. `PATCH /api/ops/bookings/[id]` - Ops booking updates
   - Source: `src/app/api/ops/bookings/[id]/route.ts`
   - Role-based access control
   - Current validation: Operating hours check

**Reuse Opportunities:**

- All endpoints already use zod for schema validation - we can extend these schemas
- Operating hours validation pattern in `server/bookings/timeValidation.ts` provides template for our past-time validation
- Audit logging infrastructure already exists and is used consistently

### 3. Timezone Handling

**Utilities:** `lib/utils/datetime.ts`

Key functions:

- `getTodayInTimezone(timezone: string): string` - Gets current date in specific timezone
- `getDateInTimezone(date: Date, timezone: string): string` - Converts Date to YYYY-MM-DD in timezone
- `formatTimeRange(start, end, timezone)` - Formats time ranges for display
- `isoToLocalInput(iso)` / `localInputToIso(value)` - Conversion utilities

**Restaurant Timezone:**

- Stored in `restaurants` table (`timezone` field)
- Retrieved via `server/restaurants/schedule.ts` - `getRestaurantSchedule()`
- Example timezone: "America/Los_Angeles", "America/New_York"

**Reuse Opportunities:**

- Use existing timezone utilities to determine "now" in booking's location timezone
- Restaurant schedule already fetched in booking validation - can reuse same data fetch

### 4. Feature Flag Infrastructure

**Implementation:** `server/feature-flags.ts` + `lib/env.ts`

Current pattern:

```typescript
// In lib/env.ts
get featureFlags() {
  return {
    loyaltyPilotRestaurantIds: parsed.LOYALTY_PILOT_RESTAURANT_IDS,
    enableTestApi: parsed.ENABLE_TEST_API ?? false,
    guestLookupPolicy: parsed.FEATURE_GUEST_LOOKUP_POLICY ?? false,
    opsGuardV2: parsed.FEATURE_OPS_GUARD_V2 ?? false,
  }
}

// In server/feature-flags.ts
export function isLoyaltyPilotRestaurant(restaurantId: string): boolean {
  return loyaltyPilotIds.has(restaurantId);
}
```

**Reuse Strategy:**

- Add `FEATURE_BOOKING_PAST_TIME_BLOCKING` boolean env var
- Add `BOOKING_PAST_TIME_GRACE_MINUTES` config (default: 5)
- Create `server/feature-flags.ts` helper: `isBookingPastTimeBlocking()`

### 5. Role-Based Access Control

**Roles Hierarchy:** `lib/owner/auth/roles.ts`

Admin roles (can override):

- `owner`
- `manager`

Regular roles:

- `host`
- `server`

**Auth Patterns:**

- `server/auth/guards.ts` - `requireSession()`, `listUserRestaurantMemberships()`
- `server/team/access.ts` - `requireMembershipForRestaurant()`, `fetchUserMemberships()`

**Reuse Strategy:**

- Check if user role is in `RESTAURANT_ADMIN_ROLES` to allow override
- Use query parameter `?allow_past=true` for explicit override intent
- All existing auth guards can be reused as-is

### 6. Audit Logging

**Infrastructure:**

- `server/observability.ts` - `recordObservabilityEvent()`
- `server/bookings.ts` - `logAuditEvent()`, `buildBookingAuditSnapshot()`

Current usage pattern:

```typescript
await recordObservabilityEvent({
  source: 'api.bookings',
  eventType: 'booking.created',
  severity: 'info',
  context: { bookingId, restaurantId },
});

await logAuditEvent(supabase, {
  resource_type: 'booking',
  resource_id: bookingId,
  action: 'update',
  actor_id: userId,
  actor_email: userEmail,
  metadata: { previous, current, changes },
});
```

**Reuse Strategy:**

- Use `recordObservabilityEvent()` for blocked attempts
- Use `logAuditEvent()` for admin overrides with `allow_past=true`
- Add event types: `"booking.past_time.blocked"`, `"booking.past_time.override"`

### 7. Error Handling Patterns

**HTTP Error Responses:**
Current pattern uses consistent error shapes:

```typescript
return NextResponse.json(
  {
    error: 'Operating hours violation',
    code: 'OUTSIDE_OPERATING_HOURS',
    details: { message },
  },
  { status: 422 },
);
```

**Reuse Strategy:**

- Use HTTP 422 (Unprocessable Entity) for past-time validation failures
- Error code: `"BOOKING_IN_PAST"`
- Include grace period info in error details

### 8. Existing Time Validation

**Source:** `server/bookings/timeValidation.ts`

Current validation:

- `assertBookingWithinOperatingWindow(schedule, bookingDate, startTime)`
- Throws `OperatingHoursError` if booking outside restaurant hours
- Already timezone-aware

**Key Code:**

```typescript
export class OperatingHoursError extends Error {
  readonly code = 'OUTSIDE_OPERATING_HOURS' as const;
  constructor(message: string) {
    super(message);
    this.name = 'OperatingHoursError';
  }
}
```

**Reuse Strategy:**

- Create similar `PastBookingError` class
- Add new validation function: `assertBookingNotInPast()`
- Call AFTER operating hours check, BEFORE database insert/update

### 9. Client-Side Validation Patterns

**Date/Time Pickers:**

- Components likely in `reserve/features/reservations/wizard/` (based on file references)
- Use native HTML5 inputs with `min` attribute support
- React Hook Form for form state management

**Error Display:**

- Toast notifications for user feedback
- Inline validation errors
- i18n support for messages

**Reuse Strategy:**

- Add `min` attribute to date/time pickers based on current time in restaurant timezone
- Disable past time slots in time picker options
- Show friendly error message when server rejects past booking

## External Resources

### Timezone Libraries

- **date-fns-tz**: Already used in project (check package.json)
- **Intl.DateTimeFormat**: Used in existing `lib/utils/datetime.ts` utilities
- IANA timezone database names (e.g., "America/New_York")

### Relevant RFCs/Standards

- ISO 8601: Date/time format standard (already used for `start_at`/`end_at`)
- HTTP 422 Unprocessable Entity: Appropriate status code for validation failures

### Testing Libraries

- Vitest: Unit tests (`vitest.config.ts` exists)
- Playwright: E2E tests (`playwright.config.ts` exists)
- Existing test files: `src/app/api/bookings/route.test.ts`, `src/app/api/bookings/[id]/route.test.ts`

## Constraints & Risks

### Technical Constraints

1. **Clock Skew**: Client clocks may be incorrect - server must be authoritative
2. **DST Transitions**: Must handle daylight saving time boundaries correctly
3. **Leap Seconds**: Not a practical concern for 5-minute grace period
4. **Database Time**: Supabase uses UTC - must convert properly
5. **Race Conditions**: Time advances during request processing - grace period mitigates

### Business Constraints

1. **Legitimate Backfills**: Admins need override capability for data corrections
2. **Historical Data**: Existing past bookings must not break system
3. **Timezone Coverage**: Must work for all IANA timezones
4. **User Experience**: Error messages must be clear and actionable
5. **Performance**: Timezone conversions must not add significant latency

### Security Constraints

1. **Audit Trail**: All overrides must be logged with actor info
2. **Rate Limiting**: Existing rate limits apply - don't bypass
3. **Authorization**: Only admin roles can use `allow_past=true`
4. **Input Validation**: Prevent timezone injection attacks

### Performance Risks

1. **Timezone Lookups**: Restaurant schedule fetch adds ~50-100ms
   - _Mitigation_: Already fetched for operating hours check
2. **Clock API Calls**: `Date.now()` is fast (<1ms)
3. **Database Roundtrips**: No additional queries needed beyond existing

## Open Questions & Resolutions

### Q1: What exactly constitutes "past"?

**A:** `start_at` timestamp < (server current time - grace period), evaluated in restaurant's local timezone

### Q2: Can users reschedule FROM past TO future?

**A:** Yes - only the NEW `start_at` must not be in past. This allows fixing mistakes.

### Q3: Can users edit non-time fields on past bookings?

**A:** Yes - only validate time if time fields are being changed. Check if `booking_date`/`start_time` in payload differ from existing.

### Q4: What about recurring bookings?

**A:** Out of scope - no recurring booking implementation exists currently.

### Q5: Offline mobile bookings?

**A:** Client should pre-validate, server is authoritative. Sync conflicts handled by server rejection with clear error.

### Q6: DST ambiguity (e.g., 1:30 AM occurs twice)?

**A:** Use `Intl.DateTimeFormat` with explicit timezone - it handles DST correctly.

### Q7: Grace period duration?

**A:** 5 minutes (configurable via env var). Rationale:

- Network latency: ~1-2 seconds typical
- Clock skew: NTP keeps within ~100ms typically, but client clocks can drift ±1-2 min
- Processing time: <1 second for booking creation
- Safety margin: 2-3 minutes buffer

### Q8: Where to inject override check?

**A:** After auth/session check, before business validation. Order:

1. Parse request
2. Check auth/session
3. Check `allow_past=true` + admin role
4. Validate time (skip if override)
5. Business logic
6. Audit log

## Recommended Direction

### Architecture Decision: Server-Side Validation Primary

**Rationale:**

- Client clocks unreliable
- Timezone calculations complex
- Security - can't trust client
- Progressive enhancement - server catches edge cases

**Implementation:**

1. Create `server/bookings/pastTimeValidation.ts` module
2. Add validation function: `assertBookingNotInPast(restaurantSchedule, bookingDate, startTime, options)`
3. Integrate into all 4 booking API endpoints (create + update, public + ops)
4. Add feature flag guard at start of validation
5. Check admin override before throwing error
6. Log all blocks and overrides

### Client-Side: UX Enhancement Only

**Rationale:**

- Improves UX by preventing wasted requests
- Server still validates (defense in depth)
- Simpler implementation

**Implementation:**

1. Pass restaurant timezone to client components
2. Calculate "now" in that timezone
3. Disable past options in date/time pickers
4. Surface friendly error message from 422 response

### Telemetry Strategy

**Metrics to Track:**

- Counter: `booking.past_time.blocked` (dimensions: endpoint, role, timezone)
- Counter: `booking.past_time.override` (dimensions: actor_id, restaurant_id)
- Histogram: `booking.create.time_delta` (how far in future bookings are made)

**Dashboard:**

- Chart: Blocked attempts over time
- Chart: Override frequency by restaurant
- Alert: Spike in blocks (>X per minute) could indicate integration issues

### Rollout Plan

**Phase 1: Dark Launch (Flag OFF, Logging Only)**

- Deploy code with flag OFF
- Log what WOULD be blocked
- Validate no false positives
- Duration: 3-5 days

**Phase 2: Canary (Flag ON, 10% restaurants)**

- Enable for pilot restaurants
- Monitor error rates, support tickets
- Adjust grace period if needed
- Duration: 2-3 days

**Phase 3: Full Rollout**

- Enable for all restaurants
- Monitor for 48 hours
- Document any edge cases
- Update runbooks

**Phase 4: Default ON**

- Change flag default to ON
- Remove flag guard code (technical debt cleanup)
- ETA: 2-4 weeks post-rollout

## Summary

**Strengths of Existing Codebase:**

- Robust timezone handling already exists
- Audit logging infrastructure ready to use
- Role-based auth system supports overrides
- Validation patterns well-established
- Error handling consistent

**Gaps to Fill:**

- Need past-time validation logic
- Need feature flag + config
- Need telemetry hooks
- Need client UX enhancements
- Need comprehensive tests

**Estimated Complexity:**

- Backend validation: **Medium** (5-7 tickets, ~3-4 days)
- Frontend UX: **Medium** (3-4 tickets, ~2 days)
- Testing: **Medium** (QA matrix complex due to timezones)
- Observability: **Low** (infrastructure exists, just add calls)
- Documentation: **Low** (templates exist)

**Overall Risk Level:** **Medium-Low**

- Timezone bugs are primary risk
- Mitigation: Comprehensive timezone test matrix
- Fallback: Feature flag allows instant rollback
