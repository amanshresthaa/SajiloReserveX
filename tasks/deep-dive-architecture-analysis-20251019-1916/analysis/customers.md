# Customers Module (`server/customers.ts`)

## Purpose

Handles customer normalization, idempotent upsert, and profile bookkeeping for booking flows.

## Dependencies

- Supabase client (`SupabaseClient<Database>`).
- Shared normalization helpers.
- Customer profile writers (`recordBookingForCustomerProfile`, `recordCancellationForCustomerProfile`).

## Public API

- `normalizeEmail(email: string): string`
- `normalizePhone(phone: string): string`
- `findCustomerByContact(client, restaurantId, email, phone)`
- `upsertCustomer(client, params)`
- `recordBookingForCustomerProfile(client, params)`
- `recordCancellationForCustomerProfile(client, params)`

## Implementation Highlights

1. **Normalization**: Lowercases emails, strips non-digits from phone numbers, and trims values for storage.
2. **Upsert Strategy**:
   - Primary conflict target `restaurant_id,email_normalized,phone_normalized`.
   - Detects missing composite constraint (code `42P10`) and retries with fallback keys (`restaurant_id,email_normalized` and `restaurant_id,phone_normalized`).
   - Handles unique violations by fetching existing record, harmonizing phone if normalized differs.
   - Ensures marketing opt-in is sticky; backfills name when provided.
3. **Profile Stats**: Updates or inserts into `customer_profiles` tracking total bookings, covers, cancellations, marketing opt-in timestamp.

## Edge Cases

- Missing Supabase composite index gracefully handled via fallback loop.
- Marketing opt-in ensures once true always true unless manually reset.
- Phone number normalization ensures consistent lookups even with formatting differences.

## Error Handling

- Throws PostgREST errors except for handled constraint cases.
- Wraps remaining errors from profile updates and cancellations.

## Performance Notes

- Multiple sequential Supabase calls during upsert; batching or RPC could reduce latency.

## Testing Coverage

- No dedicated unit tests; behavior validated indirectly through booking API integration.
- Recommendation: add unit tests covering missing constraint fallback and marketing opt-in persistence.

## Code Example

```ts
const { data, error } = await client
  .from('customers')
  .upsert(insertPayload, { onConflict: CUSTOMER_CONFLICT_KEY, ignoreDuplicates: false })
  .select(CUSTOMER_COLUMNS)
  .maybeSingle();

if (error && isMissingConflictConstraintError(error)) {
  for (const fallbackKey of CUSTOMER_CONFLICT_FALLBACK_KEYS) {
    const retry = await client
      .from('customers')
      .upsert(insertPayload, { onConflict: fallbackKey, ignoreDuplicates: false })
      .select(CUSTOMER_COLUMNS)
      .maybeSingle();
    if (!retry.error) break;
  }
}

if (marketingOptIn && !customerData.marketing_opt_in) {
  await client
    .from('customers')
    .update({ marketing_opt_in: true, full_name: customerData.full_name ?? params.name ?? null })
    .eq('id', customerData.id);
}
```
