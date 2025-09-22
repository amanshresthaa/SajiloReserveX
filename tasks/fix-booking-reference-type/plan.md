# Plan: Fix Booking Reference Type Error

## Goal
Fix TypeScript build error by adding missing `reference` field to `ApiBooking` type while maintaining type safety and following design principles.

## Context Summary
- Build fails due to missing `reference` property in `ApiBooking` type
- Database schema includes `reference` field
- Frontend type is incomplete compared to database schema
- Need to align frontend types with database schema

## Implementation Strategy

### Phase 1: Type Definition Update
1. **Update ApiBooking Type**
   - Location: `/components/reserve/booking-flow/state.ts`
   - Add missing `reference: string` field
   - Consider adding other missing fields for completeness
   - Maintain alphabetical/logical ordering

### Phase 2: Validation & Testing
1. **Build Verification**
   - Run `npm run build` to ensure TypeScript errors are resolved
   - Verify no new type errors introduced

2. **Component Verification**
   - Check ConfirmationStep.tsx compiles correctly
   - Verify runtime behavior unchanged

## Detailed Implementation

### File: `/components/reserve/booking-flow/state.ts`

**Current ApiBooking type** (lines 12-28):
```typescript
export type ApiBooking = {
  id: string;
  restaurant_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  party_size: number;
  booking_type: BookingType;
  seating_preference: SeatingPreference;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes: string | null;
  marketing_opt_in: boolean;
  loyalty_points_awarded: number;
  created_at: string;
  updated_at: string;
};
```

**Updated ApiBooking type** (add missing fields):
```typescript
export type ApiBooking = {
  id: string;
  restaurant_id: string;
  customer_id: string;
  table_id: string | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  reference: string;
  party_size: number;
  booking_type: BookingType;
  seating_preference: SeatingPreference;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes: string | null;
  source: string;
  marketing_opt_in: boolean;
  loyalty_points_awarded: number;
  created_at: string;
  updated_at: string;
};
```

**Rationale for field additions:**
- `reference: string` - Required for ConfirmationStep display
- `customer_id: string` - Database field, may be needed for customer operations
- `table_id: string | null` - Important for table allocation status
- `source: string` - Tracks booking origin (api, web, phone, etc.)

**Field ordering rationale:**
- Keep related fields grouped (IDs together, timestamps together)
- Maintain logical flow from identification → details → metadata

## Design Principles Adherence

### Subtle Haptics & Typography Hierarchy
- Type definition improvements support better UX by ensuring reference display works
- Clean type structure supports maintainable code

### Micro-speed Animations
- Type safety prevents runtime errors that could break smooth animations
- Reliable data structure supports consistent UI state

### Space Hierarchy
- Well-structured types support clean component architecture
- Clear separation between database and frontend concerns

## Verification Steps

1. **Type Safety Check**
   ```bash
   npm run build
   ```
   - Should compile without TypeScript errors
   - Specifically check ConfirmationStep.tsx line 67 resolves

2. **Runtime Verification**
   - Ensure `booking?.reference` access works in ConfirmationStep
   - Verify no breaking changes in other components using ApiBooking

3. **Code Quality Check**
   - Ensure type definition follows project conventions
   - Verify import statements remain correct

## Success Criteria

- [ ] `npm run build` completes successfully
- [ ] ConfirmationStep.tsx TypeScript error resolved
- [ ] No new TypeScript errors introduced
- [ ] ApiBooking type matches database schema completeness
- [ ] Code follows project design principles

## Risk Mitigation

- **Minimal Change Scope**: Only adding fields, not removing or changing existing ones
- **Backwards Compatibility**: All existing code will continue to work
- **Type Safety**: Enhanced type coverage reduces runtime errors
- **Testing**: Build verification ensures no breaking changes

## Rollback Plan

If issues arise:
1. Revert changes to `/components/reserve/booking-flow/state.ts`
2. Consider alternative approach (e.g., optional fields only)
3. Investigate if component logic needs adjustment

## Estimated Effort

- **Implementation**: 5 minutes
- **Testing**: 5 minutes  
- **Total**: 10 minutes

Low complexity change with high confidence in success.