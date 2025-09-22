# Database Schema Fix: booking_status Enum

## Issue
The application is failing with the error:
```
invalid input value for enum booking_status: "pending"
```

## Root Cause
The `booking_status` enum in the database is missing the `'pending'` value that the application code expects. 

The database currently has:
```sql
CREATE TYPE public.booking_status AS ENUM ('confirmed','cancelled','pending_allocation');
```

But the application code in `/server/supabase.ts` includes `"pending"` in the `BOOKING_BLOCKING_STATUSES` array:
```typescript
export const BOOKING_BLOCKING_STATUSES = [
  "pending",           // ← This is missing from the database enum
  "pending_allocation",
  "confirmed",
];
```

## Fix
Add the missing `'pending'` value to the enum by running this SQL in your Supabase SQL Editor:

```sql
ALTER TYPE public.booking_status ADD VALUE 'pending';
```

## Files Updated
1. `database/migrations/index.sql` - Updated to include 'pending' in the enum definition
2. `database/migrations/001_add_pending_status.sql` - Migration script for existing databases
3. `database/migrations/apply_enum_fix.sh` - Helper script with instructions

## Verification
After applying the fix:
1. Restart the development server: `npm run dev`
2. Test the booking API endpoint by making a reservation
3. The error should no longer occur

## Future Prevention
- Ensure database schema and application code stay in sync
- Consider using database type generation tools
- Add the booking_status enum to any type definitions or validation schemas
