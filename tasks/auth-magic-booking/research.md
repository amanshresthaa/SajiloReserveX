# Research Notes

## Existing Authentication Setup
- Supabase Auth is already integrated via `@supabase/auth-helpers-nextjs`.
  - `middleware.ts` refreshes the Supabase session on every request.
  - `/app/api/auth/callback/route.ts` exchanges the Supabase auth code then redirects to `config.auth.callbackUrl` (currently `/dashboard`).
  - `app/signin/page.tsx` implements OAuth and magic-link (OTP) sign-in using `createClientComponentClient`. Magic link redirects back to `/api/auth/callback` which then forwards to `/dashboard`.
- Config (`config.ts`) exposes `auth.loginUrl` (`/signin`) and `auth.callbackUrl` (`/dashboard`).
- Dashboard layout (`app/dashboard/layout.tsx`) guards access by checking `supabase.auth.getSession()` server-side.

## Booking Flow Overview
- Booking Flow lives in `components/reserve/booking-flow/index.tsx` and is a client component managing multi-step state locally with `useReducer`.
- Booking submission uses a direct `fetch` call to `/api/bookings` with payload containing customer details (name, email, phone, marketing opt-in).
- No authentication is required for booking submission; API relies on service-role Supabase client (`getServiceSupabaseClient`) to upsert customers and create bookings.
- Contact details are persisted to `localStorage` when `rememberDetails` toggle is enabled.
- Booking flow steps (Plan/Details/Review/Confirmation) do not reference Supabase auth state.

## API/Server Considerations
- `/api/bookings` schema allows anonymous submissions; the handler uses Zod validation and upserts customers by email/phone.
- Because service-role key is used server-side, API does not distinguish between authenticated/anonymous callers.
- Customer loyalty, waitlist, etc. all work without knowing the current user session.

## Supabase Utilities & Session Access
- `createServerComponentClient`, `createRouteHandlerClient`, and `createClientComponentClient` wrappers are available, so client components can query `supabase.auth.getSession()` if needed.
- There is no shared auth context in the current booking UI; pages likely rely on Supabase components when necessary (e.g., `app/dashboard`).

## Relevant UX Elements
- Booking CTA lives inside `ReviewStep` (`components/reserve/steps/ReviewStep.tsx`) as `Confirm booking` button.
- Step actions are routed through `onActionsChange`, ultimately feeding the sticky action bar (`StickyProgress`).
- No existing mechanism to conditionally prompt sign-in from booking steps.

## Constraints & Opportunities
- User request: unify account creation/login using magic links with booking confirmation. “Create booking” should also initiate sign-in/signup if needed.
- Magic link flow currently redirects to `/dashboard`; may need dynamic callback to resume booking journey.
- Need to evaluate how to store booking details during auth redirect (e.g., localStorage, query params, Supabase temporary table).
- Review how Supabase auth session interacts with booking API once enforced (likely require JWT validation instead of service role or augment logic to associate booking with authenticated user).

