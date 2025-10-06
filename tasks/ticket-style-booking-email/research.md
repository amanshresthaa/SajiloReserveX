# Research: Ticket-style booking email template

## Current implementation

- Email logic lives in `server/emails/bookings.ts`; `dispatchEmail` builds HTML/text using inline-styled markup.
- Template pulls venue defaults from `lib/venue.ts` (`DEFAULT_VENUE` contains name, address, phone, email, policy, timezone).
- Booking timing uses helper functions from `@reserve/shared/formatting/booking` and `@reserve/shared/time`.
- A basic summary includes guest name, date, time range, party size, and venue name; contact section repeats address/phone/email; CTA links to `/reserve?view=manage&...`.

## Gaps vs new request

- Copy is generic; doesn’t include rich booking metadata (e.g., booking type, seating preference, confirmation number emphasized, special notes).
- Visual style is generic card. Requirement: “new design like how ticket works” → implies layout resembling ticket/pass with prominent booking summary, tear-line, icons, etc.
- Email should cover “all the details of the booking + restaurant details.” Need to extend template to surface reference, restaurant info, address, phone, opening hours (if available), special notes, cancellation policy, maybe loyalty info if present. Currently only basic fields shown.

## Data available on `BookingRecord`

- From `server/bookings.ts` insert payload includes `booking_type`, `seating_preference`, `customer_phone`, `notes`, `status`, `idempotency_key`, `details` (JSON with request metadata), etc.
- `BookingRecord` also includes `restaurant_id`, `table_id`, `start_at`, `end_at`, `start_time`, `end_time`, `party_size`, `reference`, etc.
- We can surface optional details like seating preference (capitalize), booking type (map to label), waitlist status when `status === 'pending_allocation'`.

## Styling constraints

- Emails must remain inline-styled HTML (no external CSS). Need to build “ticket” aesthetic using table/div layouts: top header for restaurant, tear-line background, data columns (date/time, party, seating), action button.
- Must keep accessible color contrast, fallback fonts (system sans). Provide text-only fallback via `renderText` updates.

## Third-party dependencies

- Email sending via `sendEmail` (Resend). HTML string is built manually; no React email component currently.

## Additional assets

- No direct restaurant-specific assets (logo). We might rely on simple textual header. Could include emoji for icon-like effect.
- Management link remains same.
- Should ensure template handles pending bookings (no table assigned) and includes note when allocation pending.

## Next steps

- Craft ticket-style HTML with sections: header (restaurant name, reference), body with booking specifics, side panel for restaurant contact/policy, footer with manage link.
- Expand text fallback to match new data.
- Ensure copy dynamic for status (confirmed, pending allocation, cancelled updates). Maybe adjust per `type` in dispatch.
