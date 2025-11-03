# Route User Flows (Pages) — SajiloReserveX

Generated: 2025-11-03 (UTC)

This document outlines start→finish user flows for every page route in the app, including guard/redirect behavior, common next steps, and key references.

Conventions

- Guard: Public (no auth), Auth (requires login), Ops/Admin (restaurant operations).
- Redirect: Unauthed users are redirected to `/signin?redirectedFrom=<route>` where noted.
- Wizard: The booking wizard renders inline (no route change) and navigates to `/thank-you` when closed.

Index

- Marketing & Customer: `/`, `/browse`, `/create`, `/checkout`, `/thank-you`, `/pricing`, `/privacy-policy`, `/tos`, `/terms/togo`, `/terms/venue`
- Booking: `/reserve`, `/reserve/r/[slug]`, `/item/[slug]`, `/reserve/[reservationId]`
- Auth & Account: `/signin`, `/my-bookings`, `/profile/manage`
- Invites: `/invite/[token]`
- Operations (Ops/Admin): `/ops`, `/ops/login`, `/ops/bookings`, `/ops/bookings/new`, `/ops/team`, `/ops/restaurant-settings`, `/ops/customer-details`, `/ops/tables`, `/ops/rejections`
- Blog: `/blog`, `/blog/[articleId]`, `/blog/author/[authorId]`, `/blog/category/[categoryId]`

---

## `/` (Home)

- Guard: Public
- Entry: Direct visit or marketing links
- Actions: Navigate via navbar/CTA to `/signin`, `/create`, `/browse`, venue pages
- Next:
  - Sign in: `/signin` → callback → returns to origin or fallback
  - Explore venues: `/browse` or direct venue `/reserve/r/[slug]`/`/item/[slug]`
- Refs: `components/customer/navigation/CustomerNavbar.tsx`

## `/signin` (Sign In)

- Guard: Public
- Entry: From Home or any redirect `?redirectedFrom=<route>`
- Actions: Submit credentials/magic-link → `/api/auth/callback`
- Next: Callback redirects to `redirectedFrom` if safe, else fallback (usually `/`)
- Refs: `src/app/signin/page.tsx`, `src/app/api/auth/callback/route.ts`

## `/browse` (Browse Restaurants)

- Guard: Public
- Entry: From Home/marketing
- Actions: Filter and choose a venue card
- Next: Venue booking at `/reserve/r/[slug]`
- Refs: `components/marketing/RestaurantBrowser.tsx` (links to `/reserve/r/${slug}`)

## `/create` (Start a Reservation)

- Guard: Public
- Entry: From Home/marketing
- Actions: Discovery and CTAs (start, sign-in)
- Next:
  - Start new reservation: often proceeds to venue selection `/reserve/r/[slug]`
  - See checkout guide: `/checkout`
- Refs: `src/app/create/page.tsx`

## `/checkout` (Guide)

- Guard: Public
- Entry: From `/create`
- Actions: Review steps and use CTAs
- Next: `View upcoming bookings` → `/my-bookings`; `Start a new reservation` → `/create`
- Refs: `src/app/checkout/page.tsx`

## `/thank-you` (Post‑Booking)

- Guard: Public (today)
- Entry: From booking wizard Close, or direct with `?token=`
- Actions: If `?token=<confirmationToken>`, loads details via `/api/bookings/confirm` and shows booking summary; otherwise, generic thank-you content
- Next: Home `/` or make another booking
- Refs: `src/app/thank-you/page.tsx`, `src/app/api/bookings/confirm/route.ts`

## `/pricing`

- Guard: Public
- Entry: From marketing
- Actions: Read pricing; CTA to start booking
- Next: `/create` or venue pages

## `/privacy-policy`, `/tos`, `/terms/togo`, `/terms/venue`

- Guard: Public
- Entry: From footer/links
- Actions: Read docs; navigate onward
- Next: Home `/`, `/create`, or venue

## `/reserve` (Search/Landing)

- Guard: Public
- Entry: From marketing; general reservation landing/search
- Actions: Find a venue/time and proceed
- Next: Venue booking at `/reserve/r/[slug]`
- Refs: `src/app/reserve/page.tsx`

## `/reserve/r/[slug]` (Restaurant Booking)

- Guard: Public
- Entry: From browse/create/marketing links
- Actions: Booking wizard (Plan → Details → Review → Confirmation)
  - Submit: POST `/api/bookings` (returns `booking` and optional `confirmationToken`)
- Next: Inline confirmation → `Close` → `/thank-you`
- Refs: `src/app/reserve/r/[slug]/page.tsx`, `components/reserve/booking-flow/**`, `src/app/api/bookings/route.ts`

## `/item/[slug]` (Alternate Venue Entry)

- Guard: Public
- Entry: From marketing or internal links
- Actions: Same booking wizard as above
- Next: Inline confirmation → `Close` → `/thank-you`
- Refs: `src/app/item/[slug]/page.tsx`

## `/reserve/[reservationId]` (Reservation Detail)

- Guard: Auth
- Entry: From My Bookings or direct link
- Redirect: Unauthed → `/signin?redirectedFrom=/reserve/<id>`
- Actions: View details, share, download confirmation, react to offline
- Next: Back to `/my-bookings`
- Refs: `src/app/reserve/[reservationId]/page.tsx`, `ReservationDetailClient.tsx`

## `/my-bookings` (Customer Dashboard)

- Guard: Auth
- Redirect: Unauthed → `/signin?redirectedFrom=/my-bookings`
- Entry: From checkout link, navbar, or post‑login
- Actions: View upcoming bookings list (server-prefetch)
- Next: Open individual reservation at `/reserve/[reservationId]`
- Refs: `src/app/(authed)/my-bookings/page.tsx`

