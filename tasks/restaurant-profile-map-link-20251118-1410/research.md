---
task: restaurant-profile-map-link
timestamp_utc: 2025-11-18T14:10:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Research: Restaurant Profile Google Map Link

## Requirements

- Functional:
  - Allow restaurant owners to store a Google Maps link in Restaurant Profile alongside address/contact info.
  - Surface the stored map link in outgoing guest emails (e.g., booking confirmations) so guests can open the location.
  - Keep existing profile update flow (form + PATCH API + Supabase) working for restaurants without a map link.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Form field must meet a11y (label, focus, validation). Accepts valid URLs only; handles optional value gracefully.
  - Avoid breaking existing emails or introducing layout regressions in email templates.
  - No secrets in code; continue remote-only Supabase migrations.

## Existing Patterns & Reuse

- Restaurant profile UI uses `components/ops/restaurants/RestaurantDetailsForm` and `RestaurantProfileSection` to edit fields, backed by `useOpsRestaurantDetails` and `useOpsUpdateRestaurantDetails`.
- API contracts live in `src/app/api/ops/restaurants/schema.ts` and route handler `src/app/api/ops/restaurants/[id]/route.ts` using `updateRestaurant` in `server/restaurants/update.ts` plus select helpers in `server/restaurants/select-fields.ts`.
- Booking emails render venue info via `server/emails/bookings.ts`, depending on `VenueDetails` (`lib/venue.ts`) resolved from `restaurants` table columns.
- Recent migrations for restaurant-level flags live under `supabase/migrations/` (e.g., `20251118130000_add_email_preferences.sql`).

## External Resources

- Google Maps sharing links and `https://www.google.com/maps/search/?api=1&query=` pattern for constructing map URLs from addresses.

## Constraints & Risks

- Supabase is remote-only; schema change requires a migration file and cautious rollout (address nullable data, column backfill default null).
- Email templates are brittle HTML; changes must avoid breaking layout on mobile/email clients.
- Existing data lacks map link; need null-safe handling in services and UI to avoid runtime errors.

## Open Questions (owner, due)

- Should we auto-generate a map link from address when empty? (Default plan: optional manual field; no auto-generation for now.)

## Recommended Direction (with rationale)

- Add nullable `google_map_url` column to `restaurants` via migration (default null) to persist owner-provided link.
- Extend REST DTOs/types/services to include `googleMapUrl`, propagating through form state and validation (URL format, optional).
- Update Restaurant Profile form with a labeled input for Google Maps link (URL validation, helper text) and send the value in PATCH payloads.
- In booking emails, render a "View on Google Maps" link/button when available; otherwise continue showing address only. Keep inline styles consistent with existing patterns.
- Handle null/empty gracefully across API responses and UI to keep compatibility with restaurants that haven't set the link.
