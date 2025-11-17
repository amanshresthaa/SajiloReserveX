---
task: my-bookings-revamp
timestamp_utc: 2025-11-17T11:21:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: My bookings guest home revamp

## Objective

Transform `/my-bookings` into a personalized guest home that greets the user, highlights their next visit, surfaces quick actions, and keeps booking management easy.

## Success Criteria

- [ ] Page shows personalized greeting (name fallback to email) with quick CTA buttons.
- [ ] Next booking spotlight and bookings list remain fully functional (search, filters, edit/cancel).
- [ ] Profile completeness prompt visible when name/phone missing; links to Manage profile.
- [ ] Responsive layout verified (mobile/tablet/desktop) with accessible headings and focusable actions.

## Architecture & Components

- `src/app/(guest-account)/my-bookings/page.tsx`: fetch user + profile, compute greeting & profile completeness, pass support email; compose redesigned layout using existing PageShell + shadcn cards.
- `MyBookingsClient`: retain bookings logic; may accept props for inline summary text; keep table/edit/cancel intact.
- New/updated server-rendered sections:
  - Hero card with greeting, subtext, CTA buttons (New booking, Manage profile, Contact support mailto).
  - Next booking spotlight moved higher with friendlier copy.
  - Insight tiles (upcoming count, recent activity, profile completeness) derived from existing bookings/profile data without extra API calls.
  - Guidance + support cards (day-of tips, cancellation help) using `InfoCard`.
- Data/state: keep React Query prefetch for bookings; add server-side profile fetch via `getOrCreateProfile` (existing helper). No new endpoints.

## Data Flow & API Contracts

- Auth: Supabase server client to get user; redirect unauthenticated to `/signin?redirectedFrom=/my-bookings` (unchanged).
- Bookings: unchanged `useBookings` GET `/api/bookings?me=1&page=...` with prefetched query/dehydration.
- Profile: server-side `getOrCreateProfile(supabase, user)` returning `{ name, email, phone, image }` for greeting & completeness.

## UI/UX States

- Loading: bookings table skeletons; hero/tiles render with profile data and safe fallbacks.
- Empty: table empty states still guide booking; hero CTA encourages new booking.
- Error: preserve bookings error alert; hero/actions remain usable.
- Success: greeting, spotlight (if any), insight tiles, quick actions, and guidance cards visible.

## Edge Cases

- Missing profile name/phone → fallback greeting (email prefix) + completeness prompt.
- No bookings → hide spotlight; show “ready for your first booking” messaging.
- Past/cancelled only → spotlight hidden; table filters still usable.
- Playwright skip-prefetch flag respected.

## Testing Strategy

- Manual UI QA via Chrome DevTools MCP (mobile/tablet/desktop), focusing on keyboard nav, focus order, and table interactions.
- Validate auth redirect unchanged.
- Run targeted tests if feasible (e.g., `pnpm test --filter my-bookings` or relevant Playwright spot-check) without overlong runtime.
- Quick a11y review: heading order, button/link roles, focus outlines on CTA grid.

## Rollout

- No feature flag; UX-only change leveraging existing endpoints.
- Monitoring: keep existing analytics events (dashboard_viewed, dashboard_cancel_opened) untouched.
- Kill-switch: revert page if needed; no DB impact.

## DB Change Plan (if applicable)

- Not applicable (UI-only; no schema changes).
