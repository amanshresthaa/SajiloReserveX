# Implementation Plan: Ops Walk-In Booking Flow

## Objective

Enable restaurant staff to create bookings on behalf of guests via an ops-specific experience that mirrors the customer reservation wizard while relaxing contact requirements (email/phone optional) and tagging resulting bookings as “Created by System”.

## Success Criteria

- [ ] Staff can access a booking flow under `/ops` that matches customer UX but allows optional phone/email.
- [ ] Successful submission creates a confirmed booking for the selected restaurant, tagged as system-created and visible immediately in the ops dashboard.
- [ ] Confirmation email is sent only when an email address is provided.
- [ ] Validation continues to block empty name / invalid formats, and customer-facing flow remains unchanged.
- [ ] Auth & membership enforcement prevent unauthorized booking creation.

## Architecture & Approach

1. **Wizard Extensibility**
   - Introduce a `mode` (customer vs ops) to the Reserve booking wizard stack (`BookingWizard`, `useReservationWizard`, details form schema) to toggle contact requirements and destination endpoint.
   - Provide a new `useCreateOpsReservation` hook that targets `/api/ops/bookings`, includes staff-selected restaurant, and sets booking source metadata.
   - Update `buildReservationDraft` / types to emit `email`/`phone` as `null` when omitted in ops mode.

2. **Ops API Endpoint**
   - Add `POST /api/ops/bookings` route.
   - Validate payload with relaxed schema (email/phone optional but validated when present, restaurantId required, party/date/time bounded).
   - Authenticate via Supabase session, fetch memberships, ensure requester belongs to restaurant.
   - Reuse existing booking insertion utility, forcing `source = 'system'` and enriching `details` (e.g., `{createdBy: 'system', channel: 'ops'}`) for UI display.
   - Trigger side effects (loyalty, notifications) using existing helpers; skip email if `customer_email` null.

3. **Ops UI Integration**
   - Create new ops route (e.g., `/ops/bookings/new`) embedding the wizard.
   - Provide restaurant selector (if multiple memberships) and pass selection to wizard initial details.
   - Ensure navigation returns to dashboard after confirmation or via CTA.
   - Surface “Created by System” label in ops dashboard list & detail view (map `booking.source` or details metadata).

4. **Validation & Tests**
   - Unit test new schema behaviour (optional contact) and `buildReservationDraft` transformation.
   - API route tests covering success, missing membership, optional contact with + without email.
   - Update ops dashboard tests if label assertion added.

## Data Flow Overview

Ops Wizard → `useCreateOpsReservation` → `/api/ops/bookings` → Supabase insert (source=system, optional contact) → triggers side effects → booking appears in ops dashboard via existing summary query.

## Rollout & Follow-up

- No feature flag; limited to authenticated staff via `/ops`.
- Communicate to team that optional contact reduces ability to send confirmations unless supplied.
- Future: consider audit log entries for staff identity (store user id in details).
