# Research: Fix Booking Reference Type Error

## Problem
TypeScript build error: `Property 'reference' does not exist on type 'ApiBooking'` in `ConfirmationStep.tsx` line 67.

## Root Cause Analysis

1. **Database Schema**: The `bookings` table has a `reference` field as confirmed in `/types/supabase.ts`:
   ```ts
   reference: string;
   ```

2. **Server Type**: The `BookingRecord` type from `/server/bookings.ts` correctly includes the `reference` field since it's an alias for the Supabase `Tables<"bookings">` type.

3. **Frontend Type Gap**: The `ApiBooking` type in `/components/reserve/booking-flow/state.ts` is missing the `reference` property that exists in the database schema.

## Existing Patterns

### Current ApiBooking Type Structure
Located in `/components/reserve/booking-flow/state.ts`:
- Includes most booking fields
- Missing: `reference`, `table_id`, `customer_id`
- Purpose: Frontend state management for booking flow

### Database BookingRecord Type
Located in `/server/bookings.ts`:
- Alias for `Tables<"bookings">` from Supabase
- Includes all fields including `reference`
- Purpose: Server-side database operations

### Current Usage in ConfirmationStep
The component attempts to access `booking?.reference` but the type doesn't include it, causing the TypeScript error.

## Design Principle Alignment

Following the agents.md principles:
- **Type Safety**: Ensure frontend types match database schema
- **Single Source of Truth**: Derive types from authoritative schema
- **Clean Code**: Keep types consistent and well-documented

## Resolution Strategy

**Option 1: Add missing fields to ApiBooking** (Recommended)
- Add `reference`, `table_id`, `customer_id` to match database schema
- Maintains type safety
- Minimal code changes

**Option 2: Create new BookingWithReference type**
- More complex, creates type proliferation
- Not recommended for single missing field

**Option 3: Use BookingRecord directly**
- Would require importing server types in frontend
- Violates separation of concerns

## Implementation Plan

1. Update `ApiBooking` type to include missing `reference` field
2. Consider adding other missing fields for completeness (`table_id`, `customer_id`)
3. Verify no breaking changes in components using this type
4. Test build and runtime behavior

## Files to Modify

1. `/components/reserve/booking-flow/state.ts` - Add `reference` field to `ApiBooking` type
2. Verify: `/components/reserve/steps/ConfirmationStep.tsx` - Should compile after fix

## Risk Assessment

- **Low Risk**: Adding fields to type is non-breaking
- **Backwards Compatible**: Optional fields won't break existing code
- **Type Safety**: Improves type coverage and prevents runtime errors