## `/profile/manage` (Profile)

- Guard: Auth
- Redirect: Unauthed → `/signin?redirectedFrom=/profile/manage`
- Entry: From account menus
- Actions: Manage avatar and profile
- Next: Back to Home or My Bookings
- Refs: `src/app/(authed)/profile/manage/page.tsx`

## `/invite/[token]` (Team Invite)

- Guard: Public (token‑gated state)
- Entry: From invite email link
- Actions:
  - Invalid states: not found/revoked/accepted/expired
  - Valid: accept invite (name/password) → POST `/api/team/invitations/:token/accept`
- Next: Attempt sign-in; on success → `/ops`; on failure, remain with instructions
- Refs: `src/app/invite/[token]/page.tsx`, `components/invite/InviteAcceptanceClient.tsx`

## `/ops/login` (Ops Sign In)

- Guard: Public
- Entry: From ops CTAs or redirects
- Actions: Sign in; callback to `/api/auth/callback`
- Next: `/ops` via `redirectedFrom` parameter
- Refs: `src/app/(ops)/ops/(public)/login/page.tsx`

## `/ops` (Ops Dashboard)

- Guard: Ops/Admin
- Redirect: Unauthed → `/signin?redirectedFrom=/ops`
- Entry: From ops login/callback
- Actions: View today’s status; links to bookings, team, settings
- Next: `/ops/bookings`, `/ops/bookings/new`, `/ops/team`, `/ops/restaurant-settings`
- Refs: `src/app/(ops)/ops/(app)/page.tsx`

## `/ops/bookings` (Ops Bookings List)

- Guard: Ops/Admin
- Redirect: Unauthed → `/signin?redirectedFrom=/ops/bookings`
- Entry: From ops dashboard
- Actions: Browse/manage bookings, export
- Next: Create walk‑in `/ops/bookings/new`, or open details (internal UI)
- Refs: `src/app/(ops)/ops/(app)/bookings/page.tsx`

## `/ops/bookings/new` (Walk‑In Booking)

- Guard: Ops/Admin
- Redirect: Unauthed → `/signin?redirectedFrom=/ops/bookings/new`
- Entry: From ops bookings or dashboard
- Actions: Booking wizard in ops mode (records walk‑ins)
- Next: On Close: back to `/ops`
- Refs: `src/app/(ops)/ops/(app)/bookings/new/page.tsx`, `src/components/features/walk-in/OpsWalkInBookingClient.tsx`

## `/ops/team` (Team Management)

- Guard: Ops/Admin
- Redirect: Unauthed → `/signin?redirectedFrom=/ops/team`
- Entry: From ops sidebar
- Actions: Create/revoke invites via `/api/owner/team/invitations*`
- Next: Back to `/ops`
- Refs: `src/app/(ops)/ops/(app)/team/page.tsx`

## `/ops/restaurant-settings` (Settings)

- Guard: Ops/Admin
- Redirect: Unauthed → `/signin?redirectedFrom=/ops/restaurant-settings`
- Entry: From ops sidebar
- Actions: Edit restaurant profile/timezone/capacity
- Next: Back to `/ops`
- Refs: `src/app/(ops)/ops/(app)/restaurant-settings/page.tsx`

## `/ops/customer-details` (Customer Details)

- Guard: Ops/Admin
- Redirect: Unauthed → `/signin?redirectedFrom=/ops/customer-details`
- Entry: From ops
- Actions: View customer info
- Next: Back to `/ops`
- Refs: `src/app/(ops)/ops/(app)/customer-details/page.tsx`

## `/ops/tables` (Tables)

- Guard: Ops/Admin
- Entry: From ops
- Actions: Manage tables (UI)
- Next: Back to `/ops`
- Refs: `src/app/(ops)/ops/(app)/tables/page.tsx`

## `/ops/rejections` (Rejections)

- Guard: Ops/Admin
- Redirect: Unauthed → `/signin?redirectedFrom=/ops/rejections`
- Entry: From ops
- Actions: Review rejections
- Next: Back to `/ops`
- Refs: `src/app/(ops)/ops/(app)/rejections/page.tsx`

## `/blog` (Articles)

- Guard: Public
- Entry: From marketing/footer
- Actions: Read posts, navigate to article/author/category
- Next: `/blog/[articleId]`, `/blog/author/[authorId]`, `/blog/category/[categoryId]`

## `/blog/[articleId]` (Article)

- Guard: Public
- Entry: From blog listing or links
- Actions: Read article; navigate back or explore more
- Next: `/blog`, author/category pages

## `/blog/author/[authorId]` (Author)

- Guard: Public
- Entry: From article byline or author links
- Actions: View author’s posts
- Next: `/blog`, specific article

## `/blog/category/[categoryId]` (Category)

- Guard: Public
- Entry: From listing/category tags
- Actions: View category posts
- Next: `/blog`, specific article

---

# Appendix — Example Flow Snippets

Home → Sign In

- Click navbar “Sign in” on `/` → go to `/signin`
- Complete auth → `/api/auth/callback` → redirect to origin or fallback (`/`)

Browse → Venue → Book

- `/browse` → select a venue card → `/reserve/r/[slug]`
- Complete wizard → Close → `/thank-you`

Ops Login → Dashboard

- Visit `/ops` unauth → redirect to `/signin?redirectedFrom=/ops`
- After auth callback → land on `/ops`

Thank‑You with Token

- Wizard returns `confirmationToken` (optional) → navigate `/thank-you?token=...`
- Page fetches via `/api/bookings/confirm` and renders booking details
