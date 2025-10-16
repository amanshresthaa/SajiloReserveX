# Research: Fix Test Email Booking Record

## Existing Patterns & Reuse

- `BookingRecord` type in `server/bookings.ts` maps to the Supabase `bookings` row, so any mock should include the full set of fields.
- `types/supabase.ts` shows confirmation token fields (`confirmation_token*`) and `auth_user_id` now required on row reads.

## External Resources

- Supabase generated types (`types/supabase.ts`) – authoritative source of column types and nullability.

## Constraints & Risks

- Mock data must stay aligned with schema changes to avoid repeated type breaks.
- Avoid fabricating values that could mislead downstream email rendering (e.g., ensure tokens can be null like production data).

## Open Questions (and answers if resolved)

- Q: Can confirmation-related fields safely be null in a confirmed booking mock?
  A: Yes, Supabase row type allows `null`; production confirmed bookings set these null after use.

## Recommended Direction (with rationale)

- Extend the mock booking object in `src/app/api/test-email/route.ts` to include the new fields (`auth_user_id`, `confirmation_token`, `confirmation_token_expires_at`, `confirmation_token_used_at`) with representative null values so the object satisfies `BookingRecord` while reflecting typical confirmed booking state.
