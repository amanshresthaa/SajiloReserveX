# ESLint Fix: Remove `any` types from test mocks and server files

## Issue

Pre-commit hook failing with ESLint warnings:

```
✖ 11 problems (0 errors, 11 warnings)
Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
```

## Root Cause

Multiple files were using `any` type:

1. Test file `tests/server/ops/capacity-cache-integrations.test.ts` - SupabaseClient mocks
2. `server/observability.ts` - Type assertion
3. `server/ops/tables.ts` - PublicClient type definition
4. `server/ops/zones.ts` - PublicClient type definition

## Fix Applied

### 1. Test File (8 warnings fixed)

**Changed (4 functions):**

- `createInsertTableClient`
- `createUpdateTableClient`
- `createDeleteTableClient`
- `createZoneClient`

**Before:**

```typescript
function createInsertTableClient(result = BASE_TABLE): SupabaseClient<Database, 'public', any> {
  // ...
}
```

**After:**

```typescript
function createInsertTableClient(
  result = BASE_TABLE,
): SupabaseClient<Database, 'public', Database['public']> {
  // ...
}
```

**Additional Cleanup:**

- Removed unused `Chainable<T>` type definition
- Removed unnecessary `satisfies` assertions

### 2. Server Files (3 warnings fixed)

#### server/observability.ts

**Before:**

```typescript
await (supabase as any).from("observability_events").insert({
```

**After:**

```typescript
await supabase.from("observability_events").insert({
```

#### server/ops/tables.ts

**Before:**

```typescript
type PublicClient = SupabaseClient<Database, 'public', any>;
```

**After:**

```typescript
type PublicClient = SupabaseClient<Database>;
```

#### server/ops/zones.ts

**Before:**

```typescript
type PublicClient = SupabaseClient<Database, 'public', any>;
```

**After:**

```typescript
type PublicClient = SupabaseClient<Database>;
```

## Verification

```bash
✅ pnpm eslint tests/server/ops/capacity-cache-integrations.test.ts --fix --max-warnings=0
✅ pnpm eslint server/observability.ts server/ops/tables.ts server/ops/zones.ts --fix --max-warnings=0
```

All files now pass ESLint with 0 warnings.

## Impact

- ✅ Pre-commit hook will now pass
- ✅ Better type safety in test mocks and server code
- ✅ No runtime behavior change (all functionality continues to work)
- ✅ Cleaner code without unnecessary type assertions

## Files Changed

1. `tests/server/ops/capacity-cache-integrations.test.ts` - 8 warnings fixed
2. `server/observability.ts` - 1 warning fixed
3. `server/ops/tables.ts` - 1 warning fixed
4. `server/ops/zones.ts` - 1 warning fixed

**Total:** 11 ESLint warnings eliminated

---

_Fixed: 2025-11-14_
