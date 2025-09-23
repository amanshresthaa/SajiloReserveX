# Implementation Plan (Draft)

## Goals
- Require users to be authenticated before finalizing a reservation.
- Use Supabase magic links so the booking flow can create or sign in accounts without forcing a separate visit to `/signin`.
- Ensure the "Confirm booking" action behaves as both authentication trigger (when needed) and booking submission (once authenticated).

## Key Questions
- Where should the user land after clicking the magic link? (Need a booking-specific callback page instead of `/dashboard`).
- How do we persist in-progress booking details through the auth redirect? (Likely `localStorage` or Supabase temp table keyed by a nonce.)
- Do we want to hard-enforce auth on the `/api/bookings` endpoint or softly link bookings to a user if present?

## Proposed Flow
1. **Session Check in Booking Flow**
   - Integrate Supabase client (`createClientComponentClient`) inside `BookingFlowContent`.
   - Track `session`/`user` state via `auth.getSession()` or `onAuthStateChange`.
   - On "Confirm booking" click:
     - If a session exists, proceed with current booking submission.
     - If no session, trigger the auth flow (magic link) and pause booking submission.

2. **Magic Link Trigger from Booking Flow**
   - Use `details.email` (and optionally name) to call `supabase.auth.signInWithOtp` with `emailRedirectTo` pointing to a new route (e.g., `/reserve/auth-complete`).
   - Provide inline feedback (toast/snackbar) and disable buttons while waiting.
   - Persist booking payload locally (e.g., `localStorage.setItem("pendingBooking", JSON.stringify({...}))`). Include timestamp/nonce for cleanup.

3. **Post-Auth Resume Page**
   - Create `/reserve/auth-complete` (client route) that:
     - Uses Supabase client to confirm a session exists.
     - Reads pending booking payload from storage.
     - Replays booking submission (call `/api/bookings`), then redirects to the confirmation step (or rehydrates booking state via query/state updates).
     - Handles missing payload or expired cases gracefully (redirect back to step 1 with message).

4. **Booking API Auth Enforcement**
   - Update `/api/bookings` POST handler to require a Supabase session:
     - Use `getRouteHandlerSupabaseClient` and `supabase.auth.getUser()`; reject with 401 if no user.
     - Optionally still use service client for DB writes but after verifying user (or use Row Level Security with Supabase).
     - Store `user.id` on booking records (requires schema change) if needed for future account views.

5. **UX Tweaks**
   - Modify confirmation step CTA label when auth pending.
   - Provide status indicators (e.g., "Magic link sent" with micro-animation) while awaiting email action.
   - Ensure flow respects reduced motion, subtle haptics.

6. **Configuration Adjustments**
   - Update `config.auth.callbackUrl` or allow dynamic callback derived from storage.
   - Ensure `/api/auth/callback` can redirect to stored callback (e.g., read cookie or search params to return to `/reserve/auth-complete`).

7. **Testing/Verification**
   - Test from clean browser session: attempt booking -> should prompt for magic link, send email, follow link, resume booking.
   - Test already-authenticated user path (should skip magic link, book immediately).
   - Regression test existing `/signin` page and dashboard access.

> This plan is high-level; further breakdown needed before implementation (e.g., schema updates, storage expiration strategy, error handling for OTP failures).

